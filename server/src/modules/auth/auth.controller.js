const service = require('./auth.service');
const ApiResponse = require('../../utils/ApiResponse');

const register = async (req, res, next) => {
  try {
    const user = await service.register(req.body);
    return ApiResponse.created(res, 'User registered successfully', { user });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await service.login(req.body.email, req.body.password);
    return ApiResponse.success(res, 'Login successful', data);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await service.logout(req.user.id, req.tokenId);
    return ApiResponse.success(res, 'Logout successful');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const data = await service.getMe(req.user.id);
    return ApiResponse.success(res, 'Profile fetched successfully', data);
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const data = await service.forgotPassword(req.body.email);
    return ApiResponse.success(res, 'If an account exists, an OTP has been sent', data);
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const data = await service.verifyOtp(req.body.email, req.body.otp);
    return ApiResponse.success(res, 'OTP verified successfully', data);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await service.resetPassword(req.body);
    return ApiResponse.success(res, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  verifyOtp,
  resetPassword
};
