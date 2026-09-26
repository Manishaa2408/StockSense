const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');
const logger = require('../../utils/logger');
const { NOTIFICATION_TYPES, NOTIFICATION_SEVERITIES, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('./notifications.constants');

class NotificationService {
  /**
   * Helper to ensure metadata is parsed properly if stored as string
   */
  _normalizeNotification(row) {
    if (!row) return null;
    let metadata = row.metadata;
    if (typeof metadata === 'string') {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        // keep as is if parse fails
      }
    }
    return {
      ...row,
      is_read: Boolean(row.is_read),
      metadata
    };
  }

  /**
   * Create a single notification for a specific user
   * Handles deduplication via notification_key if active unread alert exists
   */
  async createNotification({
    user_id,
    userId,
    type,
    title,
    message,
    severity = NOTIFICATION_SEVERITIES.INFO,
    entity_type = null,
    entity_id = null,
    action_url = null,
    notification_key = null,
    metadata = null,
    force = false,
    trx = null
  }) {
    const targetUserId = user_id || userId;
    if (!targetUserId) {
      throw ApiError.badRequest(errorCodes.VALIDATION_ERROR, 'User ID is required to create a notification');
    }

    if (!type || !NOTIFICATION_TYPES[type]) {
      throw ApiError.badRequest(errorCodes.INVALID_NOTIFICATION_TYPE, `Invalid notification type: ${type}`);
    }

    const normalizedSeverity = (severity || NOTIFICATION_SEVERITIES.INFO).toUpperCase();
    if (!NOTIFICATION_SEVERITIES[normalizedSeverity]) {
      throw ApiError.badRequest(errorCodes.INVALID_NOTIFICATION_SEVERITY, `Invalid notification severity: ${severity}`);
    }

    const queryBuilder = trx || db;

    // Validate that target user exists
    const userExists = await queryBuilder('users').where({ id: targetUserId }).select('id').first();
    if (!userExists) {
      throw ApiError.badRequest(errorCodes.USER_NOT_FOUND, `User with ID ${targetUserId} does not exist`);
    }

    // Auto-generate notification_key if not explicitly provided and entity is known
    let finalKey = notification_key;
    if (!finalKey && entity_type && entity_id) {
      finalKey = `${type}:${entity_type}:${entity_id}`;
    }

    // Deduplication check: if key is present and force is false, avoid duplicate unread alerts
    if (finalKey && !force) {
      const activeNotification = await queryBuilder('notifications')
        .where({
          user_id: targetUserId,
          notification_key: finalKey,
          is_read: false
        })
        .first();

      if (activeNotification) {
        // Update the existing unread alert with latest message, title, metadata & timestamp
        await queryBuilder('notifications')
          .where({ id: activeNotification.id })
          .update({
            title,
            message,
            severity: normalizedSeverity,
            action_url: action_url || activeNotification.action_url,
            metadata: metadata ? (typeof metadata === 'object' ? JSON.stringify(metadata) : metadata) : activeNotification.metadata,
            updated_at: queryBuilder.fn.now()
          });

        logger.info(`[NotificationService] Deduplicated notification updated: ID ${activeNotification.id} (Key: ${finalKey}) for user ${targetUserId}`);
        const updated = await queryBuilder('notifications').where({ id: activeNotification.id }).first();
        return this._normalizeNotification(updated);
      }
    }

    const insertData = {
      user_id: targetUserId,
      type,
      title,
      message,
      severity: normalizedSeverity,
      is_read: false,
      read_at: null,
      entity_type: entity_type || null,
      entity_id: entity_id ? String(entity_id) : null,
      action_url: action_url || null,
      notification_key: finalKey || null,
      metadata: metadata ? (typeof metadata === 'object' ? JSON.stringify(metadata) : metadata) : null,
      created_at: queryBuilder.fn.now(),
      updated_at: queryBuilder.fn.now()
    };

    const [insertedId] = await queryBuilder('notifications').insert(insertData);
    logger.info(`[NotificationService] Notification created: ID ${insertedId} for user ${targetUserId} [${type} - ${normalizedSeverity}]`);

    const created = await queryBuilder('notifications').where({ id: insertedId }).first();
    return this._normalizeNotification(created);
  }

  /**
   * Bulk create notifications for multiple users
   */
  async createBulkNotifications({ userIds = [], ...notificationData }) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return [];
    }

    const results = [];
    for (const uId of userIds) {
      try {
        const item = await this.createNotification({ ...notificationData, user_id: uId });
        results.push(item);
      } catch (err) {
        logger.error(`[NotificationService] Failed to create notification for user ${uId}: ${err.message}`);
      }
    }
    return results;
  }

  /**
   * Retrieve paginated notifications for the authenticated user with filters
   */
  async getUserNotifications(userId, {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    unread,
    type,
    severity,
    search
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(limit, 10) || DEFAULT_PAGE_SIZE));
    const offset = (pageNum - 1) * limitNum;

    let query = db('notifications').where({ user_id: userId });

    // Filter by read/unread
    if (unread !== undefined && unread !== null && unread !== '') {
      const isUnread = unread === true || unread === 'true' || unread === 1 || unread === '1';
      query = query.where('is_read', !isUnread);
    }

    // Filter by type
    if (type) {
      query = query.where('type', type);
    }

    // Filter by severity
    if (severity) {
      query = query.where('severity', severity.toUpperCase());
    }

    // Search in title and message
    if (search && search.trim()) {
      const pattern = `%${search.trim()}%`;
      query = query.where(function() {
        this.where('title', 'like', pattern).orWhere('message', 'like', pattern);
      });
    }

    // Count total matching notifications
    const countQuery = query.clone().clearSelect().count('* as total');
    const [countResult] = await countQuery;
    const total = parseInt(countResult.total, 10) || 0;
    const totalPages = Math.ceil(total / limitNum) || 1;

    // Fetch records sorted by newest first
    const rows = await query
      .select('*')
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .limit(limitNum)
      .offset(offset);

    // Fetch total unread count for user (regardless of current page/filter)
    const { count: unreadCount } = await this.getUnreadCount(userId);

    const notifications = rows.map((r) => this._normalizeNotification(r));

    return {
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      },
      unreadCount
    };
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId) {
    const [result] = await db('notifications')
      .where({ user_id: userId, is_read: false })
      .count('* as count');

    const count = parseInt(result?.count, 10) || 0;
    return { count };
  }

  /**
   * Mark a single notification as read (Strictly scoped to user_id)
   */
  async markAsRead(id, userId) {
    const notification = await db('notifications')
      .where({ id, user_id: userId })
      .first();

    if (!notification) {
      throw ApiError.notFound(errorCodes.NOTIFICATION_NOT_FOUND, 'Notification not found');
    }

    if (notification.is_read) {
      return this._normalizeNotification(notification);
    }

    await db('notifications')
      .where({ id, user_id: userId })
      .update({
        is_read: true,
        read_at: db.fn.now(),
        updated_at: db.fn.now()
      });

    const updated = await db('notifications').where({ id, user_id: userId }).first();
    return this._normalizeNotification(updated);
  }

  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId) {
    const affected = await db('notifications')
      .where({ user_id: userId, is_read: false })
      .update({
        is_read: true,
        read_at: db.fn.now(),
        updated_at: db.fn.now()
      });

    logger.info(`[NotificationService] Marked all notifications read for user ${userId} (${affected} updated)`);
    return { updatedCount: affected };
  }

  /**
   * Delete / dismiss a notification (Strictly scoped to user_id)
   */
  async deleteNotification(id, userId) {
    const notification = await db('notifications')
      .where({ id, user_id: userId })
      .first();

    if (!notification) {
      throw ApiError.notFound(errorCodes.NOTIFICATION_NOT_FOUND, 'Notification not found');
    }

    await db('notifications').where({ id, user_id: userId }).del();
    logger.info(`[NotificationService] Deleted notification ID ${id} for user ${userId}`);

    return { id: parseInt(id, 10), success: true };
  }

  /**
   * Optional helper: delete all read notifications for user cleanup
   */
  async deleteAllRead(userId) {
    const affected = await db('notifications')
      .where({ user_id: userId, is_read: true })
      .del();

    logger.info(`[NotificationService] Deleted ${affected} read notifications for user ${userId}`);
    return { deletedCount: affected };
  }
}

module.exports = new NotificationService();
