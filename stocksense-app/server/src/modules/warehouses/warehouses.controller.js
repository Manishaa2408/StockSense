const service = require('./warehouses.service');
const ApiResponse = require('../../utils/ApiResponse');

class WarehousesController {
  async getAll(req, res, next) {
    try {
      const { search, status } = req.query;
      const warehouses = await service.getAll({ search, status });
      ApiResponse.success(res, 'Warehouses retrieved successfully', warehouses);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const warehouse = await service.getById(req.params.id);
      ApiResponse.success(res, 'Warehouse retrieved successfully', warehouse);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const warehouse = await service.create(req.body);
      ApiResponse.created(res, 'Warehouse created successfully', warehouse);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const warehouse = await service.update(req.params.id, req.body);
      ApiResponse.success(res, 'Warehouse updated successfully', warehouse);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const warehouse = await service.updateStatus(req.params.id, req.body.status);
      ApiResponse.success(res, 'Warehouse status updated successfully', warehouse);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WarehousesController();
