const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');
const logger = require('../../utils/logger');
const InventoryAdapter = require('./inventory.adapter');
const StockMovementAdapter = require('./stockMovement.adapter');
const notificationService = require('../notifications/notifications.service');
const auditService = require('../audit/audit.service');

const generateReference = async (trx = db) => {
  const lastDelivery = await trx('deliveries')
    .where('reference', 'like', 'DO-%')
    .orderBy('id', 'desc')
    .first();

  let nextNumber = 1;
  if (lastDelivery && lastDelivery.reference) {
    const match = lastDelivery.reference.match(/^DO-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    } else {
      nextNumber = lastDelivery.id + 1;
    }
  }

  return `DO-${String(nextNumber).padStart(6, '0')}`;
};

const getAll = async ({
  page = 1,
  limit = 20,
  search,
  status,
  warehouse_id,
  location_id,
  from_date,
  to_date
}) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  const query = db('deliveries')
    .leftJoin('users as creator', 'deliveries.created_by', '=', 'creator.id')
    .select(
      'deliveries.*',
      db.raw("CONCAT(creator.first_name, ' ', creator.last_name) as creator_name")
    );

  const countQuery = db('deliveries').count('* as total');

  if (search) {
    const searchPattern = `%${search.trim()}%`;
    query.where(function() {
      this.where('deliveries.reference', 'like', searchPattern)
        .orWhere('deliveries.notes', 'like', searchPattern);
    });
    countQuery.where(function() {
      this.where('deliveries.reference', 'like', searchPattern)
        .orWhere('deliveries.notes', 'like', searchPattern);
    });
  }

  if (status) {
    query.where('deliveries.status', status);
    countQuery.where('deliveries.status', status);
  }

  if (warehouse_id) {
    query.where('deliveries.source_warehouse_id', warehouse_id);
    countQuery.where('deliveries.source_warehouse_id', warehouse_id);
  }

  if (location_id) {
    query.where('deliveries.source_location_id', location_id);
    countQuery.where('deliveries.source_location_id', location_id);
  }

  if (from_date) {
    query.where('deliveries.scheduled_date', '>=', from_date);
    countQuery.where('deliveries.scheduled_date', '>=', from_date);
  }

  if (to_date) {
    query.where('deliveries.scheduled_date', '<=', to_date);
    countQuery.where('deliveries.scheduled_date', '<=', to_date);
  }

  const [{ total }] = await countQuery;
  const deliveries = await query.orderBy('deliveries.created_at', 'desc').limit(limitNum).offset(offset);

  if (deliveries.length > 0) {
    const deliveryIds = deliveries.map(d => d.id);
    const itemCounts = await db('delivery_items')
      .whereIn('delivery_id', deliveryIds)
      .groupBy('delivery_id')
      .select('delivery_id', db.raw('count(*) as item_count'), db.raw('sum(requested_quantity) as total_requested_qty'));

    const countsMap = {};
    itemCounts.forEach(c => {
      countsMap[c.delivery_id] = {
        item_count: parseInt(c.item_count, 10),
        total_requested_qty: parseFloat(c.total_requested_qty) || 0
      };
    });

    deliveries.forEach(d => {
      d.item_count = countsMap[d.id]?.item_count || 0;
      d.total_requested_qty = countsMap[d.id]?.total_requested_qty || 0;
    });
  }

  return {
    deliveries,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: parseInt(total, 10),
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

const getById = async (id) => {
  const delivery = await db('deliveries')
    .leftJoin('users as creator', 'deliveries.created_by', '=', 'creator.id')
    .leftJoin('users as updater', 'deliveries.updated_by', '=', 'updater.id')
    .select(
      'deliveries.*',
      db.raw("CONCAT(creator.first_name, ' ', creator.last_name) as creator_name"),
      'creator.email as creator_email',
      db.raw("CONCAT(updater.first_name, ' ', updater.last_name) as updater_name")
    )
    .where('deliveries.id', id)
    .first();

  if (!delivery) {
    throw ApiError.notFound(errorCodes.DELIVERY_NOT_FOUND || 'DELIVERY_NOT_FOUND', 'Delivery order not found');
  }

  const items = await db('delivery_items')
    .leftJoin('products', 'delivery_items.product_id', '=', 'products.id')
    .leftJoin('units', 'products.unit_id', '=', 'units.id')
    .select(
      'delivery_items.*',
      'products.name as product_name',
      'products.sku as product_sku',
      'units.code as unit_code'
    )
    .where('delivery_id', id)
    .orderBy('delivery_items.id', 'asc');

  delivery.items = items;
  return delivery;
};

const create = async (data, user) => {
  const { source_warehouse_id, source_location_id, scheduled_date, notes, items } = data;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest(errorCodes.VALIDATION_ERROR, 'Delivery must include at least one item');
  }

  const consolidatedMap = new Map();
  for (const item of items) {
    const qty = parseFloat(item.requested_quantity);
    if (isNaN(qty) || qty <= 0) {
      throw ApiError.badRequest('INVALID_QUANTITY', 'Item quantity must be greater than zero');
    }
    const existing = consolidatedMap.get(item.product_id) || 0;
    consolidatedMap.set(item.product_id, existing + qty);
  }

  return await db.transaction(async (trx) => {
    const reference = await generateReference(trx);

    const [deliveryId] = await trx('deliveries').insert({
      reference,
      source_warehouse_id,
      source_location_id,
      status: 'DRAFT',
      scheduled_date: scheduled_date || null,
      notes: notes || null,
      created_by: user.id,
      created_at: trx.fn.now(),
      updated_at: trx.fn.now()
    });

    const itemsToInsert = Array.from(consolidatedMap.entries()).map(([productId, quantity]) => ({
      delivery_id: deliveryId,
      product_id: productId,
      requested_quantity: quantity,
      processed_quantity: 0.0000,
      created_at: trx.fn.now(),
      updated_at: trx.fn.now()
    }));

    logger.info(`[DeliveryService] Created Delivery Order ${reference} (ID: ${deliveryId}) in DRAFT status by User ${user.id}`);

    // Module 15 Audit Log
    await auditService.createAuditLog({
      userId: user.id,
      action: 'CREATE',
      module: 'DELIVERIES',
      entityType: 'DELIVERY',
      entityId: deliveryId,
      description: `Delivery order ${reference} created in DRAFT status`,
      afterData: {
        id: deliveryId,
        reference,
        source_warehouse_id,
        source_location_id,
        status: 'DRAFT',
        scheduled_date: scheduled_date || null
      },
      trx
    });

    const delivery = await trx('deliveries').where({ id: deliveryId }).first();
    delivery.items = await trx('delivery_items').where({ delivery_id: deliveryId });
    return delivery;
  });
};

