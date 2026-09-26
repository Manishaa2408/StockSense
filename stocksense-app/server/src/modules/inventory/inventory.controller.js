const inventoryService = require('./inventory.service');
const ApiResponse = require('../../utils/ApiResponse');

class InventoryController {
  async getAll(req, res, next) {
    try {
      const result = await inventoryService.getAll(req.query);
      return ApiResponse.success(res, 'Inventory items fetched successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await inventoryService.getById(req.params.id);
      return ApiResponse.success(res, 'Inventory item fetched successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getStockSummary(req, res, next) {
    try {
      const result = await inventoryService.getStockSummary(req.query);
      return ApiResponse.success(res, 'Stock summary fetched successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async increaseStock(req, res, next) {
    try {
      const result = await inventoryService.increaseStock(req.body);
      return ApiResponse.success(res, 'Stock increased successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async decreaseStock(req, res, next) {
    try {
      const result = await inventoryService.decreaseStock(req.body);
      return ApiResponse.success(res, 'Stock decreased successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryController();
