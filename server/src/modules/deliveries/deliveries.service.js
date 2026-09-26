const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');
const logger = require('../../utils/logger');
const InventoryAdapter = require('./inventory.adapter');
const StockMovementAdapter = require('./stockMovement.adapter');

/**
 * Generate official unique delivery reference (e.g., DO-000001, DO-000002)
 */
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

/**
 * Get all delivery orders with pagination and filtering
 */
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

  // Load item counts for each delivery efficiently in one query
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

/**
 * Get delivery details by ID including line items
 */
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
    throw ApiError.notFound(errorCodes.DELIVERY_NOT_FOUND, 'Delivery order not found');
  }

  const items = await db('delivery_items')
    .where('delivery_id', id)
    .select('*')
    .orderBy('id', 'asc');

  delivery.items = items;
  return delivery;
};

/**
 * Create a new delivery order in DRAFT status
 * Backend validates products, location, quantities, and generates official reference.
 */
const create = async (data, user) => {
  const { source_warehouse_id, source_location_id, scheduled_date, notes, items } = data;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest(errorCodes.VALIDATION_ERROR, 'Delivery must include at least one item');
  }

  // Deduplicate and consolidate items by product_id if same product is submitted multiple times
  const consolidatedMap = new Map();
  for (const item of items) {
    const qty = parseFloat(item.requested_quantity);
    if (isNaN(qty) || qty <= 0) {
      throw ApiError.badRequest(errorCodes.INVALID_QUANTITY, 'Item quantity must be greater than zero');
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

    await trx('delivery_items').insert(itemsToInsert);

    logger.info(`[DeliveryService] Created delivery ${reference} (ID: ${deliveryId}) in DRAFT by User ${user.id}`);

    const createdDelivery = await trx('deliveries').where({ id: deliveryId }).first();
    const createdItems = await trx('delivery_items').where({ delivery_id: deliveryId });
    createdDelivery.items = createdItems;

    return createdDelivery;
  });
};

/**
 * Update an existing delivery order
 * Allowed ONLY when status is DRAFT.
 */
const update = async (id, data, user) => {
  return await db.transaction(async (trx) => {
    const delivery = await trx('deliveries').where({ id }).forUpdate().first();

    if (!delivery) {
      throw ApiError.notFound(errorCodes.DELIVERY_NOT_FOUND, 'Delivery order not found');
    }

    if (delivery.status !== 'DRAFT') {
      throw ApiError.badRequest(
        errorCodes.INVALID_STATUS_TRANSITION,
        `Cannot update delivery in ${delivery.status} status. Only DRAFT deliveries can be updated.`
      );
    }

    const updateFields = {
      updated_by: user.id,
      updated_at: trx.fn.now()
    };

    if (data.source_warehouse_id !== undefined) updateFields.source_warehouse_id = data.source_warehouse_id;
    if (data.source_location_id !== undefined) updateFields.source_location_id = data.source_location_id;
    if (data.scheduled_date !== undefined) updateFields.scheduled_date = data.scheduled_date || null;
    if (data.notes !== undefined) updateFields.notes = data.notes;

    await trx('deliveries').where({ id }).update(updateFields);

    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      // Consolidate line items
      const consolidatedMap = new Map();
      for (const item of data.items) {
        const qty = parseFloat(item.requested_quantity);
        if (isNaN(qty) || qty <= 0) {
          throw ApiError.badRequest(errorCodes.INVALID_QUANTITY, 'Item quantity must be greater than zero');
        }
        const existing = consolidatedMap.get(item.product_id) || 0;
        consolidatedMap.set(item.product_id, existing + qty);
      }

      await trx('delivery_items').where({ delivery_id: id }).delete();

      const newItems = Array.from(consolidatedMap.entries()).map(([productId, quantity]) => ({
        delivery_id: id,
        product_id: productId,
        requested_quantity: quantity,
        processed_quantity: 0.0000,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      }));

      await trx('delivery_items').insert(newItems);
    }

    logger.info(`[DeliveryService] Updated delivery ID ${id} by User ${user.id}`);

    const updated = await trx('deliveries').where({ id }).first();
    updated.items = await trx('delivery_items').where({ delivery_id: id });
    return updated;
  });
};

/**
 * Mark Delivery as READY (DRAFT -> READY)
 * Prepared for warehouse processing; does not modify stock.
 */
