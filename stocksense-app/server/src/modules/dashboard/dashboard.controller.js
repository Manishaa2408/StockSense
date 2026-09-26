const dashboardService = require('./dashboard.service');
const ApiResponse = require('../../utils/ApiResponse');

class DashboardController {
  async getStats(req, res, next) {
    try {
      const data = await dashboardService.getStats();
      return ApiResponse.success(res, 'Dashboard stats fetched', data);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DashboardController();
