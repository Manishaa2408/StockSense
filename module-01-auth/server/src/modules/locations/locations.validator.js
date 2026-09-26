const Joi = require('joi');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

const createLocationSchema = Joi.object({
  warehouse_id: Joi.number().integer().positive().required(),
  name: Joi.string().trim().min(2).max(200).required(),
  code: Joi.string().trim().min(1).max(50).uppercase().pattern(/^[A-Z0-9\-_]+$/).required(),
  description: Joi.string().allow('').optional()
});

const updateLocationSchema = Joi.object({
  warehouse_id: Joi.number().integer().positive().optional(),
  name: Joi.string().trim().min(2).max(200).optional(),
  code: Joi.string().trim().min(1).max(50).uppercase().pattern(/^[A-Z0-9\-_]+$/).optional(),
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
    createLocationSchema,
    updateLocationSchema,
    updateStatusSchema
  }
};
