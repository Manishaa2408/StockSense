const AdjustmentService = require('./adjustments.service');
const ApiResponse = require('../../utils/ApiResponse');
const logger = require('../../utils/logger');

const list = async (req, res, next) => {
  try {
    const result = await AdjustmentService.getAll(req.query);
    return ApiResponse.success(res, 'Stock adjustments retrieved successfully', result);
  } catch (err) {
    next(err);
  }
};

const detail = async (req, res, next) => {
  try {
    const result = await AdjustmentService.getById(req.params.id);
    return ApiResponse.success(res, 'Stock adjustment retrieved successfully', result);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const result = await AdjustmentService.create(req.body, req.user);
    return ApiResponse.created(res, 'Stock adjustment created successfully', result);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const result = await AdjustmentService.update(req.params.id, req.body, req.user);
    return ApiResponse.success(res, 'Stock adjustment updated successfully', result);
  } catch (err) {
    next(err);
  }
};

const approve = async (req, res, next) => {
  try {
    const result = await AdjustmentService.approve(req.params.id, req.user);
    return ApiResponse.success(res, 'Stock adjustment approved successfully', result);
  } catch (err) {
    next(err);
  }
};

const complete = async (req, res, next) => {
  try {
    const result = await AdjustmentService.complete(req.params.id, req.user);
    return ApiResponse.success(res, 'Stock adjustment completed successfully', result);
  } catch (err) {
    next(err);
  }
};

const cancel = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const result = await AdjustmentService.cancel(req.params.id, req.user, reason);
    return ApiResponse.success(res, 'Stock adjustment canceled successfully', result);
  } catch (err) {
    next(err);
  }
};

const masterData = async (req, res, next) => {
  try {
    const result = await AdjustmentService.getMasterData();
    return ApiResponse.success(res, 'Master data retrieved successfully', result);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, detail, create, update, approve, complete, cancel, masterData };
