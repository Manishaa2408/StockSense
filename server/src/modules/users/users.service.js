const db = require('../../config/database');
const bcrypt = require('bcryptjs');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');
const events = require('../../constants/events');
const { logEvent } = require('../../utils/logger');

const getAll = async ({ page, limit, search, status, role_id }) => {
  const query = db('users')
    .join('roles', 'users.role_id', '=', 'roles.id')
    .select('users.id', 'users.first_name', 'users.last_name', 'users.email', 'users.phone', 'users.role_id', 'users.status', 'users.email_verified', 'users.last_login_at', 'users.created_at', 'roles.name as role_name');

  const countQuery = db('users').count('* as total');

  if (search) {
    const searchTerms = `%${search}%`;
    query.where(function() {
      this.where('users.first_name', 'like', searchTerms)
        .orWhere('users.last_name', 'like', searchTerms)
        .orWhere('users.email', 'like', searchTerms);
    });
    countQuery.where(function() {
      this.where('first_name', 'like', searchTerms)
        .orWhere('last_name', 'like', searchTerms)
        .orWhere('email', 'like', searchTerms);
    });
  }

  if (status) {
    query.where('users.status', status);
    countQuery.where('status', status);
  }

  if (role_id) {
    query.where('users.role_id', role_id);
    countQuery.where('role_id', role_id);
  }

  const [{ total }] = await countQuery;
  const offset = (page - 1) * limit;

  const users = await query.orderBy('users.created_at', 'desc').limit(limit).offset(offset);

  return {
    users,
    pagination: {
      page,
      limit,
      total: parseInt(total),
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getById = async (id) => {
  const user = await db('users')
    .join('roles', 'users.role_id', '=', 'roles.id')
    .select('users.*', 'roles.name as role_name')
    .where('users.id', id)
    .first();

  if (!user) {
    throw ApiError.notFound(errorCodes.USER_NOT_FOUND, 'User not found');
  }

  delete user.password_hash;

  const rolePermissions = await db('role_permissions')
    .join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
    .where('role_permissions.role_id', user.role_id)
    .select('permissions.module', 'permissions.action');

  user.permissions = rolePermissions.map(p => `${p.module}.${p.action}`);

  return user;
};

const create = async (data) => {
  const existingEmail = await db('users').where({ email: data.email }).first();
  if (existingEmail) {
    throw ApiError.badRequest(errorCodes.AUTH_EMAIL_ALREADY_EXISTS, 'Email already exists');
  }

  const roleExists = await db('roles').where({ id: data.role_id }).first();
  if (!roleExists) {
    throw ApiError.badRequest(errorCodes.ROLE_NOT_FOUND, 'Role not found');
  }

  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash(data.password, salt);

  const [id] = await db('users').insert({
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone: data.phone || null,
    password_hash,
    role_id: data.role_id,
    status: 'ACTIVE',
    email_verified: false
  });

  logEvent(events.USER_CREATED, { userId: id, email: data.email });

  return await getById(id);
};

const update = async (id, data) => {
  const user = await db('users').where({ id }).first();
  if (!user) {
    throw ApiError.notFound(errorCodes.USER_NOT_FOUND, 'User not found');
  }

  const updateData = {};
  if (data.first_name !== undefined) updateData.first_name = data.first_name;
  if (data.last_name !== undefined) updateData.last_name = data.last_name;
  if (data.phone !== undefined) updateData.phone = data.phone;

  if (Object.keys(updateData).length > 0) {
    updateData.updated_at = db.fn.now();
    await db('users').where({ id }).update(updateData);
  }

  return await getById(id);
};

const updateStatus = async (id, status) => {
  const user = await db('users').where({ id }).first();
  if (!user) {
    throw ApiError.notFound(errorCodes.USER_NOT_FOUND, 'User not found');
  }

  const oldStatus = user.status;
  await db('users').where({ id }).update({ status, updated_at: db.fn.now() });

  if (status === 'SUSPENDED' || status === 'DEACTIVATED') {
    await db('refresh_tokens').where({ user_id: id }).del();
  }

  logEvent(events.USER_STATUS_CHANGED, { userId: id, oldStatus, newStatus: status });

  return await getById(id);
};

const updateRole = async (id, roleId) => {
  const user = await db('users').where({ id }).first();
  if (!user) {
    throw ApiError.notFound(errorCodes.USER_NOT_FOUND, 'User not found');
  }

  const roleExists = await db('roles').where({ id: roleId }).first();
  if (!roleExists) {
    throw ApiError.badRequest(errorCodes.ROLE_NOT_FOUND, 'Role not found');
  }

  const oldRoleId = user.role_id;
  await db('users').where({ id }).update({ role_id: roleId, updated_at: db.fn.now() });

  logEvent(events.USER_ROLE_CHANGED, { userId: id, oldRoleId, newRoleId: roleId });

  return await getById(id);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  updateRole
};
