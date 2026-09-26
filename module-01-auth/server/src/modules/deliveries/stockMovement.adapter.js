const db = require('../../config/database');
const logger = require('../../utils/logger');

class StockMovementAdapter {
  static async hasMovementTable(trx = db) {
    try {
      return await trx.schema.hasTable('stock_movements');
    } catch {
      return false;
    }
  }

  static async recordMovement({
    productId,
    sourceLocationId,
    quantity,
    referenceId,
    performedBy,
    trx
  }) {
    const tableExists = await this.hasMovementTable(trx);
    if (!tableExists) {
      logger.info(`[StockMovementAdapter] stock_movements table not yet initialized. Mocking ledger entry: Product ${productId}, Qty ${quantity}, Delivery #${referenceId}, User ${performedBy}`);
      return null;
    }

    const [id] = await trx('stock_movements').insert({
      product_id: productId,
      source_location_id: sourceLocationId,
      destination_location_id: null,
      quantity,
      movement_type: 'DELIVERY',
      reference_type: 'DELIVERY',
      reference_id: referenceId,
      performed_by: performedBy,
      created_at: trx.fn.now()
    });

    logger.info(`[StockMovementAdapter] Recorded stock movement ID ${id} for delivery ID ${referenceId}`);
    return id;
  }
}

module.exports = StockMovementAdapter;
