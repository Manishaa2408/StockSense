const Joi = require('joi');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

const createProductSchema = Joi.object({
  sku: Joi.string().trim().uppercase().min(2).max(100).required().messages({
    'any.required': 'SKU is required',
    'string.empty': 'SKU cannot be empty'
  }),
  name: Joi.string().trim().min(2).max(255).required().messages({
    'any.required': 'Product name is required',
    'string.empty': 'Product name cannot be empty'
  }),
  description: Joi.string().trim().allow('', null),
  category_id: Joi.number().integer().positive().required().messages({
    'any.required': 'Category is required'
  }),
  unit_id: Joi.number().integer().positive().required().messages({
    'any.required': 'Unit of measure is required'
  }),
  reorder_level: Joi.number().integer().min(0).default(0).messages({
    'number.min': 'Reorder level cannot be negative'
  })
});

const updateProductSchema = Joi.object({
  sku: Joi.string().trim().uppercase().min(2).max(100),
  name: Joi.string().trim().min(2).max(255),
  description: Joi.string().trim().allow('', null),
  category_id: Joi.number().integer().positive(),
  unit_id: Joi.number().integer().positive(),
  reorder_level: Joi.number().integer().min(0)
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE').required()
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.map(d => d.message).join(', ');
    return next(ApiError.badRequest(errorCodes.VALIDATION_ERROR, details));
  }
  req.body = value;
  next();
};

module.exports = {
  createProductSchema,
  updateProductSchema,
  updateStatusSchema,
  validate
};
