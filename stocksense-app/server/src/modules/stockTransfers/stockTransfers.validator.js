const Joi = require('joi');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

const itemSchema = Joi.object({
  product_id: Joi.number().integer().positive().optional(),
  productId: Joi.number().integer().positive().optional(),
  quantity: Joi.number().positive().precision(4).required().messages({
    'any.required': 'Quantity is required',
    'number.positive': 'Quantity must be greater than zero',
    'number.base': 'Quantity must be a valid number'
  })
}).or('product_id', 'productId');

const schemas = {
  createTransferSchema: Joi.object({
    source_warehouse_id: Joi.number().integer().positive().optional(),
    sourceWarehouseId: Joi.number().integer().positive().optional(),
    source_location_id: Joi.number().integer().positive().optional(),
    sourceLocationId: Joi.number().integer().positive().optional(),
    destination_warehouse_id: Joi.number().integer().positive().optional(),
    destinationWarehouseId: Joi.number().integer().positive().optional(),
    destination_location_id: Joi.number().integer().positive().optional(),
    destinationLocationId: Joi.number().integer().positive().optional(),
    notes: Joi.string().allow('', null).max(1000).optional(),
    items: Joi.array().items(itemSchema).min(1).required().messages({
      'array.min': 'Stock transfer must include at least one product line',
      'any.required': 'Transfer items are required'
    })
  })
  .or('source_warehouse_id', 'sourceWarehouseId')
  .or('source_location_id', 'sourceLocationId')
  .or('destination_warehouse_id', 'destinationWarehouseId')
  .or('destination_location_id', 'destinationLocationId'),

  updateTransferSchema: Joi.object({
    source_warehouse_id: Joi.number().integer().positive().optional(),
    sourceWarehouseId: Joi.number().integer().positive().optional(),
    source_location_id: Joi.number().integer().positive().optional(),
    sourceLocationId: Joi.number().integer().positive().optional(),
    destination_warehouse_id: Joi.number().integer().positive().optional(),
    destinationWarehouseId: Joi.number().integer().positive().optional(),
    destination_location_id: Joi.number().integer().positive().optional(),
    destinationLocationId: Joi.number().integer().positive().optional(),
    notes: Joi.string().allow('', null).max(1000).optional(),
    items: Joi.array().items(itemSchema).min(1).optional()
  }),

  cancelTransferSchema: Joi.object({
    reason: Joi.string().allow('', null).max(500).optional()
  })
};

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(errorCodes.VALIDATION_ERROR, error.details[0].message));
  }

  // Normalize camelCase to snake_case
  if (value.sourceWarehouseId !== undefined && value.source_warehouse_id === undefined) {
    value.source_warehouse_id = value.sourceWarehouseId;
  }
  if (value.sourceLocationId !== undefined && value.source_location_id === undefined) {
    value.source_location_id = value.sourceLocationId;
  }
  if (value.destinationWarehouseId !== undefined && value.destination_warehouse_id === undefined) {
    value.destination_warehouse_id = value.destinationWarehouseId;
  }
  if (value.destinationLocationId !== undefined && value.destination_location_id === undefined) {
    value.destination_location_id = value.destinationLocationId;
  }

  // Custom business rules: Same source & destination validation
  if (
    value.source_warehouse_id &&
    value.destination_warehouse_id &&
    value.source_location_id &&
    value.destination_location_id
  ) {
    if (
      value.source_warehouse_id === value.destination_warehouse_id &&
      value.source_location_id === value.destination_location_id
    ) {
      return next(
        ApiError.badRequest(
          errorCodes.TRANSFER_SOURCE_DESTINATION_SAME || 'TRANSFER_SOURCE_DESTINATION_SAME',
          'Source and destination location cannot be the same.'
        )
      );
    }
  }

  // Duplicate product detection in line items
  if (value.items && Array.isArray(value.items)) {
    const productIds = new Set();
    for (const itm of value.items) {
      const pid = itm.product_id || itm.productId;
      itm.product_id = pid; // normalize
      if (productIds.has(pid)) {
        return next(
          ApiError.badRequest(
            errorCodes.TRANSFER_DUPLICATE_PRODUCT || 'TRANSFER_DUPLICATE_PRODUCT',
            `Product ID ${pid} appears multiple times in transfer items. Please consolidate quantities.`
          )
        );
      }
      productIds.add(pid);
    }
  }

  req.body = value;
  next();
};

module.exports = { schemas, validate };
