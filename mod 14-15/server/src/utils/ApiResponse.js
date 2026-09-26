class ApiResponse {
  static success(res, message, data = {}, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  static created(res, message, data = {}) {
    return this.success(res, message, data, 201);
  }

  static error(res, code, message, statusCode = 400) {
    return res.status(statusCode).json({
      success: false,
      error: {
        code,
        message
      }
    });
  }
}

module.exports = ApiResponse;
