const StockMovementsService = require('./stockMovements.service');
const ApiResponse = require('../../utils/ApiResponse');

const list = async (req, res, next) => {
  try {
    const result = await StockMovementsService.getAll(req.query);
    return ApiResponse.success(res, 'Stock movements retrieved successfully', result);
  } catch (err) {
    next(err);
  }
};

const detail = async (req, res, next) => {
  try {
    const result = await StockMovementsService.getById(req.params.id);
    return ApiResponse.success(res, 'Stock movement retrieved successfully', result);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, detail };
