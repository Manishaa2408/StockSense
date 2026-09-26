const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');
const logger = require('../../utils/logger');

class InventoryAdapter {
  static async hasStockTable(trx = db) {
    try {
      return await trx.schema.hasTable('stock');
    } catch {
      return false;
    }
  }

  /**
   * Get current quantity at a location (no lock)
   */
  static async getAvailableStock(productId, locationId, trx = db) {
    const tableExists = await this.hasStockTable(trx);
    if (!tableExists) return null;

    const stockRecord = await trx('stock')
      .where({ product_id: productId, location_id: locationId })
      .first();

    if (!stockRecord) return 0;
    const qty = Number(stockRecord.quantity) || 0;
    const reserved = Number(stockRecord.reserved_quantity) || 0;
    return Math.max(0, qty - reserved);
  }

  /**
   * Atomic DECREASE with SELECT FOR UPDATE row lock.
   * Returns { stockBefore, stockAfter }
   */
  static async decreaseStock({ productId, locationId, quantity, trx }) {
    const tableExists = await this.hasStockTable(trx);
    if (!tableExists) {
      logger.info(`[AdjInventoryAdapter] stock table absent. Mocking DECREASE product ${productId} loc ${locationId} qty ${quantity}`);
      return { stockBefore: null, stockAfter: null };
    }

    const record = await trx('stock')
      .where({ product_id: productId, location_id: locationId })
      .forUpdate()
      .first();

    if (!record) {
      throw ApiError.badRequest(
        errorCodes.ADJUSTMENT_INSUFFICIENT_STOCK,
        `No stock record for product ID ${productId} at location ID ${locationId}. Available: 0.`
      );
    }

    const available = Number(record.quantity) - Number(record.reserved_quantity || 0);
    const requested = Number(quantity);

    if (requested > available) {
      throw ApiError.badRequest(
        errorCodes.ADJUSTMENT_INSUFFICIENT_STOCK,
        `Insufficient stock for product ID ${productId}. Available: ${available}, Requested: ${requested}.`
      );
    }

    const stockBefore = Number(record.quantity);
    const stockAfter = stockBefore - requested;

    await trx('stock').where({ id: record.id }).decrement('quantity', requested);

    logger.info(`[AdjInventoryAdapter] DECREASE product ${productId} loc ${locationId}: ${stockBefore} → ${stockAfter}`);
    return { stockBefore, stockAfter };
  }

  /**
   * Atomic INCREASE with SELECT FOR UPDATE row lock.
   * Returns { stockBefore, stockAfter }
   */
  static async increaseStock({ productId, locationId, quantity, trx }) {
    const tableExists = await this.hasStockTable(trx);
    if (!tableExists) {
      logger.info(`[AdjInventoryAdapter] stock table absent. Mocking INCREASE product ${productId} loc ${locationId} qty ${quantity}`);
      return { stockBefore: null, stockAfter: null };
    }

    const requested = Number(quantity);

    const record = await trx('stock')
      .where({ product_id: productId, location_id: locationId })
      .forUpdate()
      .first();

    if (record) {
      const stockBefore = Number(record.quantity);
      const stockAfter = stockBefore + requested;
      await trx('stock').where({ id: record.id }).increment('quantity', requested);
      logger.info(`[AdjInventoryAdapter] INCREASE product ${productId} loc ${locationId}: ${stockBefore} → ${stockAfter}`);
      return { stockBefore, stockAfter };
    } else {
      await trx('stock').insert({
        product_id: productId,
        location_id: locationId,
        quantity: requested,
        reserved_quantity: 0,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });
      logger.info(`[AdjInventoryAdapter] INCREASE (new record) product ${productId} loc ${locationId}: 0 → ${requested}`);
      return { stockBefore: 0, stockAfter: requested };
    }
  }
}

module.exports = InventoryAdapter;
