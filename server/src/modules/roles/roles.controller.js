const service = require('./roles.service');
const ApiResponse = require('../../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll();
    return ApiResponse.success(res, 'Roles fetched successfully', { roles: data });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id);
    return ApiResponse.success(res, 'Role fetched successfully', { role: data });
  } catch (error) {
    next(error);
  }
};

const getPermissions = async (req, res, next) => {
  try {
    const data = await service.getPermissions(req.params.id);
    return ApiResponse.success(res, 'Permissions fetched successfully', { permissions: data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  getPermissions
};
