const db = require('../../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const config = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');
const events = require('../../constants/events');
const { logEvent } = require('../../utils/logger');
const { generateOtp, hashOtp, verifyOtp: checkOtp } = require('../../utils/otp');
const { sendMail } = require('../../config/mail');

const register = async (data) => {
  const existingUser = await db('users').where({ email: data.email }).first();
  if (existingUser) {
    throw ApiError.badRequest(errorCodes.AUTH_EMAIL_ALREADY_EXISTS, 'Email already exists');
  }

  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(data.password, salt);

  const role = await db('roles').where({ name: 'Warehouse Staff' }).first();
  if (!role) {
    throw ApiError.badRequest(errorCodes.ROLE_NOT_FOUND, 'Default role not found');
  }

  const [id] = await db('users').insert({
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone: data.phone || null,
    password_hash,
    role_id: role.id,
    status: 'ACTIVE',
    email_verified: false
  });

  logEvent(events.USER_REGISTERED, { userId: id, email: data.email });

  const user = await db('users').where({ id }).first();
  delete user.password_hash;
  return user;
};

const login = async (email, password) => {
  const user = await db('users')
    .join('roles', 'users.role_id', '=', 'roles.id')
    .select('users.*', 'roles.name as role_name')
    .where('users.email', email)
    .first();

  if (!user) {
    throw ApiError.unauthorized(errorCodes.AUTH_INVALID_CREDENTIALS, 'Invalid email or password');
  }

  if (user.status === 'PENDING_VERIFICATION') {
    throw ApiError.unauthorized(errorCodes.AUTH_ACCOUNT_NOT_VERIFIED, 'Account pending verification');
  } else if (user.status === 'SUSPENDED') {
    throw ApiError.unauthorized(errorCodes.AUTH_ACCOUNT_SUSPENDED, 'Account suspended');
  } else if (user.status === 'DEACTIVATED') {
    throw ApiError.unauthorized(errorCodes.AUTH_ACCOUNT_DEACTIVATED, 'Account deactivated');
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw ApiError.unauthorized(errorCodes.AUTH_INVALID_CREDENTIALS, 'Invalid email or password');
  }

  const tokenId = uuidv4();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const [insertedId] = await db('refresh_tokens').insert({
    user_id: user.id,
    token_hash: tokenId,
    expires_at: expiresAt
  });

  const token = jwt.sign(
    { userId: user.id, tokenId: insertedId },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );

  await db('users').where({ id: user.id }).update({ last_login_at: db.fn.now() });

  const rolePermissions = await db('role_permissions')
    .join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
    .where('role_permissions.role_id', user.role_id)
    .select('permissions.module', 'permissions.action');

  const permissions = rolePermissions.map(p => `${p.module}.${p.action}`);

  logEvent(events.USER_LOGIN_SUCCESS, { userId: user.id, email: user.email });

  delete user.password_hash;

  return { user, token, permissions };
};

const logout = async (userId, tokenId) => {
  await db('refresh_tokens').where({ id: tokenId, user_id: userId }).del();
  logEvent(events.USER_LOGOUT, { userId });
};

const getMe = async (userId) => {
  const user = await db('users')
    .join('roles', 'users.role_id', '=', 'roles.id')
    .select('users.*', 'roles.name as role_name')
    .where('users.id', userId)
    .first();

  if (!user) {
    throw ApiError.notFound(errorCodes.USER_NOT_FOUND, 'User not found');
  }

  const rolePermissions = await db('role_permissions')
    .join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
    .where('role_permissions.role_id', user.role_id)
    .select('permissions.module', 'permissions.action');

  const permissions = rolePermissions.map(p => `${p.module}.${p.action}`);

  delete user.password_hash;
  return { user, permissions };
};

const forgotPassword = async (email) => {
  const user = await db('users').where({ email }).first();
  if (!user) return; // Don't reveal email existence

  await db('password_reset_tokens').where({ user_id: user.id }).del();

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  await db('password_reset_tokens').insert({
    user_id: user.id,
    otp_hash: otpHash,
    expires_at: expiresAt,
    attempts: 0,
    max_attempts: 3
  });

  const html = `
    <h2>Password Reset</h2>
    <p>Your OTP for password reset is: <strong>${otp}</strong></p>
    <p>This OTP will expire in 10 minutes.</p>
  `;

  await sendMail(email, 'StockSense - Password Reset OTP', html);
  logEvent(events.PASSWORD_RESET_REQUESTED, { userId: user.id, email });

  const isDev = config.NODE_ENV === 'development';
  return {
    sent: true,
    ...(isDev ? { devOtp: otp } : {})
  };
};

const verifyOtp = async (email, otp) => {
  const user = await db('users').where({ email }).first();
  if (!user) throw ApiError.notFound(errorCodes.USER_NOT_FOUND, 'User not found');

  const tokenRecord = await db('password_reset_tokens')
    .where({ user_id: user.id, used: false })
    .andWhere('expires_at', '>', db.fn.now())
    .orderBy('created_at', 'desc')
    .first();

  if (!tokenRecord) {
    throw ApiError.badRequest(errorCodes.AUTH_OTP_EXPIRED, 'OTP expired or not requested');
  }

  if (tokenRecord.attempts >= tokenRecord.max_attempts) {
    throw ApiError.badRequest(errorCodes.AUTH_OTP_MAX_ATTEMPTS, 'Maximum OTP attempts exceeded');
  }

  await db('password_reset_tokens').where({ id: tokenRecord.id }).increment('attempts', 1);

  const isValid = await checkOtp(otp, tokenRecord.otp_hash);
  if (!isValid) {
    throw ApiError.badRequest(errorCodes.AUTH_OTP_INVALID, 'Invalid OTP');
  }

  logEvent(events.OTP_VERIFIED, { userId: user.id, email });
  return { verified: true, message: 'OTP verified successfully' };
};

const resetPassword = async (data) => {
  const { email, otp, new_password } = data;
  
  const user = await db('users').where({ email }).first();
  if (!user) throw ApiError.notFound(errorCodes.USER_NOT_FOUND, 'User not found');

  const tokenRecord = await db('password_reset_tokens')
    .where({ user_id: user.id, used: false })
    .andWhere('expires_at', '>', db.fn.now())
    .orderBy('created_at', 'desc')
    .first();

  if (!tokenRecord) {
    throw ApiError.badRequest(errorCodes.AUTH_OTP_EXPIRED, 'OTP expired');
  }

  const isValid = await checkOtp(otp, tokenRecord.otp_hash);
  if (!isValid) {
    throw ApiError.badRequest(errorCodes.AUTH_OTP_INVALID, 'Invalid OTP');
  }

  await db.transaction(async trx => {
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(new_password, salt);

    await trx('users').where({ id: user.id }).update({ password_hash });
    await trx('password_reset_tokens').where({ id: tokenRecord.id }).update({ used: true });
    await trx('password_reset_tokens').where({ user_id: user.id }).del();
    await trx('refresh_tokens').where({ user_id: user.id }).del();
  });

  logEvent(events.PASSWORD_RESET_COMPLETED, { userId: user.id, email });
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  verifyOtp,
  resetPassword
};
