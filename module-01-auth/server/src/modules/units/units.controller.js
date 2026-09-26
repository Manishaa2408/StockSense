const service = require('./units.service');
const ApiResponse = require('../../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const { search, unit_type, status } = req.query;
    const units = await service.getAll({ search, unit_type, status });
    return ApiResponse.success(res, 'Units fetched successfully', units);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const unit = await service.getById(req.params.id);
    return ApiResponse.success(res, 'Unit fetched successfully', unit);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const unit = await service.create(req.body);
    return ApiResponse.created(res, 'Unit created successfully', unit);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const unit = await service.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Unit updated successfully', unit);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const unit = await service.updateStatus(req.params.id, req.body.status);
    return ApiResponse.success(res, `Unit status changed to ${req.body.status}`, unit);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateStatus
};
