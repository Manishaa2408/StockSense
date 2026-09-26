const service = require('./units.service');
const ApiResponse = require('../../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const units = await service.getAll();
    return ApiResponse.success(res, 'Units fetched successfully', units);
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

module.exports = {
  getAll,
  create
};
