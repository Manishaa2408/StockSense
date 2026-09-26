const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');
const logger = require('../../utils/logger');
const { ADJUSTMENT_STATUS, ADJUSTMENT_TYPE } = require('./adjustments.constants');
const InventoryAdapter = require('./inventory.adapter');
const StockMovementAdapter = require('./stockMovement.adapter');

// ─── Reference Generator ────────────────────────────────────────────────────

const generateReference = async (trx = db) => {
  const last = await trx('stock_adjustments')
    .where('reference', 'like', 'ADJ-%')
    .orderBy('id', 'desc')
    .first();

  let nextNum = 1;
  if (last && last.reference) {
    const match = last.reference.match(/^ADJ-(\d+)$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `ADJ-${String(nextNum).padStart(6, '0')}`;
};

// ─── List ────────────────────────────────────────────────────────────────────

const getAll = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const base = db('stock_adjustments as sa')
    .leftJoin('users as creator', 'sa.created_by', 'creator.id')
    .leftJoin('users as approver', 'sa.approved_by', 'approver.id')
    .leftJoin('warehouses as wh', 'sa.warehouse_id', 'wh.id')
    .leftJoin('locations as loc', 'sa.location_id', 'loc.id');

  if (query.status) base.where('sa.status', query.status);
  if (query.warehouse_id) base.where('sa.warehouse_id', query.warehouse_id);
  if (query.location_id) base.where('sa.location_id', query.location_id);
  if (query.reason) base.where('sa.reason', query.reason);
  if (query.reference) base.where('sa.reference', 'like', `%${query.reference}%`);
  if (query.from) base.where('sa.created_at', '>=', `${query.from} 00:00:00`);
  if (query.to) base.where('sa.created_at', '<=', `${query.to} 23:59:59`);

  const countRow = await base.clone().count('sa.id as total').first();
  const total = parseInt(countRow.total, 10) || 0;

  const adjustments = await base.clone()
    .select(
      'sa.id', 'sa.reference', 'sa.warehouse_id', 'sa.location_id',
      'sa.status', 'sa.reason', 'sa.notes',
      'sa.created_by', 'sa.approved_by', 'sa.approved_at', 'sa.completed_at',
      'sa.created_at', 'sa.updated_at',
      'creator.first_name as creator_first_name',
      'creator.last_name as creator_last_name',
      'creator.email as creator_email',
      'approver.first_name as approver_first_name',
      'approver.last_name as approver_last_name',
      'wh.name as warehouse_name',
      'wh.code as warehouse_code',
      'loc.name as location_name',
      'loc.code as location_code'
    )
    .orderBy('sa.id', 'desc')
    .limit(limit)
    .offset(offset);

  // Attach item counts
  if (adjustments.length > 0) {
    const ids = adjustments.map((a) => a.id);
    const counts = await db('stock_adjustment_items')
      .whereIn('adjustment_id', ids)
      .groupBy('adjustment_id')
      .select('adjustment_id')
      .count('id as items_count');
    const countMap = {};
    counts.forEach((c) => { countMap[c.adjustment_id] = parseInt(c.items_count, 10) || 0; });
    adjustments.forEach((a) => { a.items_count = countMap[a.id] || 0; });
  }

  return {
    adjustments,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};

// ─── Detail ──────────────────────────────────────────────────────────────────

const getById = async (id) => {
  const adjustment = await db('stock_adjustments as sa')
    .leftJoin('users as creator', 'sa.created_by', 'creator.id')
    .leftJoin('users as approver', 'sa.approved_by', 'approver.id')
    .leftJoin('warehouses as wh', 'sa.warehouse_id', 'wh.id')
    .leftJoin('locations as loc', 'sa.location_id', 'loc.id')
    .where('sa.id', id)
    .select(
      'sa.id', 'sa.reference', 'sa.warehouse_id', 'sa.location_id',
      'sa.status', 'sa.reason', 'sa.notes',
      'sa.created_by', 'sa.approved_by', 'sa.approved_at', 'sa.completed_at',
      'sa.created_at', 'sa.updated_at',
      'creator.first_name as creator_first_name',
      'creator.last_name as creator_last_name',
      'creator.email as creator_email',
      'approver.first_name as approver_first_name',
      'approver.last_name as approver_last_name',
      'approver.email as approver_email',
      'wh.name as warehouse_name',
      'wh.code as warehouse_code',
      'loc.name as location_name',
      'loc.code as location_code'
    )
    .first();

  if (!adjustment) {
    throw ApiError.notFound(errorCodes.ADJUSTMENT_NOT_FOUND, 'Stock adjustment not found');
  }

  // Load items with product info
  const items = await db('stock_adjustment_items as sai')
    .where('sai.adjustment_id', id)
    .select('sai.id', 'sai.adjustment_id', 'sai.product_id', 'sai.quantity', 'sai.adjustment_type', 'sai.reason', 'sai.created_at');

  const hasProducts = await db.schema.hasTable('products');
  if (hasProducts && items.length > 0) {
    const productIds = items.map((i) => i.product_id);
    const products = await db('products').whereIn('id', productIds).select('id', 'name', 'sku');
    const productMap = {};
    products.forEach((p) => { productMap[p.id] = p; });
    items.forEach((item) => {
      const prod = productMap[item.product_id];
      item.product_name = prod ? prod.name : `Product #${item.product_id}`;
      item.product_sku = prod ? prod.sku : null;
    });
  } else {
    items.forEach((item) => { item.product_name = `Product #${item.product_id}`; item.product_sku = null; });
  }

  adjustment.items = items;
  return adjustment;
};

// ─── Create (DRAFT) ───────────────────────────────────────────────────────────

const create = async (data, user) => {
  const { warehouse_id, location_id, reason, notes, items } = data;

  // Validate location belongs to warehouse
  const hasLocTable = await db.schema.hasTable('locations');
  if (hasLocTable) {
    const loc = await db('locations').where({ id: location_id }).first();
    if (!loc) throw ApiError.notFound(errorCodes.ADJUSTMENT_LOCATION_MISMATCH, 'Location not found');
    if (Number(loc.warehouse_id) !== Number(warehouse_id)) {
      throw ApiError.badRequest(errorCodes.ADJUSTMENT_LOCATION_MISMATCH, 'Location does not belong to the selected warehouse');
    }
  }

  // Validate no duplicate products
  const productSet = new Set();
  for (const item of items) {
    const pid = item.product_id;
    if (productSet.has(pid)) {
      throw ApiError.badRequest(errorCodes.ADJUSTMENT_DUPLICATE_PRODUCT, `Product ID ${pid} appears more than once. Consolidate into a single item.`);
    }
    productSet.add(pid);
  }

  return await db.transaction(async (trx) => {
    const reference = await generateReference(trx);

    const [adjId] = await trx('stock_adjustments').insert({
      reference,
      warehouse_id,
      location_id,
      status: ADJUSTMENT_STATUS.DRAFT,
      reason,
      notes: notes || null,
      created_by: user.id,
      created_at: trx.fn.now(),
      updated_at: trx.fn.now()
    });

    const itemsToInsert = items.map((item) => ({
      adjustment_id: adjId,
      product_id: item.product_id,
      quantity: item.quantity,
      adjustment_type: item.adjustment_type,
      reason: item.reason || null,
      created_at: trx.fn.now()
    }));

    await trx('stock_adjustment_items').insert(itemsToInsert);

    logger.info(`[AdjustmentService] Created DRAFT adjustment ${reference} (ID: ${adjId}) by User ${user.id}`);

    const created = await trx('stock_adjustments').where({ id: adjId }).first();
    created.items = await trx('stock_adjustment_items').where({ adjustment_id: adjId });
    return created;
  });
};

// ─── Update (DRAFT only) ──────────────────────────────────────────────────────

const update = async (id, data, user) => {
  return await db.transaction(async (trx) => {
    const adj = await trx('stock_adjustments').where({ id }).forUpdate().first();
    if (!adj) throw ApiError.notFound(errorCodes.ADJUSTMENT_NOT_FOUND, 'Stock adjustment not found');
    if (adj.status !== ADJUSTMENT_STATUS.DRAFT) {
      throw ApiError.badRequest(errorCodes.ADJUSTMENT_INVALID_STATUS, `Cannot edit adjustment in ${adj.status} status. Only DRAFT adjustments can be modified.`);
    }

    const { warehouse_id, location_id, reason, notes, items } = data;

    const newWarehouse = warehouse_id || adj.warehouse_id;
    const newLocation = location_id || adj.location_id;

    // Validate location still belongs to warehouse
    const hasLocTable = await trx.schema.hasTable('locations');
    if (hasLocTable) {
      const loc = await trx('locations').where({ id: newLocation }).first();
      if (loc && Number(loc.warehouse_id) !== Number(newWarehouse)) {
        throw ApiError.badRequest(errorCodes.ADJUSTMENT_LOCATION_MISMATCH, 'Location does not belong to the selected warehouse');
      }
    }

    const updateFields = { updated_at: trx.fn.now() };
    if (warehouse_id) updateFields.warehouse_id = warehouse_id;
    if (location_id) updateFields.location_id = location_id;
    if (reason) updateFields.reason = reason;
    if (notes !== undefined) updateFields.notes = notes;

    await trx('stock_adjustments').where({ id }).update(updateFields);

    if (items && Array.isArray(items) && items.length > 0) {
      const productSet = new Set();
      for (const item of items) {
        if (productSet.has(item.product_id)) {
          throw ApiError.badRequest(errorCodes.ADJUSTMENT_DUPLICATE_PRODUCT, `Product ID ${item.product_id} appears more than once.`);
        }
        productSet.add(item.product_id);
      }
      await trx('stock_adjustment_items').where({ adjustment_id: id }).del();
      await trx('stock_adjustment_items').insert(
        items.map((item) => ({
          adjustment_id: id,
          product_id: item.product_id,
          quantity: item.quantity,
          adjustment_type: item.adjustment_type,
          reason: item.reason || null,
          created_at: trx.fn.now()
        }))
      );
    }

    logger.info(`[AdjustmentService] Updated DRAFT adjustment ${adj.reference} (ID: ${id}) by User ${user.id}`);

    const updated = await trx('stock_adjustments').where({ id }).first();
    updated.items = await trx('stock_adjustment_items').where({ adjustment_id: id });
    return updated;
  });
};

// ─── Approve (DRAFT → APPROVED) ───────────────────────────────────────────────

const approve = async (id, user) => {
  return await db.transaction(async (trx) => {
    const adj = await trx('stock_adjustments').where({ id }).forUpdate().first();
    if (!adj) throw ApiError.notFound(errorCodes.ADJUSTMENT_NOT_FOUND, 'Stock adjustment not found');
    if (adj.status !== ADJUSTMENT_STATUS.DRAFT) {
      throw ApiError.badRequest(errorCodes.ADJUSTMENT_INVALID_STATUS, `Cannot approve adjustment in ${adj.status} status. Only DRAFT adjustments can be approved.`);
    }

    const items = await trx('stock_adjustment_items').where({ adjustment_id: id });
    if (!items || items.length === 0) {
      throw ApiError.badRequest(errorCodes.ADJUSTMENT_ITEM_REQUIRED, 'Cannot approve an adjustment with no items.');
    }

    await trx('stock_adjustments').where({ id }).update({
      status: ADJUSTMENT_STATUS.APPROVED,
      approved_by: user.id,
      approved_at: trx.fn.now(),
      updated_at: trx.fn.now()
    });

    logger.info(`[AdjustmentService] Adjustment ${adj.reference} (ID: ${id}) APPROVED by User ${user.id}`);

    const result = await trx('stock_adjustments').where({ id }).first();
    result.items = items;
    return result;
  });
};

// ─── Complete (APPROVED → COMPLETED) ─────────────────────────────────────────
// CRITICAL: atomically locks stock rows, validates, applies changes, records movements

const complete = async (id, user) => {
  return await db.transaction(async (trx) => {
    const adj = await trx('stock_adjustments').where({ id }).forUpdate().first();
    if (!adj) throw ApiError.notFound(errorCodes.ADJUSTMENT_NOT_FOUND, 'Stock adjustment not found');

    if (adj.status === ADJUSTMENT_STATUS.COMPLETED) {
      throw ApiError.badRequest(errorCodes.ADJUSTMENT_ALREADY_COMPLETED, 'Adjustment is already completed. Completed adjustments are immutable.');
    }
    if (adj.status === ADJUSTMENT_STATUS.CANCELED) {
      throw ApiError.badRequest(errorCodes.ADJUSTMENT_INVALID_STATUS, 'Cannot complete a canceled adjustment.');
    }
    if (adj.status !== ADJUSTMENT_STATUS.APPROVED) {
      throw ApiError.badRequest(errorCodes.ADJUSTMENT_INVALID_STATUS, `Cannot complete adjustment in ${adj.status} status. Adjustment must be APPROVED first.`);
    }

    const items = await trx('stock_adjustment_items').where({ adjustment_id: id });
    if (!items || items.length === 0) {
      throw ApiError.badRequest(errorCodes.ADJUSTMENT_ITEM_REQUIRED, 'Cannot complete an adjustment with no items.');
    }

    // Process each item atomically
    for (const item of items) {
      let stockBefore, stockAfter;

      if (item.adjustment_type === ADJUSTMENT_TYPE.DECREASE) {
        ({ stockBefore, stockAfter } = await InventoryAdapter.decreaseStock({
          productId: item.product_id,
          locationId: adj.location_id,
          quantity: item.quantity,
          trx
        }));
      } else {
        ({ stockBefore, stockAfter } = await InventoryAdapter.increaseStock({
          productId: item.product_id,
          locationId: adj.location_id,
          quantity: item.quantity,
          trx
        }));
      }

      // Record stock movement
      await StockMovementAdapter.recordAdjustmentMovement({
        productId: item.product_id,
        locationId: adj.location_id,
        adjustmentType: item.adjustment_type,
        quantity: item.quantity,
        stockBefore,
        stockAfter,
        adjustmentId: adj.id,
        adjustmentReference: adj.reference,
        reason: item.reason || adj.reason,
        performedBy: user.id,
        trx
      });
    }

    await trx('stock_adjustments').where({ id }).update({
      status: ADJUSTMENT_STATUS.COMPLETED,
      completed_at: trx.fn.now(),
      updated_at: trx.fn.now()
    });

    logger.info(`[AdjustmentService] Adjustment ${adj.reference} (ID: ${id}) COMPLETED by User ${user.id}`);

    const completed = await trx('stock_adjustments').where({ id }).first();
    completed.items = await trx('stock_adjustment_items').where({ adjustment_id: id });
    return completed;
  });
};

// ─── Cancel ────────────────────────────────────────────────────────────────────

const cancel = async (id, user, reason) => {
  return await db.transaction(async (trx) => {
    const adj = await trx('stock_adjustments').where({ id }).forUpdate().first();
    if (!adj) throw ApiError.notFound(errorCodes.ADJUSTMENT_NOT_FOUND, 'Stock adjustment not found');

    if (adj.status === ADJUSTMENT_STATUS.COMPLETED) {
      throw ApiError.badRequest(errorCodes.ADJUSTMENT_CANNOT_CANCEL, 'COMPLETED adjustments cannot be canceled. Create a correcting adjustment instead.');
    }
    if (adj.status === ADJUSTMENT_STATUS.CANCELED) {
      throw ApiError.badRequest(errorCodes.ADJUSTMENT_INVALID_STATUS, 'Adjustment is already canceled.');
    }

    const cancelNote = reason ? `\n[Cancellation Reason: ${reason}]` : '';
    await trx('stock_adjustments').where({ id }).update({
      status: ADJUSTMENT_STATUS.CANCELED,
      notes: adj.notes ? `${adj.notes}${cancelNote}` : (reason || 'Canceled'),
      updated_at: trx.fn.now()
    });

    logger.info(`[AdjustmentService] Adjustment ${adj.reference} (ID: ${id}) CANCELED by User ${user.id}`);

    const canceled = await trx('stock_adjustments').where({ id }).first();
    canceled.items = await trx('stock_adjustment_items').where({ adjustment_id: id });
    return canceled;
  });
};

// ─── Master Data ──────────────────────────────────────────────────────────────

const getMasterData = async () => {
  let warehouses = [], locations = [], products = [];

  const hasWarehouses = await db.schema.hasTable('warehouses');
  const hasLocations = await db.schema.hasTable('locations');
  const hasProducts = await db.schema.hasTable('products');

  if (hasWarehouses) {
    warehouses = await db('warehouses').select('id', 'name', 'code', 'status').where({ status: 'ACTIVE' });
  }
  if (hasLocations) {
    locations = await db('locations').select('id', 'warehouse_id', 'name', 'code', 'type');
  }
  if (hasProducts) {
    products = await db('products').select('id', 'sku', 'name', 'status').where({ status: 'ACTIVE' });
  }

  return { warehouses, locations, products };
};

module.exports = { getAll, getById, create, update, approve, complete, cancel, getMasterData };
