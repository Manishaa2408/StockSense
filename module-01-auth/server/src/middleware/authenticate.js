const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const errorCodes = require('../constants/errorCodes');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized(errorCodes.AUTH_UNAUTHORIZED, 'Authentication token missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    
    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized(errorCodes.AUTH_TOKEN_EXPIRED, 'Authentication token expired');
      }
      throw ApiError.unauthorized(errorCodes.AUTH_TOKEN_INVALID, 'Authentication token invalid');
    }

    const { userId, tokenId } = decoded;

    const tokenRecord = await db('refresh_tokens')
      .where({ id: tokenId, user_id: userId })
      .andWhere('expires_at', '>', new Date())
      .first();

    if (!tokenRecord) {
      throw ApiError.unauthorized(errorCodes.AUTH_TOKEN_EXPIRED, 'Session expired or invalid');
    }

    const user = await db('users')
      .join('roles', 'users.role_id', '=', 'roles.id')
      .select('users.*', 'roles.name as role_name')
      .where('users.id', userId)
      .first();

    if (!user) {
      throw ApiError.unauthorized(errorCodes.AUTH_UNAUTHORIZED, 'User not found');
    }

    if (user.status !== 'ACTIVE') {
      throw ApiError.unauthorized(errorCodes.AUTH_ACCOUNT_SUSPENDED, 'User account is not active');
    }

    req.user = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      role_id: user.role_id,
      role_name: user.role_name,
      status: user.status
    };
    req.tokenId = tokenId;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
