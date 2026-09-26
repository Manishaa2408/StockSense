const Joi = require('joi');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

const schemas = {
  createDeliverySchema: Joi.object({
    source_warehouse_id: Joi.number().integer().positive().required().messages({
      'any.required': 'Source warehouse is required',
      'number.base': 'Source warehouse must be a valid ID'
    }),
    source_location_id: Joi.number().integer().positive().required().messages({
      'any.required': 'Source location is required',
      'number.base': 'Source location must be a valid ID'
    }),
    scheduled_date: Joi.string().allow(null, '').optional(),
    notes: Joi.string().allow('', null).max(1000).optional(),
    items: Joi.array().items(
      Joi.object({
        product_id: Joi.number().integer().positive().required().messages({
          'any.required': 'Product ID is required',
          'number.base': 'Product ID must be a valid number'
        }),
        requested_quantity: Joi.number().positive().precision(4).required().messages({
          'any.required': 'Requested quantity is required',
          'number.positive': 'Quantity must be greater than zero'
        })
      })
    ).min(1).required().messages({
      'array.min': 'Delivery order must have at least one product item',
      'any.required': 'Items are required'
    })
  }),

  updateDeliverySchema: Joi.object({
    source_warehouse_id: Joi.number().integer().positive().optional(),
    source_location_id: Joi.number().integer().positive().optional(),
    scheduled_date: Joi.string().allow(null, '').optional(),
    notes: Joi.string().allow('', null).max(1000).optional(),
    items: Joi.array().items(
      Joi.object({
        product_id: Joi.number().integer().positive().required(),
        requested_quantity: Joi.number().positive().precision(4).required()
      })
    ).min(1).optional()
  }),

  cancelDeliverySchema: Joi.object({
    reason: Joi.string().allow('', null).max(500).optional()
  })
};

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(errorCodes.VALIDATION_ERROR, error.details[0].message));
  }
  req.body = value;
  next();
};

module.exports = { schemas, validate };
