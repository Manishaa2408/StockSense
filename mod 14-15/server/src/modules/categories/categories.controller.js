const service = require('./categories.service');
const ApiResponse = require('../../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const { search, status } = req.query;
    const categories = await service.getAll({ search, status });
    return ApiResponse.success(res, 'Categories fetched successfully', categories);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const category = await service.getById(req.params.id);
    return ApiResponse.success(res, 'Category details fetched successfully', category);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const category = await service.create(req.body);
    return ApiResponse.created(res, 'Category created successfully', category);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const category = await service.update(req.params.id, req.body);
    return ApiResponse.success(res, 'Category updated successfully', category);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const category = await service.updateStatus(req.params.id, req.body.status);
    return ApiResponse.success(res, `Category status changed to ${req.body.status}`, category);
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
