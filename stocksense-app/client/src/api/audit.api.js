import api from './axios';

export const auditApi = {
  /**
   * Fetch paginated audit logs with multi-field filters
   * @param {Object} params - { page, limit, userId, action, module, entityType, entityId, dateFrom, dateTo, search }
   */
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/audit-logs', { params });
    return response.data;
  },

  /**
   * Fetch individual audit log detail by ID
   * @param {number|string} id
   */
  getAuditLogById: async (id) => {
    const response = await api.get(`/audit-logs/${id}`);
    return response.data;
  },

  /**
   * Fetch filter metadata (available modules, actions, recorded actors)
   */
  getAuditMetadata: async () => {
    const response = await api.get('/audit-logs/meta');
    return response.data;
  }
};

export default auditApi;
