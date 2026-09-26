const inventoryService = require('./inventory.service');
const ApiResponse = require('../../utils/ApiResponse');

class InventoryController {
  async getAll(req, res, next) {
    try {
      const result = await inventoryService.getAll(req.query);
      return res.status(200).json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await inventoryService.getById(req.params.id);
      return res.status(200).json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getStockSummary(req, res, next) {
    try {
      const result = await inventoryService.getStockSummary(req.query);
      return res.status(200).json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  async increaseStock(req, res, next) {
    try {
      const result = await inventoryService.increaseStock(req.body);
      return res.status(200).json(ApiResponse.success(result, 'Stock increased successfully'));
    } catch (error) {
      next(error);
    }
  }

  async decreaseStock(req, res, next) {
    try {
      const result = await inventoryService.decreaseStock(req.body);
      return res.status(200).json(ApiResponse.success(result, 'Stock decreased successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryController();
