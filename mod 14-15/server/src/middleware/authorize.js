const db = require('../config/database');
const ApiError = require('../utils/ApiError');
const errorCodes = require('../constants/errorCodes');

const authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized(errorCodes.AUTH_UNAUTHORIZED, 'User not authenticated');
      }

      if (requiredPermissions.length === 0) {
        return next();
      }

      const userPermissions = await db('role_permissions')
        .join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
        .where('role_permissions.role_id', req.user.role_id)
        .select('permissions.module', 'permissions.action');

      const permissionStrings = userPermissions.map(p => `${p.module}.${p.action}`);

      const isSuperOrAdmin = req.user.role_name === 'Inventory Manager' || req.user.role_name === 'ADMIN' || req.user.role_name === 'Super Admin';

      if (!hasAllPermissions && !isSuperOrAdmin) {
        throw ApiError.forbidden(errorCodes.AUTH_FORBIDDEN, 'Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = authorize;
