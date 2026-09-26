const service = require('./categories.service');
const ApiResponse = require('../../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const categories = await service.getAll();
    return ApiResponse.success(res, 'Categories fetched successfully', categories);
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

module.exports = {
  getAll,
  create
};
