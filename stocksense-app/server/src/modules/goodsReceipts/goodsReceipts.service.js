const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const inventoryService = require('../inventory/inventory.service');

class GoodsReceiptsService {
  async getAll({ page = 1, limit = 20, search = '', status, warehouse_id }) {
    const offset = (page - 1) * limit;

    let query = db('goods_receipts')
      .join('warehouses', 'goods_receipts.warehouse_id', 'warehouses.id')
      .join('locations', 'goods_receipts.location_id', 'locations.id')
      .join('users', 'goods_receipts.created_by', 'users.id')
      .leftJoin('goods_receipt_items', 'goods_receipts.id', 'goods_receipt_items.goods_receipt_id')
      .select(
        'goods_receipts.*',
        'warehouses.name as warehouse_name',
        'locations.name as location_name',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as creator_name")
      )
      .count('goods_receipt_items.id as item_count')
      .groupBy('goods_receipts.id');

    if (search) {
      query = query.where(function () {
        this.where('goods_receipts.receipt_number', 'like', `%${search}%`)
          .orWhere('goods_receipts.supplier_name', 'like', `%${search}%`);
      });
    }

    if (status) query = query.where('goods_receipts.status', status);
    if (warehouse_id) query = query.where('goods_receipts.warehouse_id', warehouse_id);

    const countQuery = db('goods_receipts');
    if (search) {
      countQuery.where(function () {
        this.where('receipt_number', 'like', `%${search}%`)
          .orWhere('supplier_name', 'like', `%${search}%`);
      });
    }
    if (status) countQuery.where('status', status);
    if (warehouse_id) countQuery.where('warehouse_id', warehouse_id);

    const [countResult] = await countQuery.count('* as total');
    const total = parseInt(countResult.total, 10);
    const totalPages = Math.ceil(total / limit);

    const list = await query.limit(limit).offset(offset).orderBy('goods_receipts.created_at', 'desc');

    return { list, pagination: { page, limit, total, totalPages } };
  }

  async getById(id) {
    const receipt = await db('goods_receipts')
      .join('warehouses', 'goods_receipts.warehouse_id', 'warehouses.id')
      .join('locations', 'goods_receipts.location_id', 'locations.id')
      .join('users', 'goods_receipts.created_by', 'users.id')
      .where('goods_receipts.id', id)
      .select(
        'goods_receipts.*',
        'warehouses.name as warehouse_name',
        'locations.name as location_name',
        db.raw("CONCAT(users.first_name, ' ', users.last_name) as creator_name")
      )
      .first();

    if (!receipt) {
      throw ApiError.notFound('RESOURCE_NOT_FOUND', 'Goods receipt not found');
    }

    const items = await db('goods_receipt_items')
      .join('products', 'goods_receipt_items.product_id', 'products.id')
      .leftJoin('units', 'products.unit_id', 'units.id')
      .where('goods_receipt_items.goods_receipt_id', id)
      .select(
        'goods_receipt_items.*',
        'products.name as product_name',
        'products.sku as product_sku',
        'units.code as unit_code'
      );

    receipt.items = items;
    return receipt;
  }

