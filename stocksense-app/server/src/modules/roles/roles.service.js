const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

const getAll = async () => {
  const roles = await db('roles').select('*').orderBy('id', 'asc');
  return roles;
};

const getById = async (id) => {
  const role = await db('roles').where({ id }).first();
  if (!role) {
    throw ApiError.notFound(errorCodes.ROLE_NOT_FOUND, 'Role not found');
  }

  const permissions = await getPermissions(id);
  role.permissions = permissions;

  return role;
};

const getPermissions = async (roleId) => {
  const roleExists = await db('roles').where({ id: roleId }).first();
  if (!roleExists) {
    throw ApiError.notFound(errorCodes.ROLE_NOT_FOUND, 'Role not found');
  }

  const permissions = await db('role_permissions')
    .join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
    .where('role_permissions.role_id', roleId)
    .select('permissions.id', 'permissions.module', 'permissions.action', 'permissions.description');

  return permissions;
};

module.exports = {
  getAll,
  getById,
  getPermissions
};
