const Joi = require('joi');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const passwordMessage = 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.';

const schemas = {
  updateProfileSchema: Joi.object({
    first_name: Joi.string().optional().trim().min(2).max(100),
    last_name: Joi.string().optional().trim().min(2).max(100),
    phone: Joi.string().allow('').optional().pattern(/^\+?[0-9\s\-()]{7,20}$/)
  }),

  changePasswordSchema: Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().required().pattern(passwordPattern).messages({ 'string.pattern.base': passwordMessage }),
    confirm_password: Joi.any().valid(Joi.ref('new_password')).required().messages({ 'any.only': 'Passwords do not match' })
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
