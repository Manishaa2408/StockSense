const service = require('./profile.service');
const ApiResponse = require('../../utils/ApiResponse');

const getProfile = async (req, res, next) => {
  try {
    const data = await service.getProfile(req.user.id);
    return ApiResponse.success(res, 'Profile fetched successfully', { user: data });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const data = await service.updateProfile(req.user.id, req.body);
    return ApiResponse.success(res, 'Profile updated successfully', { user: data });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await service.changePassword(req.user.id, req.body.current_password, req.body.new_password, req.tokenId);
    return ApiResponse.success(res, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};
