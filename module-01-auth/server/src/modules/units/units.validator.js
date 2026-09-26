const Joi = require('joi');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

const createUnitSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'Unit name is required'
  }),
  code: Joi.string().trim().uppercase().min(1).max(20).required().messages({
    'any.required': 'Unit symbol/code is required'
  }),
  unit_type: Joi.string().valid('Count', 'Weight', 'Volume', 'Length', 'Packaging', 'Other').default('Count'),
  description: Joi.string().trim().max(255).allow('', null)
});

const updateUnitSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  code: Joi.string().trim().uppercase().min(1).max(20),
  unit_type: Joi.string().valid('Count', 'Weight', 'Volume', 'Length', 'Packaging', 'Other'),
  description: Joi.string().trim().max(255).allow('', null)
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
  createUnitSchema,
  updateUnitSchema,
  updateStatusSchema,
  validate
};
