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
   * Check available quantity at a given location
   */
  static async getAvailableStock(productId, locationId, trx = db) {
    const tableExists = await this.hasStockTable(trx);
    if (!tableExists) {
      return null; // Mock indicator: when table absent, fallback default will be provided
    }

    const stockRecord = await trx('stock')
      .where({ product_id: productId, location_id: locationId })
      .first();

    if (!stockRecord) {
      return 0;
    }

    const qty = Number(stockRecord.quantity) || 0;
    const reserved = Number(stockRecord.reserved_quantity) || 0;
    return Math.max(0, qty - reserved);
  }

  /**
   * Atomic stock deduction with row-level locking (SELECT ... FOR UPDATE)
   */
  static async deductStock({ productId, locationId, quantity, trx }) {
    const tableExists = await this.hasStockTable(trx);
    if (!tableExists) {
      logger.info(`[InventoryAdapter] 'stock' table not yet initialized. Mocking atomic deduction for product ${productId} at location ${locationId} (qty: ${quantity})`);
      return;
    }

    const stockRecord = await trx('stock')
      .where({ product_id: productId, location_id: locationId })
      .forUpdate()
      .first();

    if (!stockRecord) {
      throw ApiError.badRequest(
        errorCodes.TRANSFER_INSUFFICIENT_STOCK || 'TRANSFER_INSUFFICIENT_STOCK',
        `No stock record found for product ID ${productId} at source location ID ${locationId}. Available stock is 0.`
      );
    }

    const available = Number(stockRecord.quantity) - Number(stockRecord.reserved_quantity || 0);
    const requested = Number(quantity);

    if (requested > available) {
      throw ApiError.badRequest(
        errorCodes.TRANSFER_INSUFFICIENT_STOCK || 'TRANSFER_INSUFFICIENT_STOCK',
        `Insufficient stock for product ID ${productId} at source location ID ${locationId}. Available: ${available}, Requested: ${requested}.`
      );
    }

    await trx('stock')
      .where({ id: stockRecord.id })
      .decrement('quantity', requested);

    logger.info(`[InventoryAdapter] Successfully deducted ${requested} of product ${productId} at source location ${locationId}.`);
  }

  /**
   * Atomic stock addition to destination location with row-level locking
   */
  static async addStock({ productId, locationId, quantity, trx }) {
    const tableExists = await this.hasStockTable(trx);
    if (!tableExists) {
      logger.info(`[InventoryAdapter] 'stock' table not yet initialized. Mocking atomic addition for product ${productId} at destination location ${locationId} (qty: ${quantity})`);
      return;
    }

    const requested = Number(quantity);

    const destStockRecord = await trx('stock')
      .where({ product_id: productId, location_id: locationId })
      .forUpdate()
      .first();

    if (destStockRecord) {
      await trx('stock')
        .where({ id: destStockRecord.id })
        .increment('quantity', requested);
    } else {
      await trx('stock').insert({
        product_id: productId,
        location_id: locationId,
        quantity: requested,
        reserved_quantity: 0,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      });
    }

    logger.info(`[InventoryAdapter] Successfully added ${requested} of product ${productId} to destination location ${locationId}.`);
  }
}

module.exports = InventoryAdapter;
