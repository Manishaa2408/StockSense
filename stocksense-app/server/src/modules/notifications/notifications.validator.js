const Joi = require('joi');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');
const { NOTIFICATION_TYPES, NOTIFICATION_SEVERITIES } = require('./notifications.constants');

const schemas = {
  createNotificationSchema: Joi.object({
    user_id: Joi.number().integer().positive().optional().messages({
      'number.base': 'User ID must be a valid number',
      'number.positive': 'User ID must be positive'
    }),
    type: Joi.string()
      .valid(...Object.values(NOTIFICATION_TYPES))
      .required()
      .messages({
        'any.required': 'Notification type is required',
        'any.only': `Invalid notification type. Must be one of: ${Object.values(NOTIFICATION_TYPES).join(', ')}`
      }),
    severity: Joi.string()
      .valid(...Object.values(NOTIFICATION_SEVERITIES))
      .default(NOTIFICATION_SEVERITIES.INFO)
      .messages({
        'any.only': `Severity must be one of: ${Object.values(NOTIFICATION_SEVERITIES).join(', ')}`
      }),
    title: Joi.string().trim().max(255).required().messages({
      'any.required': 'Notification title is required',
      'string.empty': 'Notification title cannot be empty'
    }),
    message: Joi.string().trim().required().messages({
      'any.required': 'Notification message is required',
      'string.empty': 'Notification message cannot be empty'
    }),
    entity_type: Joi.string().trim().max(50).allow(null, '').optional(),
    entity_id: Joi.alternatives().try(Joi.string(), Joi.number()).allow(null, '').optional(),
    action_url: Joi.string().trim().max(255).allow(null, '').optional(),
    notification_key: Joi.string().trim().max(150).allow(null, '').optional(),
    metadata: Joi.object().allow(null).optional(),
    force: Joi.boolean().default(false)
  }),

  queryNotificationsSchema: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    unread: Joi.boolean().optional(),
    type: Joi.string().valid(...Object.values(NOTIFICATION_TYPES)).optional(),
    severity: Joi.string().valid(...Object.values(NOTIFICATION_SEVERITIES)).optional(),
    search: Joi.string().trim().allow('').optional()
  })
};

const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(errorCodes.VALIDATION_ERROR, error.details[0].message));
  }
  req.body = value;
  next();
};

const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, { abortEarly: false, stripUnknown: true });
  if (error) {
    return next(ApiError.badRequest(errorCodes.VALIDATION_ERROR, error.details[0].message));
  }
  req.query = value;
  next();
};

module.exports = {
  schemas,
  validate: validateBody,
  validateBody,
  validateQuery
};
