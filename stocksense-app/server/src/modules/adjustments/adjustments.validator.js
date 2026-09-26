const Joi = require('joi');
const { ADJUSTMENT_TYPE, ADJUSTMENT_REASON } = require('./adjustments.constants');

const adjustmentItemSchema = Joi.object({
  product_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Product ID must be a number',
    'any.required': 'Product ID is required'
  }),
  quantity: Joi.number().positive().required().messages({
    'number.base': 'Quantity must be a positive number',
    'number.positive': 'Quantity must be greater than 0',
    'any.required': 'Quantity is required'
  }),
  adjustment_type: Joi.string().valid(...Object.values(ADJUSTMENT_TYPE)).required().messages({
    'any.only': `Adjustment type must be one of: ${Object.values(ADJUSTMENT_TYPE).join(', ')}`,
    'any.required': 'Adjustment type is required'
  }),
  reason: Joi.string().max(100).optional().allow('', null)
});

const createSchema = Joi.object({
  warehouse_id: Joi.number().integer().positive().required(),
  location_id: Joi.number().integer().positive().required(),
  reason: Joi.string().valid(...Object.values(ADJUSTMENT_REASON)).required().messages({
    'any.only': `Reason must be one of: ${Object.values(ADJUSTMENT_REASON).join(', ')}`,
    'any.required': 'Reason is required'
  }),
  notes: Joi.string().max(1000).optional().allow('', null),
  items: Joi.array().items(adjustmentItemSchema).min(1).required().messages({
    'array.min': 'At least one product item is required',
    'any.required': 'Items are required'
  })
});

const updateSchema = Joi.object({
  warehouse_id: Joi.number().integer().positive().optional(),
  location_id: Joi.number().integer().positive().optional(),
  reason: Joi.string().valid(...Object.values(ADJUSTMENT_REASON)).optional(),
  notes: Joi.string().max(1000).optional().allow('', null),
  items: Joi.array().items(adjustmentItemSchema).min(1).optional()
});

const cancelSchema = Joi.object({
  reason: Joi.string().max(500).optional().allow('', null)
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.details.map((d) => d.message)
      }
    });
  }
  next();
};

module.exports = {
  validateCreate: validate(createSchema),
  validateUpdate: validate(updateSchema),
  validateCancel: validate(cancelSchema)
};
