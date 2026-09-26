const service = require('./audit.service');
const ApiResponse = require('../../utils/ApiResponse');

class AuditController {
  /**
   * GET /api/v1/audit-logs
   * List paginated audit logs with search and filters
   */
  async getAll(req, res, next) {
    try {
      const data = await service.getAuditLogs({
        page: req.query.page,
        limit: req.query.limit,
        userId: req.query.userId,
        action: req.query.action,
        module: req.query.module,
        entityType: req.query.entityType,
        entityId: req.query.entityId,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
        search: req.query.search
      });
      return ApiResponse.success(res, 'Audit logs retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/audit-logs/meta
   * Fetch filter metadata (actions, modules, actors)
   */
  async getMeta(req, res, next) {
    try {
      const data = await service.getAuditMetadata();
      return ApiResponse.success(res, 'Audit metadata retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/audit-logs/:id
   * Fetch single audit entry details including full before/after diff
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      const data = await service.getAuditLogById(id);
      return ApiResponse.success(res, 'Audit log retrieved successfully', { auditLog: data });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuditController();
