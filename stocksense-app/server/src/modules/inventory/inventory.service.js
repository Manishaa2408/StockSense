const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

class InventoryService {
  async getAll({ page = 1, limit = 20, search = '', product_id, warehouse_id, location_id, status }) {
    const offset = (page - 1) * limit;

    let query = db('inventory')
      .join('products', 'inventory.product_id', 'products.id')
      .join('warehouses', 'inventory.warehouse_id', 'warehouses.id')
      .join('locations', 'inventory.location_id', 'locations.id')
      .select(
        'inventory.*',
        'products.name as product_name',
        'products.sku as product_sku',
        'products.reorder_level',
        'warehouses.name as warehouse_name',
        'locations.name as location_name',
        db.raw('(inventory.quantity - inventory.reserved_quantity) as available_quantity')
      );

    if (search) {
      query = query.where(function () {
        this.where('products.name', 'like', `%${search}%`)
          .orWhere('products.sku', 'like', `%${search}%`);
      });
    }

    if (product_id) query = query.where('inventory.product_id', product_id);
    if (warehouse_id) query = query.where('inventory.warehouse_id', warehouse_id);
    if (location_id) query = query.where('inventory.location_id', location_id);

    if (status) {
      if (status === 'OUT_OF_STOCK') {
        query = query.where('inventory.quantity', '<=', 0);
      } else if (status === 'LOW_STOCK') {
        query = query.whereRaw('(inventory.quantity - inventory.reserved_quantity) <= products.reorder_level').andWhere('inventory.quantity', '>', 0);
      } else if (status === 'IN_STOCK') {
        query = query.whereRaw('(inventory.quantity - inventory.reserved_quantity) > products.reorder_level');
      }
    }

    const [countResult] = await query.clone().clearSelect().count('* as total');
    const total = parseInt(countResult.total, 10);
    const totalPages = Math.ceil(total / limit);

    const inventory = await query.limit(limit).offset(offset).orderBy('inventory.updated_at', 'desc');

    const mappedInventory = inventory.map(item => {
      let currentStatus = 'IN_STOCK';
      if (item.quantity <= 0) {
        currentStatus = 'OUT_OF_STOCK';
      } else if (item.available_quantity <= item.reorder_level) {
        currentStatus = 'LOW_STOCK';
      }
      return { ...item, status: currentStatus };
    });

    return { inventory: mappedInventory, pagination: { page, limit, total, totalPages } };
  }

  async getById(id) {
    const item = await db('inventory')
      .join('products', 'inventory.product_id', 'products.id')
      .join('warehouses', 'inventory.warehouse_id', 'warehouses.id')
      .join('locations', 'inventory.location_id', 'locations.id')
      .where('inventory.id', id)
      .select(
        'inventory.*',
        'products.name as product_name',
        'products.sku as product_sku',
        'warehouses.name as warehouse_name',
        'locations.name as location_name',
        db.raw('(inventory.quantity - inventory.reserved_quantity) as available_quantity')
      )
      .first();

    if (!item) {
      throw ApiError.notFound('RESOURCE_NOT_FOUND', 'Inventory record not found');
    }
    return item;
  }

  async getStockSummary({ productId, warehouseId, locationId }) {
    let query = db('inventory');
    if (productId) query = query.where('product_id', productId);
    if (warehouseId) query = query.where('warehouse_id', warehouseId);
    if (locationId) query = query.where('location_id', locationId);

    const result = await query.select(
      db.raw('COALESCE(SUM(quantity), 0) as total_quantity'),
      db.raw('COALESCE(SUM(reserved_quantity), 0) as total_reserved'),
      db.raw('COALESCE(SUM(quantity - reserved_quantity), 0) as total_available')
    ).first();

    return result;
  }

  async getAvailableStock(productId, locationId, trx = db) {
    const record = await trx('inventory')
      .where({ product_id: productId, location_id: locationId })
      .first();
    if (!record) return 0;
    return Math.max(0, record.quantity - record.reserved_quantity);
  }

  async hasSufficientStock(productId, locationId, requestedQuantity, trx = db) {
    const available = await this.getAvailableStock(productId, locationId, trx);
    return available >= requestedQuantity;
  }

  async increaseStock({ productId, warehouseId, locationId, quantity, trx = db }) {
    const loc = await trx('locations').where({ id: locationId, warehouse_id: warehouseId }).first();
    if (!loc) {
      throw ApiError.badRequest('INVENTORY_INVALID_LOCATION', 'Location does not belong to specified warehouse');
    }

    const existing = await trx('inventory')
      .where({ product_id: productId, location_id: locationId })
      .forUpdate()
      .first();

    if (existing) {
      await trx('inventory')
        .where('id', existing.id)
        .update({
          quantity: db.raw(`quantity + ?`, [quantity]),
          updated_at: db.fn.now()
        });
      return await trx('inventory').where('id', existing.id).first();
    } else {
      const [id] = await trx('inventory').insert({
        product_id: productId,
        warehouse_id: warehouseId,
        location_id: locationId,
        quantity,
      });
      return await trx('inventory').where('id', id).first();
    }
  }

  async decreaseStock({ productId, locationId, quantity, trx = db }) {
    const existing = await trx('inventory')
      .where({ product_id: productId, location_id: locationId })
      .forUpdate()
      .first();

    if (!existing || (existing.quantity - existing.reserved_quantity) < quantity) {
      throw ApiError.badRequest('INSUFFICIENT_STOCK', `Insufficient stock available for product ID ${productId} at location ID ${locationId}`);
    }

    await trx('inventory')
      .where('id', existing.id)
      .update({
        quantity: db.raw(`quantity - ?`, [quantity]),
        updated_at: db.fn.now()
      });

    return await trx('inventory').where('id', existing.id).first();
  }
}

module.exports = new InventoryService();
