const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');
const logger = require('../../utils/logger');
const { AUDIT_ACTIONS, AUDIT_MODULES, SENSITIVE_FIELDS, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('./audit.constants');

class AuditService {
  /**
   * Deep sanitize object to strip passwords, tokens, secrets
   */
  _sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this._sanitizeData(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_FIELDS.some(
        (sf) => lowerKey === sf.toLowerCase() || lowerKey.includes('password') || lowerKey.includes('token')
      );

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (value && typeof value === 'object') {
        sanitized[key] = this._sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Helper to ensure JSON fields are parsed objects
   */
  _normalizeLog(row) {
    if (!row) return null;
    let before_data = row.before_data;
    let after_data = row.after_data;
    let metadata = row.metadata;

    if (typeof before_data === 'string') {
      try { before_data = JSON.parse(before_data); } catch (e) {}
    }
    if (typeof after_data === 'string') {
      try { after_data = JSON.parse(after_data); } catch (e) {}
    }
    if (typeof metadata === 'string') {
      try { metadata = JSON.parse(metadata); } catch (e) {}
    }

    return {
      ...row,
      before_data: before_data || null,
      after_data: after_data || null,
      metadata: metadata || null
    };
  }

  /**
   * Record an immutable audit log entry
   * Supports participation in existing database transactions
   */
  async createAuditLog({
    userId = null,
    user_id = null,
    action,
    module,
    entityType,
    entity_type = null,
    entityId,
    entity_id = null,
    description = null,
    beforeData = null,
    before_data = null,
    afterData = null,
    after_data = null,
    metadata = null,
    ipAddress = null,
    userAgent = null,
    req = null,
    trx = null
  }) {
    try {
      const finalUserId = userId || user_id || req?.user?.id || null;
      const finalEntityType = entityType || entity_type || module;
      const finalEntityId = entityId || entity_id ? String(entityId || entity_id) : null;

      // Extract client network info from express req if available
      let finalIp = ipAddress;
      if (!finalIp && req) {
        finalIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || null;
      }
      let finalUa = userAgent;
      if (!finalUa && req) {
        finalUa = req.headers['user-agent'] || null;
      }

      // Deep sanitize payloads
      const sanitizedBefore = this._sanitizeData(beforeData || before_data);
      const sanitizedAfter = this._sanitizeData(afterData || after_data);
      const sanitizedMeta = this._sanitizeData(metadata);

      const queryBuilder = trx || db;

      const insertPayload = {
        user_id: finalUserId,
        action: String(action).toUpperCase(),
        module: String(module).toUpperCase(),
        entity_type: String(finalEntityType).toUpperCase(),
        entity_id: finalEntityId,
        description: description || `${action} on ${finalEntityType}${finalEntityId ? ' #' + finalEntityId : ''}`,
        before_data: sanitizedBefore ? JSON.stringify(sanitizedBefore) : null,
        after_data: sanitizedAfter ? JSON.stringify(sanitizedAfter) : null,
        metadata: sanitizedMeta ? JSON.stringify(sanitizedMeta) : null,
        ip_address: finalIp,
        user_agent: finalUa,
        created_at: queryBuilder.fn.now()
      };

      const [insertedId] = await queryBuilder('audit_logs').insert(insertPayload);
      logger.info(`[AuditService] Logged action ${action} on ${module}:${finalEntityType} (ID: ${insertedId})`);

      return insertedId;
    } catch (err) {
      logger.error(`[AuditService] Failed to record audit log: ${err.message}`);
      // If inside a transaction, rethrow to ensure transactional integrity
      if (trx) throw err;
      return null;
    }
  }

  /**
   * Retrieve paginated audit logs with multi-dimensional filtering
   */
  async getAuditLogs({
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    userId,
    action,
    module,
    entityType,
    entityId,
    dateFrom,
    dateTo,
    search
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit, 10) || DEFAULT_PAGE_SIZE));
    const offset = (pageNum - 1) * limitNum;

    let query = db('audit_logs')
      .leftJoin('users', 'audit_logs.user_id', 'users.id')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .select(
        'audit_logs.*',
        'users.first_name as user_first_name',
        'users.last_name as user_last_name',
        'users.email as user_email',
        'roles.name as user_role_name'
      );

    if (userId) {
      query = query.where('audit_logs.user_id', userId);
    }

    if (action) {
      query = query.where('audit_logs.action', action.toUpperCase());
    }

    if (module) {
      query = query.where('audit_logs.module', module.toUpperCase());
    }

    if (entityType) {
      query = query.where('audit_logs.entity_type', entityType.toUpperCase());
    }

    if (entityId) {
      query = query.where('audit_logs.entity_id', String(entityId));
    }

    if (dateFrom) {
      query = query.where('audit_logs.created_at', '>=', new Date(dateFrom));
    }

    if (dateTo) {
      // Include the entire end date
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.where('audit_logs.created_at', '<=', endOfDay);
    }

    if (search && search.trim()) {
      const pattern = `%${search.trim()}%`;
      query = query.where(function() {
        this.where('audit_logs.description', 'like', pattern)
          .orWhere('audit_logs.entity_id', 'like', pattern)
          .orWhere('audit_logs.module', 'like', pattern)
          .orWhere('audit_logs.action', 'like', pattern)
          .orWhere('users.email', 'like', pattern)
          .orWhere(db.raw("CONCAT(users.first_name, ' ', users.last_name)"), 'like', pattern);
      });
    }

    const countQuery = query.clone().clearSelect().count('* as total');
    const [countResult] = await countQuery;
    const total = parseInt(countResult.total, 10) || 0;
    const totalPages = Math.ceil(total / limitNum) || 1;

    const rows = await query
      .orderBy('audit_logs.created_at', 'desc')
      .orderBy('audit_logs.id', 'desc')
      .limit(limitNum)
      .offset(offset);

    const items = rows.map((r) => this._normalizeLog(r));

    return {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    };
  }

  /**
   * Get single audit record by ID
   */
  async getAuditLogById(id) {
    const row = await db('audit_logs')
      .leftJoin('users', 'audit_logs.user_id', 'users.id')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .select(
        'audit_logs.*',
        'users.first_name as user_first_name',
        'users.last_name as user_last_name',
        'users.email as user_email',
        'roles.name as user_role_name'
      )
      .where('audit_logs.id', id)
      .first();

    if (!row) {
      throw ApiError.notFound(errorCodes.AUDIT_LOG_NOT_FOUND, 'Audit log record not found');
    }

    return this._normalizeLog(row);
  }

  /**
   * Helper endpoint providing available modules, actions, and actors for frontend filters
   */
  async getAuditMetadata() {
    const [actionsRows, modulesRows, usersRows] = await Promise.all([
      db('audit_logs').distinct('action').pluck('action'),
      db('audit_logs').distinct('module').pluck('module'),
      db('audit_logs')
        .join('users', 'audit_logs.user_id', 'users.id')
        .distinct('users.id as id', 'users.first_name', 'users.last_name', 'users.email')
        .select()
    ]);

    return {
      actions: Object.values(AUDIT_ACTIONS),
      modules: Object.values(AUDIT_MODULES),
      recordedActions: actionsRows.filter(Boolean),
      recordedModules: modulesRows.filter(Boolean),
      actors: usersRows
    };
  }
}

module.exports = new AuditService();