const update = async (id, data, user) => {
  return await db.transaction(async (trx) => {
    const delivery = await trx('deliveries').where({ id }).forUpdate().first();

    if (!delivery) {
      throw ApiError.notFound(errorCodes.DELIVERY_NOT_FOUND || 'DELIVERY_NOT_FOUND', 'Delivery order not found');
    }

    if (delivery.status !== 'DRAFT') {
      throw ApiError.badRequest(
        'INVALID_STATUS_TRANSITION',
        `Cannot update delivery in ${delivery.status} status. Only DRAFT deliveries can be modified.`
      );
    }

    const updatePayload = {
      updated_by: user.id,
      updated_at: trx.fn.now()
    };

    if (data.source_warehouse_id) updatePayload.source_warehouse_id = data.source_warehouse_id;
    if (data.source_location_id) updatePayload.source_location_id = data.source_location_id;
    if (data.scheduled_date !== undefined) updatePayload.scheduled_date = data.scheduled_date || null;
    if (data.notes !== undefined) updatePayload.notes = data.notes || null;

    await trx('deliveries').where({ id }).update(updatePayload);

    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      const consolidatedMap = new Map();
      for (const item of data.items) {
        const qty = parseFloat(item.requested_quantity);
        if (isNaN(qty) || qty <= 0) {
          throw ApiError.badRequest('INVALID_QUANTITY', 'Item quantity must be greater than zero');
        }
        const existing = consolidatedMap.get(item.product_id) || 0;
        consolidatedMap.set(item.product_id, existing + qty);
      }

      await trx('delivery_items').where({ delivery_id: id }).del();

      const itemsToInsert = Array.from(consolidatedMap.entries()).map(([productId, quantity]) => ({
        delivery_id: id,
        product_id: productId,
        requested_quantity: quantity,
        processed_quantity: 0.0000,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      }));

      await trx('delivery_items').insert(itemsToInsert);
    }

    logger.info(`[DeliveryService] Updated DRAFT Delivery Order ${delivery.reference} (ID: ${id}) by User ${user.id}`);

    const updated = await trx('deliveries').where({ id }).first();
    updated.items = await trx('delivery_items').where({ delivery_id: id });
    return updated;
  });
};

