const Joi = require('joi');

const poItemSchema = Joi.object({
  product_id: Joi.number().integer().positive().required().messages({
    'number.base': 'Product ID must be a number',
    'any.required': 'Product ID is required'
  }),
  ordered_quantity: Joi.number().positive().required().messages({
    'number.base': 'Ordered quantity must be a number',
    'number.positive': 'Ordered quantity must be greater than 0',
    'any.required': 'Ordered quantity is required'
  }),
  unit_price: Joi.number().min(0).required().messages({
    'number.base': 'Unit price must be a number',
    'number.min': 'Unit price cannot be negative',
    'any.required': 'Unit price is required'
  }),
  tax_rate: Joi.number().min(0).max(100).optional().default(0),
  discount: Joi.number().min(0).optional().default(0)
});

const createSchema = Joi.object({
  supplier_id: Joi.number().integer().positive().required().messages({
    'any.required': 'Supplier is required'
  }),
  order_date: Joi.date().iso().optional().default(() => new Date().toISOString().split('T')[0]),
  expected_delivery_date: Joi.date().iso().optional().allow('', null),
  notes: Joi.string().max(1000).optional().allow('', null),
  items: Joi.array().items(poItemSchema).min(1).required().messages({
    'array.min': 'Purchase order must contain at least one product line',
    'any.required': 'Items are required'
  })
});

const updateSchema = Joi.object({
  supplier_id: Joi.number().integer().positive().optional(),
  order_date: Joi.date().iso().optional(),
  expected_delivery_date: Joi.date().iso().optional().allow('', null),
  notes: Joi.string().max(1000).optional().allow('', null),
  items: Joi.array().items(poItemSchema).min(1).optional()
});

const receiveItemSchema = Joi.object({
  product_id: Joi.number().integer().positive().required(),
  received_quantity: Joi.number().positive().required(),
  warehouse_id: Joi.number().integer().positive().optional(),
  location_id: Joi.number().integer().positive().optional()
});

const receiveSchema = Joi.object({
  warehouse_id: Joi.number().integer().positive().required(),
  location_id: Joi.number().integer().positive().required(),
  notes: Joi.string().max(500).optional().allow('', null),
  items: Joi.array().items(receiveItemSchema).min(1).required()
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
  validateReceive: validate(receiveSchema)
};
