const goodsReceiptsService = require('./goodsReceipts.service');
const ApiResponse = require('../../utils/ApiResponse');

class GoodsReceiptsController {
  async getAll(req, res, next) {
    try {
      const result = await goodsReceiptsService.getAll(req.query);
      return ApiResponse.success(res, 'Goods receipts fetched successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await goodsReceiptsService.getById(req.params.id);
      return ApiResponse.success(res, 'Goods receipt fetched successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const result = await goodsReceiptsService.create(req.body, req.user.id);
      return ApiResponse.created(res, 'Goods receipt created successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const result = await goodsReceiptsService.update(req.params.id, req.body, req.user.id);
      return ApiResponse.success(res, 'Goods receipt updated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async markReceived(req, res, next) {
    try {
      const result = await goodsReceiptsService.markReceived(req.params.id, req.user.id);
      return ApiResponse.success(res, 'Goods receipt marked as received', result);
    } catch (error) {
      next(error);
    }
  }

  async confirm(req, res, next) {
    try {
      const result = await goodsReceiptsService.confirm(req.params.id, req.user.id);
      return ApiResponse.success(res, 'Goods receipt confirmed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const { reason } = req.body;
      const result = await goodsReceiptsService.cancel(req.params.id, reason, req.user.id);
      return ApiResponse.success(res, 'Goods receipt canceled successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GoodsReceiptsController();