const markReady = async (id, user) => {
  return await db.transaction(async (trx) => {
    const delivery = await trx('deliveries').where({ id }).forUpdate().first();

    if (!delivery) {
      throw ApiError.notFound(errorCodes.DELIVERY_NOT_FOUND || 'DELIVERY_NOT_FOUND', 'Delivery order not found');
    }

    if (delivery.status !== 'DRAFT') {
      throw ApiError.badRequest(
        'INVALID_STATUS_TRANSITION',
        `Cannot mark delivery as READY from ${delivery.status} status. Only DRAFT orders can be marked READY.`
      );
    }

    const items = await trx('delivery_items').where({ delivery_id: id });
    if (!items || items.length === 0) {
      throw ApiError.badRequest(
        errorCodes.VALIDATION_ERROR,
        'Cannot mark delivery as READY without at least one line item.'
      );
    }

    await trx('deliveries').where({ id }).update({
      status: 'READY',
      updated_by: user.id,
      updated_at: trx.fn.now()
    });

    logger.info(`[DeliveryService] Delivery ${delivery.reference} (ID: ${id}) transitioned to READY by User ${user.id}`);

    // Module 15 Audit Log
    await auditService.createAuditLog({
      userId: user.id,
      action: 'STATUS_CHANGE',
      module: 'DELIVERIES',
      entityType: 'DELIVERY',
      entityId: id,
      description: `Delivery order ${delivery.reference} marked as READY`,
      beforeData: { status: 'DRAFT' },
      afterData: { status: 'READY' },
      trx
    });

    // Trigger notification hook for Module 14
    if (delivery.created_by) {
      notificationService.createNotification({
        user_id: delivery.created_by,
        type: 'DELIVERY_READY',
        title: 'Delivery Ready',
        message: `Delivery ${delivery.reference} is ready for processing`,
        severity: 'INFO',
        entity_type: 'DELIVERY',
        entity_id: id,
        action_url: `/deliveries/${id}`,
        notification_key: `DELIVERY_READY:DELIVERY:${id}`
      }).catch(err => logger.error(`[DeliveryService] Notification error: ${err.message}`));
    }

    return updated;
  });
};

const validateDelivery = async (id, user) => {
  return await db.transaction(async (trx) => {
    const delivery = await trx('deliveries').where({ id }).forUpdate().first();

    if (!delivery) {
      throw ApiError.notFound(errorCodes.DELIVERY_NOT_FOUND || 'DELIVERY_NOT_FOUND', 'Delivery order not found');
    }

    if (delivery.status === 'DONE') {
      throw ApiError.badRequest(
        'DELIVERY_ALREADY_VALIDATED',
        'Delivery order has already been validated and completed.'
      );
    }

    if (delivery.status === 'CANCELED') {
      throw ApiError.badRequest(
        'INVALID_STATUS_TRANSITION',
        'Cannot validate a canceled delivery order.'
      );
    }

    if (delivery.status !== 'READY') {
      throw ApiError.badRequest(
        'INVALID_STATUS_TRANSITION',
        `Cannot validate delivery in ${delivery.status} status. Delivery must be marked READY before validation.`
      );
    }

    const items = await trx('delivery_items').where({ delivery_id: id });
    if (!items || items.length === 0) {
      throw ApiError.badRequest(
        errorCodes.VALIDATION_ERROR,
        'Delivery order contains no items to validate'
      );
    }

    for (const item of items) {
      await InventoryAdapter.checkAndDeductStock({
        productId: item.product_id,
        locationId: delivery.source_location_id,
        quantity: item.requested_quantity,
        trx
      });

      await StockMovementAdapter.recordMovement({
        productId: item.product_id,
        sourceLocationId: delivery.source_location_id,
        quantity: item.requested_quantity,
        referenceId: delivery.id,
        performedBy: user.id,
        trx
      });

      await trx('delivery_items')
        .where({ id: item.id })
        .update({
          processed_quantity: item.requested_quantity,
          updated_at: trx.fn.now()
        });
    }

    await trx('deliveries').where({ id }).update({
      status: 'DONE',
      updated_by: user.id,
      updated_at: trx.fn.now()
    });

    logger.info(`[DeliveryService] Delivery ${delivery.reference} (ID: ${id}) validated and marked DONE by User ${user.id}`);

    // Module 15 Audit Log
    await auditService.createAuditLog({
      userId: user.id,
      action: 'VALIDATE',
      module: 'DELIVERIES',
      entityType: 'DELIVERY',
      entityId: id,
      description: `Delivery order ${delivery.reference} validated and marked DONE`,
      beforeData: { status: 'READY' },
      afterData: { status: 'DONE' },
      trx
    });

    // Trigger notification hook for Module 14
    if (delivery.created_by) {
      notificationService.createNotification({
        user_id: delivery.created_by,
        type: 'DELIVERY_COMPLETED',
        title: 'Delivery Completed',
        message: `Delivery ${delivery.reference} completed and validated`,
        severity: 'INFO',
        entity_type: 'DELIVERY',
        entity_id: id,
        action_url: `/deliveries/${id}`,
        notification_key: `DELIVERY_COMPLETED:DELIVERY:${id}`
      }).catch(err => logger.error(`[DeliveryService] Notification error: ${err.message}`));
    }

    return completed;
  });
};

