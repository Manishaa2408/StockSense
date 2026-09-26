const Joi = require('joi');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');
const { AUDIT_ACTIONS, AUDIT_MODULES } = require('./audit.constants');

const schemas = {
  queryAuditLogsSchema: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    userId: Joi.number().integer().positive().optional(),
    action: Joi.string().valid(...Object.values(AUDIT_ACTIONS)).optional(),
    module: Joi.string().valid(...Object.values(AUDIT_MODULES)).optional(),
    entityType: Joi.string().trim().max(50).optional(),
    entityId: Joi.alternatives().try(Joi.string(), Joi.number()).optional(),
    dateFrom: Joi.string().trim().optional(),
    dateTo: Joi.string().trim().optional(),
    search: Joi.string().trim().allow('').optional()
  }),

  idParamSchema: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      'number.base': 'Audit Log ID must be a valid number',
      'any.required': 'Audit Log ID is required'
    })
  })
};

const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(errorCodes.VALIDATION_ERROR, error.details[0].message));
  }
  req.query = value;
  next();
};

const validateParams = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.params, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(errorCodes.VALIDATION_ERROR, error.details[0].message));
  }
  req.params = value;
  next();
};

module.exports = {
  schemas,
  validateQuery,
  validateParams
};
