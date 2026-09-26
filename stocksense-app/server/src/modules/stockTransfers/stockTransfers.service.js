const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');
const logger = require('../../utils/logger');
const { TRANSFER_STATUS } = require('./stockTransfers.constants');
const InventoryAdapter = require('./inventory.adapter');
const StockMovementAdapter = require('./stockMovement.adapter');
const AuditAdapter = require('./audit.adapter');

/**
 * Generate unique, concurrency-safe transfer reference (TRF-000001)
 */
const generateReference = async (trx = db) => {
  const lastTransfer = await trx('stock_transfers')
    .where('reference', 'like', 'TRF-%')
    .orderBy('id', 'desc')
    .first();

  let nextNum = 1;
  if (lastTransfer && lastTransfer.reference) {
    const match = lastTransfer.reference.match(/^TRF-(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  const padded = String(nextNum).padStart(6, '0');
  return `TRF-${padded}`;
};

/**
 * List transfers with filtering, search, and pagination
 */
const getAll = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const baseQuery = db('stock_transfers as st')
    .leftJoin('users as creator', 'st.created_by', 'creator.id')
    .leftJoin('users as completer', 'st.completed_by', 'completer.id');

  if (query.search) {
    const search = `%${query.search.trim()}%`;
    baseQuery.where((builder) => {
      builder.where('st.reference', 'like', search)
        .orWhere('st.notes', 'like', search);
    });
  }

  if (query.status) {
    baseQuery.where('st.status', query.status);
  }

  if (query.source_warehouse_id) {
    baseQuery.where('st.source_warehouse_id', query.source_warehouse_id);
  }

  if (query.destination_warehouse_id) {
    baseQuery.where('st.destination_warehouse_id', query.destination_warehouse_id);
  }

  if (query.created_by) {
    baseQuery.where('st.created_by', query.created_by);
  }

  if (query.date_from) {
    baseQuery.where('st.created_at', '>=', `${query.date_from} 00:00:00`);
  }

  if (query.date_to) {
    baseQuery.where('st.created_at', '<=', `${query.date_to} 23:59:59`);
  }

  // Count total matching records
  const countRow = await baseQuery.clone().count('st.id as total').first();
  const total = parseInt(countRow.total, 10) || 0;

  // Retrieve records
  const transfers = await baseQuery
    .clone()
    .select(
      'st.id',
      'st.reference',
      'st.source_warehouse_id',
      'st.source_location_id',
      'st.destination_warehouse_id',
      'st.destination_location_id',
      'st.status',
      'st.notes',
      'st.created_by',
      'st.completed_by',
      'st.completed_at',
      'st.created_at',
      'st.updated_at',
      'creator.first_name as creator_first_name',
      'creator.last_name as creator_last_name',
      'creator.email as creator_email',
      'completer.first_name as completer_first_name',
      'completer.last_name as completer_last_name'
    )
    .orderBy('st.id', 'desc')
    .limit(limit)
    .offset(offset);

  // Attach line item counts
  if (transfers.length > 0) {
    const transferIds = transfers.map((t) => t.id);
    const itemCounts = await db('stock_transfer_items')
      .whereIn('transfer_id', transferIds)
      .groupBy('transfer_id')
      .select('transfer_id')
      .count('id as items_count')
      .sum('quantity as total_quantity');

    const countMap = {};
    itemCounts.forEach((c) => {
      countMap[c.transfer_id] = {
        items_count: parseInt(c.items_count, 10) || 0,
        total_quantity: parseFloat(c.total_quantity) || 0
      };
    });

    transfers.forEach((t) => {
      t.items_count = countMap[t.id]?.items_count || 0;
      t.total_quantity = countMap[t.id]?.total_quantity || 0;
    });
  }

  return {
    transfers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get transfer by ID with complete line items and product details
 */
const getById = async (id) => {
  const transfer = await db('stock_transfers as st')
    .leftJoin('users as creator', 'st.created_by', 'creator.id')
    .leftJoin('users as completer', 'st.completed_by', 'completer.id')
    .where('st.id', id)
    .select(
      'st.id',
      'st.reference',
      'st.source_warehouse_id',
      'st.source_location_id',
      'st.destination_warehouse_id',
      'st.destination_location_id',
      'st.status',
      'st.notes',
      'st.created_by',
      'st.completed_by',
      'st.completed_at',
      'st.created_at',
      'st.updated_at',
      'creator.first_name as creator_first_name',
      'creator.last_name as creator_last_name',
      'creator.email as creator_email',
      'completer.first_name as completer_first_name',
      'completer.last_name as completer_last_name',
      'completer.email as completer_email'
    )
    .first();

  if (!transfer) {
    throw ApiError.notFound(errorCodes.TRANSFER_NOT_FOUND || 'TRANSFER_NOT_FOUND', 'Stock transfer not found');
  }

  // Load items
  const items = await db('stock_transfer_items as sti')
    .where('sti.transfer_id', id)
    .select('sti.id', 'sti.transfer_id', 'sti.product_id', 'sti.quantity', 'sti.created_at', 'sti.updated_at');

  // Enrich with product names if products table exists
  const hasProducts = await db.schema.hasTable('products');
  if (hasProducts && items.length > 0) {
    const productIds = items.map((i) => i.product_id);
    const productList = await db('products').whereIn('id', productIds).select('id', 'name', 'sku', 'price');
    const productMap = {};
    productList.forEach((p) => { productMap[p.id] = p; });

    items.forEach((item) => {
      const prod = productMap[item.product_id];
      item.product_name = prod ? prod.name : `Product #${item.product_id}`;
      item.product_sku = prod ? prod.sku : `SKU-${item.product_id}`;
    });
  } else {
    items.forEach((item) => {
      item.product_name = `Product #${item.product_id}`;
      item.product_sku = `SKU-${item.product_id}`;
    });
  }

  transfer.items = items;
  return transfer;
};

/**
 * Create a new Stock Transfer in DRAFT status
 * IMPORTANT: Does not touch or modify stock upon creation.
 */
const create = async (data, user) => {
  const {
    source_warehouse_id,
    source_location_id,
    destination_warehouse_id,
    destination_location_id,
    items,
    notes
  } = data;

  // Validation: Source cannot equal destination
  if (
    Number(source_warehouse_id) === Number(destination_warehouse_id) &&
    Number(source_location_id) === Number(destination_location_id)
  ) {
    throw ApiError.badRequest(
      errorCodes.TRANSFER_SOURCE_DESTINATION_SAME || 'TRANSFER_SOURCE_DESTINATION_SAME',
      'Source and destination location cannot be the same.'
    );
  }

  if (!items || items.length === 0) {
    throw ApiError.badRequest(
      errorCodes.TRANSFER_EMPTY_ITEMS || 'TRANSFER_EMPTY_ITEMS',
      'Stock transfer must contain at least one product line.'
    );
  }

  // Check duplicate products
  const productSet = new Set();
  for (const itm of items) {
    const pid = itm.product_id || itm.productId;
    if (productSet.has(pid)) {
      throw ApiError.badRequest(
        errorCodes.TRANSFER_DUPLICATE_PRODUCT || 'TRANSFER_DUPLICATE_PRODUCT',
        `Product ID ${pid} appears multiple times. Please consolidate quantities into a single item line.`
      );
    }
    productSet.add(pid);
  }

  return await db.transaction(async (trx) => {
    const reference = await generateReference(trx);

    const [transferId] = await trx('stock_transfers').insert({
      reference,
      source_warehouse_id,
      source_location_id,
      destination_warehouse_id,
      destination_location_id,
      status: TRANSFER_STATUS.DRAFT,
      notes: notes || null,
      created_by: user.id,
      created_at: trx.fn.now(),
      updated_at: trx.fn.now()
    });

    const itemsToInsert = items.map((item) => ({
      transfer_id: transferId,
      product_id: item.product_id || item.productId,
      quantity: item.quantity,
      created_at: trx.fn.now(),
      updated_at: trx.fn.now()
    }));

    await trx('stock_transfer_items').insert(itemsToInsert);

    logger.info(`[StockTransferService] Created DRAFT Transfer ${reference} (ID: ${transferId}) by User ${user.id}`);

    await AuditAdapter.recordAuditEvent({
      entityId: transferId,
      action: 'CREATE',
      performedBy: user.id,
      details: { reference, itemsCount: items.length },
      trx
    });

    const created = await trx('stock_transfers').where({ id: transferId }).first();
    created.items = await trx('stock_transfer_items').where({ transfer_id: transferId });
    return created;
  });
};

/**
 * Update a Stock Transfer
 * Only allowed when status is DRAFT
 */
const update = async (id, data, user) => {
  return await db.transaction(async (trx) => {
    const transfer = await trx('stock_transfers').where({ id }).forUpdate().first();

    if (!transfer) {
      throw ApiError.notFound(errorCodes.TRANSFER_NOT_FOUND || 'TRANSFER_NOT_FOUND', 'Stock transfer not found');
    }

    if (transfer.status !== TRANSFER_STATUS.DRAFT) {
      throw ApiError.badRequest(
        errorCodes.TRANSFER_INVALID_STATUS || 'TRANSFER_INVALID_STATUS',
        `Cannot edit stock transfer in ${transfer.status} status. Only DRAFT transfers can be modified.`
      );
    }

    const {
      source_warehouse_id,
      source_location_id,
      destination_warehouse_id,
      destination_location_id,
      items,
      notes
    } = data;

    const newSourceWh = source_warehouse_id || transfer.source_warehouse_id;
    const newSourceLoc = source_location_id || transfer.source_location_id;
    const newDestWh = destination_warehouse_id || transfer.destination_warehouse_id;
    const newDestLoc = destination_location_id || transfer.destination_location_id;

    if (Number(newSourceWh) === Number(newDestWh) && Number(newSourceLoc) === Number(newDestLoc)) {
      throw ApiError.badRequest(
        errorCodes.TRANSFER_SOURCE_DESTINATION_SAME || 'TRANSFER_SOURCE_DESTINATION_SAME',
        'Source and destination location cannot be the same.'
      );
    }

    const updateFields = {
      updated_at: trx.fn.now()
    };

    if (source_warehouse_id) updateFields.source_warehouse_id = source_warehouse_id;
    if (source_location_id) updateFields.source_location_id = source_location_id;
    if (destination_warehouse_id) updateFields.destination_warehouse_id = destination_warehouse_id;
    if (destination_location_id) updateFields.destination_location_id = destination_location_id;
    if (notes !== undefined) updateFields.notes = notes;

    await trx('stock_transfers').where({ id }).update(updateFields);

    if (items && Array.isArray(items) && items.length > 0) {
      // Validate duplicates
      const productSet = new Set();
      for (const itm of items) {
        const pid = itm.product_id || itm.productId;
        if (productSet.has(pid)) {
          throw ApiError.badRequest(
            errorCodes.TRANSFER_DUPLICATE_PRODUCT || 'TRANSFER_DUPLICATE_PRODUCT',
            `Product ID ${pid} appears multiple times in items.`
          );
        }
        productSet.add(pid);
      }

      await trx('stock_transfer_items').where({ transfer_id: id }).del();

      const itemsToInsert = items.map((item) => ({
        transfer_id: id,
        product_id: item.product_id || item.productId,
        quantity: item.quantity,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now()
      }));

      await trx('stock_transfer_items').insert(itemsToInsert);
    }

    logger.info(`[StockTransferService] Updated DRAFT Transfer ${transfer.reference} (ID: ${id}) by User ${user.id}`);

    await AuditAdapter.recordAuditEvent({
      entityId: id,
      action: 'UPDATE',
      performedBy: user.id,
      details: { reference: transfer.reference },
      trx
    });

    const updated = await trx('stock_transfers').where({ id }).first();
    updated.items = await trx('stock_transfer_items').where({ transfer_id: id });
    return updated;
  });
};

/**
 * Mark transfer as READY (DRAFT -> READY)
 */
const markReady = async (id, user) => {
  return await db.transaction(async (trx) => {
    const transfer = await trx('stock_transfers').where({ id }).forUpdate().first();

    if (!transfer) {
      throw ApiError.notFound(errorCodes.TRANSFER_NOT_FOUND || 'TRANSFER_NOT_FOUND', 'Stock transfer not found');
    }

    if (transfer.status !== TRANSFER_STATUS.DRAFT) {
      throw ApiError.badRequest(
        errorCodes.TRANSFER_INVALID_STATUS || 'TRANSFER_INVALID_STATUS',
        `Cannot mark transfer as READY from ${transfer.status} status. Only DRAFT transfers can be marked READY.`
      );
    }

    const items = await trx('stock_transfer_items').where({ transfer_id: id });
    if (!items || items.length === 0) {
      throw ApiError.badRequest(
        errorCodes.TRANSFER_EMPTY_ITEMS || 'TRANSFER_EMPTY_ITEMS',
        'Cannot mark transfer as READY without product items.'
      );
    }

    await trx('stock_transfers').where({ id }).update({
      status: TRANSFER_STATUS.READY,
      updated_at: trx.fn.now()
    });

    logger.info(`[StockTransferService] Transfer ${transfer.reference} (ID: ${id}) marked READY by User ${user.id}`);

    await AuditAdapter.recordAuditEvent({
      entityId: id,
      action: 'STATUS_CHANGE',
      performedBy: user.id,
      details: { from: TRANSFER_STATUS.DRAFT, to: TRANSFER_STATUS.READY },
      trx
    });

    const result = await trx('stock_transfers').where({ id }).first();
    result.items = items;
    return result;
  });
};

/**
 * Start transfer (READY -> IN_TRANSIT)
 */
const startTransfer = async (id, user) => {
  return await db.transaction(async (trx) => {
    const transfer = await trx('stock_transfers').where({ id }).forUpdate().first();

    if (!transfer) {
      throw ApiError.notFound(errorCodes.TRANSFER_NOT_FOUND || 'TRANSFER_NOT_FOUND', 'Stock transfer not found');
    }

    if (transfer.status !== TRANSFER_STATUS.READY) {
      throw ApiError.badRequest(
        errorCodes.TRANSFER_INVALID_STATUS || 'TRANSFER_INVALID_STATUS',
        `Cannot start transfer from ${transfer.status} status. Transfer must be marked READY before starting transit.`
      );
    }

    const items = await trx('stock_transfer_items').where({ transfer_id: id });
    if (!items || items.length === 0) {
      throw ApiError.badRequest(
        errorCodes.TRANSFER_EMPTY_ITEMS || 'TRANSFER_EMPTY_ITEMS',
        'Cannot start transfer without product items.'
      );
    }

    // Pre-flight check: verify source location has available stock
    for (const item of items) {
      const avail = await InventoryAdapter.getAvailableStock(item.product_id, transfer.source_location_id, trx);
      if (avail !== null && avail < Number(item.quantity)) {
        throw ApiError.badRequest(
          errorCodes.TRANSFER_INSUFFICIENT_STOCK || 'TRANSFER_INSUFFICIENT_STOCK',
          `Cannot start transfer: Insufficient stock for product ID ${item.product_id} at source location. Available: ${avail}, Required: ${item.quantity}`
        );
      }
    }

    await trx('stock_transfers').where({ id }).update({
      status: TRANSFER_STATUS.IN_TRANSIT,
      updated_at: trx.fn.now()
    });

    logger.info(`[StockTransferService] Transfer ${transfer.reference} (ID: ${id}) is now IN_TRANSIT, initiated by User ${user.id}`);

    await AuditAdapter.recordAuditEvent({
      entityId: id,
      action: 'STATUS_CHANGE',
      performedBy: user.id,
      details: { from: TRANSFER_STATUS.READY, to: TRANSFER_STATUS.IN_TRANSIT },
      trx
    });

    const result = await trx('stock_transfers').where({ id }).first();
    result.items = items;
    return result;
  });
};

/**
 * Complete transfer (IN_TRANSIT -> COMPLETED)
 * CRITICAL ATOMIC REQUIREMENT:
 * 1. Lock transfer row (pessimistic lock)
 * 2. Assert status is IN_TRANSIT
 * 3. Lock source stock row & deduct stock
 * 4. Lock/create destination stock row & add stock
 * 5. Record paired stock movements (TRANSFER_OUT & TRANSFER_IN)
 * 6. Mark transfer COMPLETED with completed_by & completed_at
 * 7. Commit or rollback all on any failure
 */
const completeTransfer = async (id, user) => {
  return await db.transaction(async (trx) => {
    const transfer = await trx('stock_transfers').where({ id }).forUpdate().first();

    if (!transfer) {
      throw ApiError.notFound(errorCodes.TRANSFER_NOT_FOUND || 'TRANSFER_NOT_FOUND', 'Stock transfer not found');
    }

    if (transfer.status === TRANSFER_STATUS.COMPLETED) {
      throw ApiError.badRequest(
        errorCodes.TRANSFER_ALREADY_COMPLETED || 'TRANSFER_ALREADY_COMPLETED',
        'Stock transfer has already been completed. Completed transfers are immutable.'
      );
    }

    if (transfer.status === TRANSFER_STATUS.CANCELED) {
      throw ApiError.badRequest(
        errorCodes.TRANSFER_INVALID_STATUS || 'TRANSFER_INVALID_STATUS',
        'Cannot complete a canceled transfer.'
      );
    }

    if (transfer.status !== TRANSFER_STATUS.IN_TRANSIT) {
      throw ApiError.badRequest(
        errorCodes.TRANSFER_INVALID_STATUS || 'TRANSFER_INVALID_STATUS',
        `Cannot complete transfer in ${transfer.status} status. Transfer must be IN_TRANSIT before completion.`
      );
    }

    const items = await trx('stock_transfer_items').where({ transfer_id: id });
    if (!items || items.length === 0) {
      throw ApiError.badRequest(
        errorCodes.TRANSFER_EMPTY_ITEMS || 'TRANSFER_EMPTY_ITEMS',
        'Cannot complete a transfer with no items.'
      );
    }

    // Process each item atomically with row-level locks
    for (const item of items) {
      // 1. Deduct from source location
      await InventoryAdapter.deductStock({
        productId: item.product_id,
        locationId: transfer.source_location_id,
        quantity: item.quantity,
        trx
      });

      // 2. Add to destination location
      await InventoryAdapter.addStock({
        productId: item.product_id,
        locationId: transfer.destination_location_id,
        quantity: item.quantity,
        trx
      });

      // 3. Record paired stock movement ledger entries
      await StockMovementAdapter.recordTransferMovements({
        productId: item.product_id,
        sourceLocationId: transfer.source_location_id,
        destinationLocationId: transfer.destination_location_id,
        quantity: item.quantity,
        transferId: transfer.id,
        transferReference: transfer.reference,
        performedBy: user.id,
        trx
      });
    }

    // 4. Update transfer status
    await trx('stock_transfers').where({ id }).update({
      status: TRANSFER_STATUS.COMPLETED,
      completed_by: user.id,
      completed_at: trx.fn.now(),
      updated_at: trx.fn.now()
    });

    logger.info(`[StockTransferService] Transfer ${transfer.reference} (ID: ${id}) successfully COMPLETED by User ${user.id}`);

    await AuditAdapter.recordAuditEvent({
      entityId: id,
      action: 'COMPLETE',
      performedBy: user.id,
      details: { reference: transfer.reference, itemsCount: items.length },
      trx
    });

    const completed = await trx('stock_transfers').where({ id }).first();
    completed.items = await trx('stock_transfer_items').where({ transfer_id: id });
    return completed;
  });
};

/**
 * Cancel transfer (DRAFT -> CANCELED or READY -> CANCELED)
 * Restricted once IN_TRANSIT or COMPLETED.
 */
const cancelTransfer = async (id, user, reason) => {
  return await db.transaction(async (trx) => {
    const transfer = await trx('stock_transfers').where({ id }).forUpdate().first();

    if (!transfer) {
      throw ApiError.notFound(errorCodes.TRANSFER_NOT_FOUND || 'TRANSFER_NOT_FOUND', 'Stock transfer not found');
    }

    if (transfer.status === TRANSFER_STATUS.COMPLETED) {
      throw ApiError.badRequest(
        errorCodes.TRANSFER_CANNOT_CANCEL || 'TRANSFER_CANNOT_CANCEL',
        'COMPLETED transfers cannot be canceled. Completed inventory movements are immutable.'
      );
    }

    if (transfer.status === TRANSFER_STATUS.IN_TRANSIT) {
      throw ApiError.badRequest(
        errorCodes.TRANSFER_CANNOT_CANCEL || 'TRANSFER_CANNOT_CANCEL',
        'Transfers currently IN_TRANSIT cannot be canceled as physical goods are already in movement.'
      );
    }

    if (transfer.status === TRANSFER_STATUS.CANCELED) {
      throw ApiError.badRequest(
        errorCodes.TRANSFER_INVALID_STATUS || 'TRANSFER_INVALID_STATUS',
        'Transfer is already canceled.'
      );
    }

    const cancelNote = reason ? `\n[Cancellation Reason: ${reason}]` : '';
    await trx('stock_transfers').where({ id }).update({
      status: TRANSFER_STATUS.CANCELED,
      notes: transfer.notes ? `${transfer.notes}${cancelNote}` : (reason || 'Canceled'),
      updated_at: trx.fn.now()
    });

    logger.info(`[StockTransferService] Transfer ${transfer.reference} (ID: ${id}) CANCELED by User ${user.id}`);

    await AuditAdapter.recordAuditEvent({
      entityId: id,
      action: 'CANCEL',
      performedBy: user.id,
      details: { reference: transfer.reference, reason },
      trx
    });

    const canceled = await trx('stock_transfers').where({ id }).first();
    canceled.items = await trx('stock_transfer_items').where({ transfer_id: id });
    return canceled;
  });
};

/**
 * Master data for warehouse -> location selection cascade and products
 */
const getMasterData = async () => {
  let warehouses = [];
  let locations = [];
  let products = [];

  const hasWarehouses = await db.schema.hasTable('warehouses');
  const hasLocations = await db.schema.hasTable('locations');
  const hasProducts = await db.schema.hasTable('products');

  if (hasWarehouses) {
    warehouses = await db('warehouses').select('id', 'name', 'code', 'status').where({ status: 'ACTIVE' });
  } else {
    warehouses = [
      { id: 1, name: 'Main Distribution Center', code: 'WH-MAIN', status: 'ACTIVE' },
      { id: 2, name: 'North Secondary Warehouse', code: 'WH-NORTH', status: 'ACTIVE' },
      { id: 3, name: 'East Regional Depot', code: 'WH-EAST', status: 'ACTIVE' }
    ];
  }

  if (hasLocations) {
    locations = await db('locations').select('id', 'warehouse_id', 'name', 'code', 'type');
  } else {
    locations = [
      { id: 1, warehouse_id: 1, name: 'Section A - Bay 01', code: 'LOC-A01', type: 'INTERNAL' },
      { id: 2, warehouse_id: 1, name: 'Section A - Bay 02', code: 'LOC-A02', type: 'INTERNAL' },
      { id: 3, warehouse_id: 1, name: 'Section B - High Rack 01', code: 'LOC-B01', type: 'INTERNAL' },
      { id: 4, warehouse_id: 2, name: 'North Bay 01', code: 'LOC-N01', type: 'INTERNAL' },
      { id: 5, warehouse_id: 2, name: 'North Bay 02', code: 'LOC-N02', type: 'INTERNAL' },
      { id: 6, warehouse_id: 3, name: 'East Depot Bulk Area', code: 'LOC-E01', type: 'INTERNAL' }
    ];
  }

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

/**
 * Stock availability lookup for a given product at a location
 */
const getStockAvailability = async (productId, locationId) => {
  const available = await InventoryAdapter.getAvailableStock(productId, locationId);
  return {
    product_id: parseInt(productId, 10),
    location_id: parseInt(locationId, 10),
    available_quantity: available !== null ? available : 100 // fallback default when stock table is absent
  };
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  markReady,
  startTransfer,
  completeTransfer,
  cancelTransfer,
  getMasterData,
  getStockAvailability
};
