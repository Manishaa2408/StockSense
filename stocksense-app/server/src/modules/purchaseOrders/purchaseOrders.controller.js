const PurchaseOrderService = require('./purchaseOrders.service');
const ApiResponse = require('../../utils/ApiResponse');

const list = async (req, res, next) => {
  try {
    const result = await PurchaseOrderService.getAll(req.query);
    return ApiResponse.success(res, 'Purchase orders retrieved successfully', result);
  } catch (err) {
    next(err);
  }
};

const detail = async (req, res, next) => {
  try {
    const result = await PurchaseOrderService.getById(req.params.id);
    return ApiResponse.success(res, 'Purchase order retrieved successfully', result);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await PurchaseOrderService.create(req.body, req.user);
    return ApiResponse.created(res, 'Purchase order created successfully', result);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await PurchaseOrderService.update(req.params.id, req.body, req.user);
    return ApiResponse.success(res, 'Purchase order updated successfully', result);
  } catch (err) {
    next(err);
  }
};

const confirm = async (req, res, next) => {
  try {
    const result = await PurchaseOrderService.confirm(req.params.id, req.user);
    return ApiResponse.success(res, 'Purchase order confirmed successfully', result);
  } catch (err) {
    next(err);
  }
};

const receive = async (req, res, next) => {
  try {
    const result = await PurchaseOrderService.receiveGoods(req.params.id, req.body, req.user);
    return ApiResponse.success(res, 'Goods received against purchase order successfully', result);
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const result = await PurchaseOrderService.cancel(req.params.id, req.user, reason);
    return ApiResponse.success(res, 'Purchase order canceled successfully', result);
  } catch (err) {
    next(err);
  }
};

const masterData = async (req, res, next) => {
  try {
    const result = await PurchaseOrderService.getMasterData();
    return ApiResponse.success(res, 'Master data retrieved successfully', result);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, detail, create, update, confirm, receive, cancel, masterData };
