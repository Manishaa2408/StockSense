const stockTransferService = require('./stockTransfers.service');
const ApiResponse = require('../../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const result = await stockTransferService.getAll(req.query);
    return ApiResponse.success(res, 'Stock transfers retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const transfer = await stockTransferService.getById(req.params.id);
    return ApiResponse.success(res, 'Stock transfer retrieved successfully', transfer);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const transfer = await stockTransferService.create(req.body, req.user);
    return ApiResponse.created(res, 'Stock transfer created successfully in DRAFT status', transfer);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const transfer = await stockTransferService.update(req.params.id, req.body, req.user);
    return ApiResponse.success(res, 'Stock transfer updated successfully', transfer);
  } catch (error) {
    next(error);
  }
};

const markReady = async (req, res, next) => {
  try {
    const transfer = await stockTransferService.markReady(req.params.id, req.user);
    return ApiResponse.success(res, 'Stock transfer marked as READY', transfer);
  } catch (error) {
    next(error);
  }
};

const startTransfer = async (req, res, next) => {
  try {
    const transfer = await stockTransferService.startTransfer(req.params.id, req.user);
    return ApiResponse.success(res, 'Stock transfer started and marked IN_TRANSIT', transfer);
  } catch (error) {
    next(error);
  }
};

const completeTransfer = async (req, res, next) => {
  try {
    const transfer = await stockTransferService.completeTransfer(req.params.id, req.user);
    return ApiResponse.success(res, 'Stock transfer successfully completed and inventory atomically updated', transfer);
  } catch (error) {
    next(error);
  }
};

const cancelTransfer = async (req, res, next) => {
  try {
    const transfer = await stockTransferService.cancelTransfer(req.params.id, req.user, req.body.reason);
    return ApiResponse.success(res, 'Stock transfer canceled successfully', transfer);
  } catch (error) {
    next(error);
  }
};

const getMasterData = async (req, res, next) => {
  try {
    const data = await stockTransferService.getMasterData();
    return ApiResponse.success(res, 'Master data retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

const getStockAvailability = async (req, res, next) => {
  try {
    const { productId, locationId } = req.query;
    const data = await stockTransferService.getStockAvailability(productId, locationId);
    return ApiResponse.success(res, 'Stock availability retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  markReady,
  startTransfer,
  completeTransfer,
  cancelTransfer,
  getMasterData,
  getStockAvailability
};
