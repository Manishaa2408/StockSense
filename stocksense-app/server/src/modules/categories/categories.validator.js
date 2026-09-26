const Joi = require('joi');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Category name is required',
    'string.empty': 'Category name cannot be empty'
  }),
  description: Joi.string().trim().max(255).allow('', null),
  parent_id: Joi.number().integer().positive().allow(null, '')
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(255).allow('', null),
  parent_id: Joi.number().integer().positive().allow(null, '')
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
  createCategorySchema,
  updateCategorySchema,
  updateStatusSchema,
  validate
};
