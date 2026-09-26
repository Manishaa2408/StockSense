const Joi = require('joi');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

const createSupplierSchema = Joi.object({
  code: Joi.string().min(2).max(50).uppercase().required(),
  name: Joi.string().min(2).max(200).required(),
  contact_person: Joi.string().allow('', null).optional(),
  email: Joi.string().email().allow('', null).optional(),
  phone: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
});

const updateSupplierSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  contact_person: Joi.string().allow('', null).optional(),
  email: Joi.string().email().allow('', null).optional(),
  phone: Joi.string().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
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
  validate,
  schemas: {
    createSupplierSchema,
    updateSupplierSchema,
    updateStatusSchema
  }
};
