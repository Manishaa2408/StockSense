const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const errorCodes = require('../constants/errorCodes');

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    const statusCode = (typeof err.statusCode === 'number' && err.statusCode >= 100 && err.statusCode <= 599) ? err.statusCode : 400;
    logger.warn(`[ApiError] ${statusCode} - ${err.code}: ${err.message}`);
    return res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || 'BAD_REQUEST',
        message: err.message
      }
    });
  }

  if (err.isJoi || err.name === 'ValidationError') {
    logger.warn(`[ValidationError]: ${err.message}`);
    return res.status(400).json({
      success: false,
      error: {
        code: errorCodes.VALIDATION_ERROR,
        message: err.message,
        details: err.details
      }
    });
  }

  if (err.name === 'JsonWebTokenError') {
    logger.warn(`[JwtError]: ${err.message}`);
    return res.status(401).json({
      success: false,
      error: {
        code: errorCodes.AUTH_TOKEN_INVALID,
        message: 'Invalid token'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    logger.warn(`[JwtError]: Token expired`);
    return res.status(401).json({
      success: false,
      error: {
        code: errorCodes.AUTH_TOKEN_EXPIRED,
        message: 'Token expired'
      }
    });
  }

  logger.error(`[UnhandledError] ${err.stack}`);
  
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error'
    }
  });
};

module.exports = errorHandler;
