class ApiError extends Error {
  constructor(statusCode, code, message) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.message = message;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(code, message) {
    return new ApiError(400, code, message);
  }

  static unauthorized(code, message) {
    return new ApiError(401, code, message);
  }

  static forbidden(code, message) {
    return new ApiError(403, code, message);
  }

  static notFound(code, message) {
    return new ApiError(404, code, message);
  }
}

module.exports = ApiError;