const markReady = async (id, user) => {
  return await db.transaction(async (trx) => {
    const delivery = await trx('deliveries').where({ id }).forUpdate().first();

    if (!delivery) {
      throw ApiError.notFound(errorCodes.DELIVERY_NOT_FOUND, 'Delivery order not found');
    }

    if (delivery.status !== 'DRAFT') {
      throw ApiError.badRequest(
        errorCodes.INVALID_STATUS_TRANSITION,
        `Cannot mark delivery as READY. Current status is ${delivery.status}. Only DRAFT can be marked READY.`
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

    const updated = await trx('deliveries').where({ id }).first();
    updated.items = items;
    return updated;
  });
};

/**
 * Validate Delivery (READY -> DONE)
 * CRITICAL ATOMIC TRANSACTION:
 * 1. Lock delivery row (pessimistic lock)
 * 2. Assert status is READY
 * 3. Lock stock rows & assert sufficient availability
 * 4. Decrement stock atomically
 * 5. Generate stock movement ledger record
 * 6. Set processed_quantity = requested_quantity
 * 7. Mark delivery DONE
 * 8. Commit (or rollback all on any failure)
 */
const validateDelivery = async (id, user) => {
  return await db.transaction(async (trx) => {
    // 1. Lock the delivery row
    const delivery = await trx('deliveries').where({ id }).forUpdate().first();

    if (!delivery) {
      throw ApiError.notFound(errorCodes.DELIVERY_NOT_FOUND, 'Delivery order not found');
    }

    // 2. Prevent duplicate validation or invalid transition
    if (delivery.status === 'DONE') {
      throw ApiError.badRequest(
        errorCodes.DELIVERY_ALREADY_VALIDATED,
        'Delivery order has already been validated and completed. Completed deliveries are immutable.'
      );
    }

    if (delivery.status === 'CANCELED') {
      throw ApiError.badRequest(
        errorCodes.INVALID_STATUS_TRANSITION,
        'Cannot validate a canceled delivery order.'
      );
    }

    if (delivery.status !== 'READY') {
      throw ApiError.badRequest(
        errorCodes.INVALID_STATUS_TRANSITION,
        `Cannot validate delivery in ${delivery.status} status. Delivery must be marked READY before validation.`
      );
    }

    // 3. Load items
    const items = await trx('delivery_items').where({ delivery_id: id });
    if (!items || items.length === 0) {
      throw ApiError.badRequest(
        errorCodes.VALIDATION_ERROR,
        'Delivery order contains no items to validate'
      );
    }

    // 4. Validate stock and perform atomic deductions with row-locking
    for (const item of items) {
      await InventoryAdapter.checkAndDeductStock({
        productId: item.product_id,
        locationId: delivery.source_location_id,
        quantity: item.requested_quantity,
        trx
      });

      // 5. Generate stock movement ledger entry
      await StockMovementAdapter.recordMovement({
        productId: item.product_id,
        sourceLocationId: delivery.source_location_id,
        quantity: item.requested_quantity,
        referenceId: delivery.id,
        performedBy: user.id,
        trx
      });

      // 6. Update line item processed quantity
      await trx('delivery_items')
        .where({ id: item.id })
        .update({
          processed_quantity: item.requested_quantity,
          updated_at: trx.fn.now()
        });
    }

    // 7. Mark delivery DONE
    await trx('deliveries').where({ id }).update({
      status: 'DONE',
      updated_by: user.id,
      updated_at: trx.fn.now()
    });

    logger.info(`[DeliveryService] Delivery ${delivery.reference} (ID: ${id}) successfully validated and marked DONE by User ${user.id}`);

    const completed = await trx('deliveries').where({ id }).first();
    completed.items = await trx('delivery_items').where({ delivery_id: id });
    return completed;
  });
};

/**
 * Cancel Delivery (DRAFT -> CANCELED or READY -> CANCELED)
 * DONE deliveries are immutable and CANNOT be canceled.
 */
const cancelDelivery = async (id, user, reason) => {
  return await db.transaction(async (trx) => {
    const delivery = await trx('deliveries').where({ id }).forUpdate().first();

    if (!delivery) {
      throw ApiError.notFound(errorCodes.DELIVERY_NOT_FOUND, 'Delivery order not found');
    }

    if (delivery.status === 'DONE') {
      throw ApiError.badRequest(
        errorCodes.INVALID_STATUS_TRANSITION,
        'DONE delivery orders cannot be canceled. Completed deliveries are immutable.'
      );
    }

    if (delivery.status === 'CANCELED') {
      throw ApiError.badRequest(
        errorCodes.DELIVERY_ALREADY_CANCELED,
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

    const canceled = await trx('deliveries').where({ id }).first();
    canceled.items = await trx('delivery_items').where({ delivery_id: id });
    return canceled;
  });
};

/**
 * Get master data (warehouses, locations, products) for delivery forms.
 * Queries actual database tables if they exist; otherwise provides standard defaults as specified in DATABASE_DESIGN.md.
 */
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
      { id: 101, sku: 'LAPTOP-PRO-15', name: 'Professional Laptop 15"', description: 'High performance laptop' },
      { id: 102, sku: 'MONITOR-4K-27', name: '4K Ultra HD Monitor 27"', description: 'IPS display monitor' },
      { id: 103, sku: 'KB-MECH-RGB', name: 'Mechanical Wireless Keyboard', description: 'RGB mechanical keyboard' },
      { id: 104, sku: 'MOUSE-ERG-WL', name: 'Ergonomic Wireless Mouse', description: 'Rechargeable optical mouse' },
      { id: 105, sku: 'DESK-STAND-EL', name: 'Electric Standing Desk', description: 'Adjustable dual-motor desk' }
    ];
  }

  return { warehouses, locations, products };
};

/**
 * Fetch dynamic available stock for a product at a location
 */
const getStockAvailability = async (productId, locationId) => {
  const available = await InventoryAdapter.getAvailableStock(productId, locationId);
  return {
    product_id: parseInt(productId, 10),
    location_id: parseInt(locationId, 10),
    available_quantity: available !== null ? available : 100 // Defaults to 100 in mock adapter when table absent
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
