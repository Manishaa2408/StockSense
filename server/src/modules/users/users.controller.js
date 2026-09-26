const service = require('./users.service');
const ApiResponse = require('../../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search,
      status: req.query.status,
      role_id: req.query.role_id
    };
    const data = await service.getAll(filters);
    return ApiResponse.success(res, 'Users fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id);
    return ApiResponse.success(res, 'User fetched successfully', { user: data });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body);
    return ApiResponse.created(res, 'User created successfully', { user: data });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body);
    return ApiResponse.success(res, 'User updated successfully', { user: data });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const data = await service.updateStatus(req.params.id, req.body.status);
    return ApiResponse.success(res, 'User status updated successfully', { user: data });
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const data = await service.updateRole(req.params.id, req.body.role_id);
    return ApiResponse.success(res, 'User role updated successfully', { user: data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateStatus,
  updateRole
};
