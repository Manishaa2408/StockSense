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

  static async getAvailableStock(productId, locationId, trx = db) {
    const tableExists = await this.hasStockTable(trx);
    if (!tableExists) {
      return null;
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

  static async checkAndDeductStock({ productId, locationId, quantity, trx }) {
    const tableExists = await this.hasStockTable(trx);
    if (!tableExists) {
      logger.info(`[InventoryAdapter] Stock table not yet initialized. Mocking stock deduction for product ${productId} at location ${locationId} (qty: ${quantity})`);
      return;
    }

    const stockRecord = await trx('stock')
      .where({ product_id: productId, location_id: locationId })
      .forUpdate()
      .first();

    if (!stockRecord) {
      throw ApiError.badRequest(
        errorCodes.INSUFFICIENT_STOCK || 'INSUFFICIENT_STOCK',
        `No stock record found for product ID ${productId} at location ID ${locationId}. Available stock: 0`
      );
    }

    const available = Number(stockRecord.quantity) - Number(stockRecord.reserved_quantity || 0);
    const requested = Number(quantity);

    if (requested > available) {
      throw ApiError.badRequest(
        errorCodes.INSUFFICIENT_STOCK || 'INSUFFICIENT_STOCK',
        `Insufficient stock for product ID ${productId}. Available: ${available}, Requested: ${requested}`
      );
    }

    await trx('stock')
      .where({ id: stockRecord.id })
      .decrement('quantity', requested);

    logger.info(`[InventoryAdapter] Successfully deducted ${requested} of product ${productId} at location ${locationId}.`);
  }
}

module.exports = InventoryAdapter;
