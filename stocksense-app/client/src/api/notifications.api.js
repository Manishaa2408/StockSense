import api from './axios';

export const notificationApi = {
  /**
   * Fetch paginated notifications with filters
   * @param {Object} params - { page, limit, unread, type, severity, search }
   */
  getNotifications: async (params = {}) => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  /**
   * Fetch unread notification count
   */
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark a single notification as read
   * @param {number|string} id
   */
  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read for current user
   */
  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  /**
   * Delete / dismiss a notification
   * @param {number|string} id
   */
  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  /**
   * Delete all read notifications (cleanup)
   */
  clearAllRead: async () => {
    const response = await api.delete('/notifications/read/all');
    return response.data;
  },

  /**
   * Create a notification
   * @param {Object} data
   */
  createNotification: async (data) => {
    const response = await api.post('/notifications', data);
    return response.data;
  }
};

export default notificationApi;
