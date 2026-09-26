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
   * Record paired stock movements: TRANSFER_OUT from source and TRANSFER_IN to destination
   */
  static async recordTransferMovements({
    productId,
    sourceLocationId,
    destinationLocationId,
    quantity,
    transferId,
    transferReference,
    performedBy,
    trx
  }) {
    const tableExists = await this.hasMovementTable(trx);
    if (!tableExists) {
      logger.info(`[StockMovementAdapter] 'stock_movements' table not yet initialized. Mocking ledger records for Transfer #${transferReference}: Out from Loc ${sourceLocationId}, In to Loc ${destinationLocationId}, Product ${productId}, Qty ${quantity}`);
      return null;
    }

    // 1. Record TRANSFER_OUT from source location
    const [outId] = await trx('stock_movements').insert({
      product_id: productId,
      source_location_id: sourceLocationId,
      destination_location_id: destinationLocationId,
      quantity,
      movement_type: 'TRANSFER_OUT',
      reference_type: 'TRANSFER',
      reference_id: transferId,
      performed_by: performedBy,
      created_at: trx.fn.now()
    });

    // 2. Record TRANSFER_IN to destination location
    const [inId] = await trx('stock_movements').insert({
      product_id: productId,
      source_location_id: sourceLocationId,
      destination_location_id: destinationLocationId,
      quantity,
      movement_type: 'TRANSFER_IN',
      reference_type: 'TRANSFER',
      reference_id: transferId,
      performed_by: performedBy,
      created_at: trx.fn.now()
    });

    logger.info(`[StockMovementAdapter] Recorded movement pair (OUT: ${outId}, IN: ${inId}) for Transfer #${transferReference}`);
    return { outId, inId };
  }
}

module.exports = StockMovementAdapter;
