const service = require('./notifications.service');
const ApiResponse = require('../../utils/ApiResponse');

class NotificationController {
  /**
   * GET /api/v1/notifications
   * List paginated notifications for authenticated user
   */
  async getAll(req, res, next) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        unread: req.query.unread,
        type: req.query.type,
        severity: req.query.severity,
        search: req.query.search
      };

      const data = await service.getUserNotifications(req.user.id, filters);
      return ApiResponse.success(res, 'Notifications retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/notifications/unread-count
   * Return unread notifications count for badge
   */
  async getUnreadCount(req, res, next) {
    try {
      const data = await service.getUnreadCount(req.user.id);
      return ApiResponse.success(res, 'Unread count retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   * Mark a single notification as read
   */
  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const data = await service.markAsRead(id, req.user.id);
      return ApiResponse.success(res, 'Notification marked as read', { notification: data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/notifications/read-all
   * Mark all notifications as read for current user
   */
  async markAllAsRead(req, res, next) {
    try {
      const data = await service.markAllAsRead(req.user.id);
      return ApiResponse.success(res, 'All notifications marked as read', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/notifications/:id
   * Dismiss/delete a single notification
   */
  async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      const data = await service.deleteNotification(id, req.user.id);
      return ApiResponse.success(res, 'Notification dismissed successfully', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/notifications/read/all
   * Delete all read notifications for current user
   */
  async deleteAllRead(req, res, next) {
    try {
      const data = await service.deleteAllRead(req.user.id);
      return ApiResponse.success(res, 'Read notifications cleared successfully', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/notifications
   * Create a notification (administrative or self)
   */
  async create(req, res, next) {
    try {
      const targetUserId = req.body.user_id || req.user.id;
      const data = await service.createNotification({
        ...req.body,
        user_id: targetUserId
      });
      return ApiResponse.created(res, 'Notification created successfully', { notification: data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
