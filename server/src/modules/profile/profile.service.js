const db = require('../../config/database');
const bcrypt = require('bcryptjs');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

const getProfile = async (userId) => {
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

  user.permissions = rolePermissions.map(p => `${p.module}.${p.action}`);

  delete user.password_hash;
  return user;
};

const updateProfile = async (userId, data) => {
  const user = await db('users').where({ id: userId }).first();
  if (!user) {
    throw ApiError.notFound(errorCodes.USER_NOT_FOUND, 'User not found');
  }

  const updateData = {};
  if (data.first_name !== undefined) updateData.first_name = data.first_name;
  if (data.last_name !== undefined) updateData.last_name = data.last_name;
  if (data.phone !== undefined) updateData.phone = data.phone;

  if (Object.keys(updateData).length > 0) {
    updateData.updated_at = db.fn.now();
    await db('users').where({ id: userId }).update(updateData);
  }

  return await getProfile(userId);
};

const changePassword = async (userId, currentPassword, newPassword, currentTokenId) => {
  const user = await db('users').where({ id: userId }).first();
  if (!user) {
    throw ApiError.notFound(errorCodes.USER_NOT_FOUND, 'User not found');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    throw ApiError.unauthorized(errorCodes.AUTH_INVALID_CREDENTIALS, 'Incorrect current password');
  }

  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(newPassword, salt);

  await db.transaction(async trx => {
    await trx('users').where({ id: userId }).update({ password_hash, updated_at: db.fn.now() });
    
    // Delete all other refresh tokens except the current one
    if (currentTokenId) {
      await trx('refresh_tokens')
        .where({ user_id: userId })
        .andWhere('id', '!=', currentTokenId)
        .del();
    } else {
      await trx('refresh_tokens').where({ user_id: userId }).del();
    }
  });
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};
