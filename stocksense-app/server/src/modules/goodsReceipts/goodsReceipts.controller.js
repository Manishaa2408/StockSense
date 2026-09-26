const goodsReceiptsService = require('./goodsReceipts.service');
const ApiResponse = require('../../utils/ApiResponse');

class GoodsReceiptsController {
  async getAll(req, res, next) {
    try {
      const result = await goodsReceiptsService.getAll(req.query);
      return res.status(200).json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await goodsReceiptsService.getById(req.params.id);
      return res.status(200).json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const result = await goodsReceiptsService.create(req.body, req.user.id);
      return res.status(201).json(ApiResponse.success(result, 'Goods receipt created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const result = await goodsReceiptsService.update(req.params.id, req.body, req.user.id);
      return res.status(200).json(ApiResponse.success(result, 'Goods receipt updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  async markReceived(req, res, next) {
    try {
      const result = await goodsReceiptsService.markReceived(req.params.id, req.user.id);
      return res.status(200).json(ApiResponse.success(result, 'Goods receipt marked as received'));
    } catch (error) {
      next(error);
    }
  }

  async confirm(req, res, next) {
    try {
      const result = await goodsReceiptsService.confirm(req.params.id, req.user.id);
      return res.status(200).json(ApiResponse.success(result, 'Goods receipt confirmed successfully'));
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const { reason } = req.body;
      const result = await goodsReceiptsService.cancel(req.params.id, reason, req.user.id);
      return res.status(200).json(ApiResponse.success(result, 'Goods receipt canceled successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GoodsReceiptsController();
