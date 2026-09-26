const db = require('../../config/database');
const logger = require('../../utils/logger');

class AuditAdapter {
  static async hasAuditTable(trx = db) {
    try {
      return await trx.schema.hasTable('audit_logs');
    } catch {
      return false;
    }
  }

  /**
   * Record audit event for Module 15 integration
   */
  static async recordAuditEvent({
    entityId,
    action,
    performedBy,
    details = {},
    trx = db
  }) {
    const tableExists = await this.hasAuditTable(trx);
    if (!tableExists) {
      logger.info(`[AuditAdapter] 'audit_logs' table not yet initialized. Mocking audit event: MODULE=STOCK_TRANSFERS, ENTITY=STOCK_TRANSFER, ID=${entityId}, ACTION=${action}, USER=${performedBy}`);
      return null;
    }

    try {
      const [id] = await trx('audit_logs').insert({
        module: 'STOCK_TRANSFERS',
        entity_type: 'STOCK_TRANSFER',
        entity_id: String(entityId),
        action,
        user_id: performedBy,
        details: JSON.stringify(details),
        created_at: trx.fn.now()
      });

      return id;
    } catch (err) {
      logger.warn(`[AuditAdapter] Failed to record audit log: ${err.message}`);
      return null;
    }
  }
}

module.exports = AuditAdapter;
