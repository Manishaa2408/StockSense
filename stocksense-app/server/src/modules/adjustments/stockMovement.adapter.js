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

  /**
   * Record a single ADJUSTMENT stock movement (INCREASE or DECREASE)
   */
  static async recordAdjustmentMovement({
    productId,
    locationId,
    adjustmentType,  // 'INCREASE' | 'DECREASE'
    quantity,
    stockBefore,
    stockAfter,
    adjustmentId,
    adjustmentReference,
    reason,
    performedBy,
    trx
  }) {
    const tableExists = await this.hasMovementTable(trx);
    const movementType = adjustmentType === 'INCREASE' ? 'ADJUSTMENT_INCREASE' : 'ADJUSTMENT_DECREASE';

    if (!tableExists) {
      logger.info(`[AdjMovementAdapter] stock_movements table absent. Mocking ${movementType} for ${adjustmentReference}, product ${productId}, qty ${quantity}`);
      return null;
    }

    const [movId] = await trx('stock_movements').insert({
      product_id: productId,
      location_id: locationId,
      movement_type: movementType,
      quantity,
      stock_before: stockBefore,
      stock_after: stockAfter,
      reference_type: 'ADJUSTMENT',
      reference_id: adjustmentId,
      reference_number: adjustmentReference,
      reason: reason || null,
      performed_by: performedBy,
      created_at: trx.fn.now()
    });

    logger.info(`[AdjMovementAdapter] Recorded movement ID ${movId}: ${movementType} product ${productId} qty ${quantity} ref ${adjustmentReference}`);
    return movId;
  }
}

module.exports = StockMovementAdapter;
