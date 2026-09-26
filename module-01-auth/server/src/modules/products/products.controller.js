const service = require('./products.service');
const ApiResponse = require('../../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const { page, limit, search, category_id, unit_id, status } = req.query;
    const result = await service.getAll({ page, limit, search, category_id, unit_id, status });
    return ApiResponse.success(res, 'Products fetched successfully', result.products, 200, { meta: result.pagination });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const product = await service.getById(req.params.id);
    return ApiResponse.success(res, 'Product fetched successfully', product);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const product = await service.create(req.body, req.user.id);
    return ApiResponse.created(res, 'Product created successfully', product);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const product = await service.update(req.params.id, req.body, req.user.id);
    return ApiResponse.success(res, 'Product updated successfully', product);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const product = await service.updateStatus(req.params.id, req.body.status, req.user.id);
    return ApiResponse.success(res, `Product status changed to ${req.body.status}`, product);
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
