const service = require('./deliveries.service');
const ApiResponse = require('../../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      status: req.query.status,
      warehouse_id: req.query.warehouse_id,
      location_id: req.query.location_id,
      from_date: req.query.from_date,
      to_date: req.query.to_date
    };
    const data = await service.getAll(filters);
    return ApiResponse.success(res, 'Deliveries fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id);
    return ApiResponse.success(res, 'Delivery fetched successfully', { delivery: data });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body, req.user);
    return ApiResponse.created(res, 'Delivery order created successfully', { delivery: data });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body, req.user);
    return ApiResponse.success(res, 'Delivery order updated successfully', { delivery: data });
  } catch (error) {
    next(error);
  }
};

const markReady = async (req, res, next) => {
  try {
    const data = await service.markReady(req.params.id, req.user);
    return ApiResponse.success(res, 'Delivery order marked as ready', { delivery: data });
  } catch (error) {
    next(error);
  }
};

const validateDelivery = async (req, res, next) => {
  try {
    const data = await service.validateDelivery(req.params.id, req.user);
    return ApiResponse.success(res, 'Delivery order validated and processed successfully', { delivery: data });
  } catch (error) {
    next(error);
  }
};

const cancelDelivery = async (req, res, next) => {
  try {
    const reason = req.body?.reason;
    const data = await service.cancelDelivery(req.params.id, req.user, reason);
    return ApiResponse.success(res, 'Delivery order canceled successfully', { delivery: data });
  } catch (error) {
    next(error);
  }
};

const getMasterData = async (req, res, next) => {
  try {
    const data = await service.getMasterData();
    return ApiResponse.success(res, 'Master data fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

const getStockAvailability = async (req, res, next) => {
  try {
    const { product_id, location_id } = req.query;
    const data = await service.getStockAvailability(product_id, location_id);
    return ApiResponse.success(res, 'Stock availability fetched successfully', data);
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
  validateDelivery,
  cancelDelivery,
  getMasterData,
  getStockAvailability
};