const cancelDelivery = async (id, user, reason) => {
  return await db.transaction(async (trx) => {
    const delivery = await trx('deliveries').where({ id }).forUpdate().first();

    if (!delivery) {
      throw ApiError.notFound(errorCodes.DELIVERY_NOT_FOUND || 'DELIVERY_NOT_FOUND', 'Delivery order not found');
    }

    if (delivery.status === 'DONE') {
      throw ApiError.badRequest(
        'INVALID_STATUS_TRANSITION',
        'DONE delivery orders cannot be canceled. Completed deliveries are immutable.'
      );
    }

    if (delivery.status === 'CANCELED') {
      throw ApiError.badRequest(
        'DELIVERY_ALREADY_CANCELED',
        'Delivery order is already canceled.'
      );
    }

    const cancelNote = reason ? ` [Cancellation Reason: ${reason}]` : ' [Canceled]';
    const updatedNotes = delivery.notes ? `${delivery.notes}${cancelNote}` : cancelNote.trim();

    await trx('deliveries').where({ id }).update({
      status: 'CANCELED',
      notes: updatedNotes,
      updated_by: user.id,
      updated_at: trx.fn.now()
    });

    logger.info(`[DeliveryService] Delivery ${delivery.reference} (ID: ${id}) canceled by User ${user.id}`);

    // Module 15 Audit Log
    await auditService.createAuditLog({
      userId: user.id,
      action: 'CANCEL',
      module: 'DELIVERIES',
      entityType: 'DELIVERY',
      entityId: id,
      description: `Delivery order ${delivery.reference} was canceled${reason ? ': ' + reason : ''}`,
      beforeData: { status: delivery.status },
      afterData: { status: 'CANCELED', reason: reason || null },
      trx
    });

    // Trigger notification hook for Module 14
    if (delivery.created_by) {
      notificationService.createNotification({
        user_id: delivery.created_by,
        type: 'DELIVERY_CANCELED',
        title: 'Delivery Canceled',
        message: `Delivery ${delivery.reference} was canceled${reason ? ': ' + reason : ''}`,
        severity: 'WARNING',
        entity_type: 'DELIVERY',
        entity_id: id,
        action_url: `/deliveries/${id}`,
        notification_key: `DELIVERY_CANCELED:DELIVERY:${id}`
      }).catch(err => logger.error(`[DeliveryService] Notification error: ${err.message}`));
    }

    return canceled;
  });
};

const getMasterData = async () => {
  let warehouses = [];
  let locations = [];
  let products = [];

  const hasWarehouses = await db.schema.hasTable('warehouses').catch(() => false);
  if (hasWarehouses) {
    warehouses = await db('warehouses').select('id', 'name', 'code', 'status').where({ status: 'ACTIVE' });
  } else {
    warehouses = [
      { id: 1, name: 'Main Central Warehouse', code: 'WH-MAIN', status: 'ACTIVE' },
      { id: 2, name: 'Secondary Distribution Center', code: 'WH-SEC', status: 'ACTIVE' }
    ];
  }

  const hasLocations = await db.schema.hasTable('locations').catch(() => false);
  if (hasLocations) {
    locations = await db('locations').select('id', 'warehouse_id', 'name', 'code', 'status').where({ status: 'ACTIVE' });
  } else {
    locations = [
      { id: 1, warehouse_id: 1, name: 'Rack 01', code: 'RACK-01', status: 'ACTIVE' },
      { id: 2, warehouse_id: 1, name: 'Rack 02', code: 'RACK-02', status: 'ACTIVE' },
      { id: 3, warehouse_id: 1, name: 'Dispatch Bay A', code: 'DISPATCH-A', status: 'ACTIVE' },
      { id: 4, warehouse_id: 2, name: 'Zone B - Shelf 01', code: 'ZB-01', status: 'ACTIVE' },
      { id: 5, warehouse_id: 2, name: 'Zone B - Shelf 02', code: 'ZB-02', status: 'ACTIVE' }
    ];
  }

  const hasProducts = await db.schema.hasTable('products').catch(() => false);
  if (hasProducts) {
    products = await db('products').select('id', 'sku', 'name', 'description', 'status').where({ status: 'ACTIVE' });
  } else {
    products = [
      { id: 1, sku: 'PROD-DELL-XPS15', name: 'Dell XPS 15 Laptop', description: 'High performance laptop' },
      { id: 2, sku: 'PROD-LOGI-MXM3', name: 'Logitech MX Master 3 Mouse', description: 'Ergonomic wireless mouse' }
    ];
  }

  return { warehouses, locations, products };
};

const getStockAvailability = async (productId, locationId) => {
  const available = await InventoryAdapter.getAvailableStock(productId, locationId);
  return {
    product_id: parseInt(productId, 10),
    location_id: parseInt(locationId, 10),
    available_quantity: available !== null ? available : 100
  };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  markReady,
  validateDelivery,
  cancelDelivery,
  getMasterData,
  getStockAvailability
};
