const Joi = require('joi');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

const createWarehouseSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).required(),
  code: Joi.string().trim().min(2).max(50).uppercase().pattern(/^[A-Z0-9\-_]+$/).required(),
  address: Joi.string().allow('').optional(),
  description: Joi.string().allow('').optional()
});

const updateWarehouseSchema = Joi.object({
  name: Joi.string().trim().min(2).max(200).optional(),
  code: Joi.string().trim().min(2).max(50).uppercase().pattern(/^[A-Z0-9\-_]+$/).optional(),
  address: Joi.string().allow('').optional(),
  description: Joi.string().allow('').optional()
}).min(1);

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE').required()
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path[0],
      message: detail.message
    }));
    return next(new ApiError(errorCodes.VALIDATION_ERROR, 'Validation failed', errors));
  }
  next();
};

module.exports = {
  validate,
  schemas: {
    createWarehouseSchema,
    updateWarehouseSchema,
    updateStatusSchema
  }
};