  generateReceiptNumber() {
    return `GRN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
  }

  async create(data, userId) {
    const loc = await db('locations').where({ id: data.location_id, warehouse_id: data.warehouse_id }).first();
    if (!loc) {
      throw ApiError.badRequest('INVALID_LOCATION', 'Location does not belong to specified warehouse');
    }

    const receiptNumber = this.generateReceiptNumber();
    let createdId;

    await db.transaction(async (trx) => {
      const { items, ...receiptData } = data;
      const [id] = await trx('goods_receipts').insert({
        ...receiptData,
        receipt_number: receiptNumber,
        status: 'DRAFT',
        created_by: userId,
      });
      createdId = id;

      const itemsToInsert = items.map(item => ({
        ...item,
        goods_receipt_id: id,
      }));

      await trx('goods_receipt_items').insert(itemsToInsert);
    });

    return this.getById(createdId);
  }

  async update(id, data, userId) {
    const existing = await db('goods_receipts').where('id', id).first();
    if (!existing) throw ApiError.notFound('RESOURCE_NOT_FOUND', 'Goods receipt not found');
    if (existing.status !== 'DRAFT') {
      throw ApiError.badRequest('INVALID_STATUS', `Cannot edit receipt in ${existing.status} status`);
    }

    await db.transaction(async (trx) => {
      const { items, ...receiptData } = data;
      if (Object.keys(receiptData).length > 0) {
        await trx('goods_receipts').where('id', id).update({
          ...receiptData,
          updated_by: userId,
          updated_at: db.fn.now()
        });
      }

      if (items) {
        await trx('goods_receipt_items').where('goods_receipt_id', id).del();
        const itemsToInsert = items.map(item => ({
          ...item,
          goods_receipt_id: id,
        }));
        await trx('goods_receipt_items').insert(itemsToInsert);
      }
    });

    return this.getById(id);
  }

  async markReceived(id, userId) {
    const existing = await db('goods_receipts').where('id', id).first();
    if (!existing) throw ApiError.notFound('RESOURCE_NOT_FOUND', 'Goods receipt not found');
    if (existing.status !== 'DRAFT') {
      throw ApiError.badRequest('INVALID_STATUS', `Cannot mark as received from ${existing.status} status`);
    }

    await db('goods_receipts').where('id', id).update({
      status: 'RECEIVED',
      updated_by: userId,
      updated_at: db.fn.now()
    });

    return this.getById(id);
  }

  async confirm(id, userId) {
    return await db.transaction(async (trx) => {
      const receipt = await trx('goods_receipts').where('id', id).forUpdate().first();
      if (!receipt) throw ApiError.notFound('RESOURCE_NOT_FOUND', 'Goods receipt not found');
      
      if (receipt.status === 'CONFIRMED') {
        throw ApiError.badRequest('INVALID_STATUS', 'Receipt has already been confirmed');
      }
      if (receipt.status === 'CANCELED') {
        throw ApiError.badRequest('INVALID_STATUS', 'Cannot confirm a canceled receipt');
      }

      const items = await trx('goods_receipt_items').where('goods_receipt_id', id);

      for (const item of items) {
        const quantityToAdd = item.accepted_quantity > 0 ? item.accepted_quantity : item.received_quantity;
        
        await inventoryService.increaseStock({
          productId: item.product_id,
          warehouseId: receipt.warehouse_id,
          locationId: receipt.location_id,
          quantity: quantityToAdd,
          trx
        });

        // check if stock_movements table exists implicitly by inserting
        await trx('stock_movements').insert({
          product_id: item.product_id,
          destination_location_id: receipt.location_id,
          quantity: quantityToAdd,
          movement_type: 'RECEIPT',
          reference_type: 'GOODS_RECEIPT',
          reference_id: receipt.receipt_number,
          performed_by: userId
        });
      }

      await trx('goods_receipts').where('id', id).update({
        status: 'CONFIRMED',
        updated_by: userId,
        updated_at: db.fn.now()
      });

      return this.getById(id);
    });
  }

  async cancel(id, reason, userId) {
    const existing = await db('goods_receipts').where('id', id).first();
    if (!existing) throw ApiError.notFound('RESOURCE_NOT_FOUND', 'Goods receipt not found');
    if (existing.status === 'CONFIRMED') {
      throw ApiError.badRequest('INVALID_STATUS', 'Cannot cancel a confirmed receipt');
    }

    await db('goods_receipts').where('id', id).update({
      status: 'CANCELED',
      notes: reason ? db.raw(`CONCAT(COALESCE(notes, ''), '\nCancel Reason: ${reason}')`) : undefined,
      updated_by: userId,
      updated_at: db.fn.now()
    });

    return this.getById(id);
  }
}

module.exports = new GoodsReceiptsService();
