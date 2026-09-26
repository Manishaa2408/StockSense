const suppliersService = require('./suppliers.service');
const ApiResponse = require('../../utils/ApiResponse');

class SuppliersController {
  async getAll(req, res, next) {
    try {
      const { search, status } = req.query;
      const data = await suppliersService.getAll({ search, status });
      return ApiResponse.success(res, 'Suppliers retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const data = await suppliersService.getById(id);
      return ApiResponse.success(res, 'Supplier retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const data = await suppliersService.create(req.body);
      return ApiResponse.success(res, 'Supplier created successfully', data, 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { id } = req.params;
      const data = await suppliersService.update(id, req.body);
      return ApiResponse.success(res, 'Supplier updated successfully', data);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const data = await suppliersService.updateStatus(id, status);
      return ApiResponse.success(res, 'Supplier status updated successfully', data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SuppliersController();
