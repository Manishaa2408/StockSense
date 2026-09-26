const service = require('./locations.service');
const ApiResponse = require('../../utils/ApiResponse');

class LocationsController {
  async getAll(req, res, next) {
    try {
      const { search, status, warehouse_id } = req.query;
      const locations = await service.getAll({ search, status, warehouse_id });
      ApiResponse.success(res, 'Locations retrieved successfully', locations);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const location = await service.getById(req.params.id);
      ApiResponse.success(res, 'Location retrieved successfully', location);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const location = await service.create(req.body);
      ApiResponse.created(res, 'Location created successfully', location);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const location = await service.update(req.params.id, req.body);
      ApiResponse.success(res, 'Location updated successfully', location);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const location = await service.updateStatus(req.params.id, req.body.status);
      ApiResponse.success(res, 'Location status updated successfully', location);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LocationsController();
