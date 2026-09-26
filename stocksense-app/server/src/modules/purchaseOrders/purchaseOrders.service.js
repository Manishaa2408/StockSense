const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');
const { PO_STATUS } = require('./purchaseOrders.constants');

// ─── Reference Generator ────────────────────────────────────────────────────

const generatePONumber = async (trx = db) => {
  const lastPO = await trx('purchase_orders')
    .where('po_number', 'like', 'PO-%')
    .orderBy('id', 'desc')
    .first();

  let nextNum = 1;
  if (lastPO && lastPO.po_number) {
    const match = lastPO.po_number.match(/^PO-(\d+)$/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  return `PO-${String(nextNum).padStart(6, '0')}`;
};

// ─── Calculation Helper ─────────────────────────────────────────────────────

const calculateItemTotals = (item) => {
  const qty = Number(item.ordered_quantity);
  const price = Number(item.unit_price);
  const taxRate = Number(item.tax_rate || 0);
  const discount = Number(item.discount || 0);

  const base = qty * price;
  const tax = (base * taxRate) / 100;
  const lineTotal = Math.max(0, base + tax - discount);

  return {
    ordered_quantity: qty,
    unit_price: price,
    tax_rate: taxRate,
    discount,
    tax,
    line_total: lineTotal
  };
};

// ─── List ────────────────────────────────────────────────────────────────────

const getAll = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const offset = (page - 1) * limit;

  const base = db('purchase_orders as po')
    .leftJoin('suppliers as sup', 'po.supplier_id', 'sup.id')
    .leftJoin('users as creator', 'po.created_by', 'creator.id');

  if (query.status) base.where('po.status', query.status);
  if (query.supplier_id) base.where('po.supplier_id', query.supplier_id);
  if (query.po_number) base.where('po.po_number', 'like', `%${query.po_number.trim()}%`);
  if (query.search) {
    const s = `%${query.search.trim()}%`;
    base.where(function () {
      this.where('po.po_number', 'like', s)
        .orWhere('sup.name', 'like', s)
        .orWhere('po.notes', 'like', s);
    });
  }
  if (query.from) base.where('po.order_date', '>=', query.from);
  if (query.to) base.where('po.order_date', '<=', query.to);

  const countRow = await base.clone().count('po.id as total').first();
  const total = parseInt(countRow.total, 10) || 0;

  const purchaseOrders = await base.clone()
    .select(
      'po.*',
      'sup.name as supplier_name',
      'sup.code as supplier_code',
      'creator.first_name as creator_first_name',
      'creator.last_name as creator_last_name'
    )
    .orderBy('po.id', 'desc')
    .limit(limit)
    .offset(offset);

  // Attach line item counts
  if (purchaseOrders.length > 0) {
    const poIds = purchaseOrders.map((p) => p.id);
    const itemSummaries = await db('purchase_order_items')
      .whereIn('purchase_order_id', poIds)
      .groupBy('purchase_order_id')
      .select('purchase_order_id')
      .count('id as items_count')
      .sum('ordered_quantity as total_ordered')
      .sum('received_quantity as total_received');

    const summaryMap = {};
    itemSummaries.forEach((s) => {
      summaryMap[s.purchase_order_id] = {
        items_count: parseInt(s.items_count, 10) || 0,
        total_ordered: parseFloat(s.total_ordered) || 0,
        total_received: parseFloat(s.total_received) || 0
      };
    });

    purchaseOrders.forEach((po) => {
      po.items_count = summaryMap[po.id]?.items_count || 0;
      po.total_ordered = summaryMap[po.id]?.total_ordered || 0;
      po.total_received = summaryMap[po.id]?.total_received || 0;
    });
  }

  return {
    purchase_orders: purchaseOrders,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};

// ─── Get By ID ───────────────────────────────────────────────────────────────

const getById = async (id) => {
  const po = await db('purchase_orders as po')
    .leftJoin('suppliers as sup', 'po.supplier_id', 'sup.id')
    .leftJoin('users as creator', 'po.created_by', 'creator.id')
    .leftJoin('users as confirmer', 'po.confirmed_by', 'confirmer.id')
    .where('po.id', id)
    .select(
      'po.*',
      'sup.name as supplier_name',
      'sup.code as supplier_code',
      'sup.email as supplier_email',
      'sup.phone as supplier_phone',
      'sup.contact_person as supplier_contact_person',
      'creator.first_name as creator_first_name',
      'creator.last_name as creator_last_name',
      'confirmer.first_name as confirmer_first_name',
      'confirmer.last_name as confirmer_last_name'
    )
    .first();

  if (!po) {
    throw ApiError.notFound('PO_NOT_FOUND', 'Purchase order not found');
  }

  const items = await db('purchase_order_items as poi')
    .leftJoin('products as p', 'poi.product_id', 'p.id')
    .where('poi.purchase_order_id', id)
    .select(
      'poi.*',
      'p.name as product_name',
      'p.sku as product_sku'
    );

  po.items = items.map((itm) => ({
    ...itm,
    remaining_quantity: Math.max(0, Number(itm.ordered_quantity) - Number(itm.received_quantity))
  }));

  return po;
};

// ─── Create ───────────────────────────────────────────────────────────────────

const create = async (data, user) => {
  const { supplier_id, order_date, expected_delivery_date, notes, items } = data;

  const supplier = await db('suppliers').where({ id: supplier_id }).first();
  if (!supplier) throw ApiError.notFound('SUPPLIER_NOT_FOUND', 'Selected supplier does not exist');

  // Validate no duplicate products
  const productSet = new Set();
  for (const itm of items) {
    if (productSet.has(itm.product_id)) {
      throw ApiError.badRequest('PO_DUPLICATE_PRODUCT', `Product ID ${itm.product_id} appears multiple times.`);
    }
    productSet.add(itm.product_id);
  }

  // Calculate totals
  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;

  const processedItems = items.map((item) => {
    const calc = calculateItemTotals(item);
    subtotal += calc.ordered_quantity * calc.unit_price;
    totalTax += calc.tax;
    totalDiscount += calc.discount;
    return {
      product_id: item.product_id,
      ordered_quantity: calc.ordered_quantity,
      received_quantity: 0,
      unit_price: calc.unit_price,
      tax_rate: calc.tax_rate,
      discount: calc.discount,
      line_total: calc.line_total
    };
  });

  const grandTotal = Math.max(0, subtotal + totalTax - totalDiscount);

  return await db.transaction(async (trx) => {
    const poNumber = await generatePONumber(trx);

    const [poId] = await trx('purchase_orders').insert({
      po_number: poNumber,
      supplier_id,
      order_date: order_date || trx.fn.now(),
      expected_delivery_date: expected_delivery_date || null,
      status: PO_STATUS.DRAFT,
      subtotal,
      tax: totalTax,
      discount: totalDiscount,
      grand_total: grandTotal,
      notes: notes || null,
      created_by: user.id,
      created_at: trx.fn.now(),
      updated_at: trx.fn.now()
    });

    const itemsToInsert = processedItems.map((itm) => ({
      ...itm,
      purchase_order_id: poId,
      created_at: trx.fn.now(),
      updated_at: trx.fn.now()
    }));

    await trx('purchase_order_items').insert(itemsToInsert);

    logger.info(`[PurchaseOrderService] Created DRAFT PO ${poNumber} (ID: ${poId}) by User ${user.id}`);

    const created = await trx('purchase_orders').where({ id: poId }).first();
    created.items = await trx('purchase_order_items').where({ purchase_order_id: poId });
    return created;
  });
};

// ─── Update (DRAFT only) ──────────────────────────────────────────────────────

const update = async (id, data, user) => {
  return await db.transaction(async (trx) => {
    const po = await trx('purchase_orders').where({ id }).forUpdate().first();
    if (!po) throw ApiError.notFound('PO_NOT_FOUND', 'Purchase order not found');

    if (po.status !== PO_STATUS.DRAFT) {
      throw ApiError.badRequest('PO_INVALID_STATUS', `Cannot edit PO in ${po.status} status. Only DRAFT orders can be modified.`);
    }

    const { supplier_id, order_date, expected_delivery_date, notes, items } = data;

    if (supplier_id) {
      const supplier = await trx('suppliers').where({ id: supplier_id }).first();
      if (!supplier) throw ApiError.notFound('SUPPLIER_NOT_FOUND', 'Selected supplier does not exist');
    }

    const updateFields = { updated_at: trx.fn.now() };
    if (supplier_id) updateFields.supplier_id = supplier_id;
    if (order_date) updateFields.order_date = order_date;
    if (expected_delivery_date !== undefined) updateFields.expected_delivery_date = expected_delivery_date || null;
    if (notes !== undefined) updateFields.notes = notes;

    if (items && Array.isArray(items) && items.length > 0) {
      const productSet = new Set();
      for (const itm of items) {
        if (productSet.has(itm.product_id)) {
          throw ApiError.badRequest('PO_DUPLICATE_PRODUCT', `Product ID ${itm.product_id} appears multiple times.`);
        }
        productSet.add(itm.product_id);
      }

      let subtotal = 0, totalTax = 0, totalDiscount = 0;
      const processedItems = items.map((item) => {
        const calc = calculateItemTotals(item);
        subtotal += calc.ordered_quantity * calc.unit_price;
        totalTax += calc.tax;
        totalDiscount += calc.discount;
        return {
          purchase_order_id: id,
          product_id: item.product_id,
          ordered_quantity: calc.ordered_quantity,
          received_quantity: 0,
          unit_price: calc.unit_price,
          tax_rate: calc.tax_rate,
          discount: calc.discount,
          line_total: calc.line_total,
          created_at: trx.fn.now(),
          updated_at: trx.fn.now()
        };
      });

      updateFields.subtotal = subtotal;
      updateFields.tax = totalTax;
      updateFields.discount = totalDiscount;
      updateFields.grand_total = Math.max(0, subtotal + totalTax - totalDiscount);

      await trx('purchase_order_items').where({ purchase_order_id: id }).del();
      await trx('purchase_order_items').insert(processedItems);
    }

    await trx('purchase_orders').where({ id }).update(updateFields);

    logger.info(`[PurchaseOrderService] Updated DRAFT PO ${po.po_number} (ID: ${id}) by User ${user.id}`);

    const updated = await trx('purchase_orders').where({ id }).first();
    updated.items = await trx('purchase_order_items').where({ purchase_order_id: id });
    return updated;
  });
};

// ─── Confirm (DRAFT → CONFIRMED) ──────────────────────────────────────────────

const confirm = async (id, user) => {
  return await db.transaction(async (trx) => {
    const po = await trx('purchase_orders').where({ id }).forUpdate().first();
    if (!po) throw ApiError.notFound('PO_NOT_FOUND', 'Purchase order not found');

    if (po.status !== PO_STATUS.DRAFT) {
      throw ApiError.badRequest('PO_INVALID_STATUS', `Cannot confirm PO in ${po.status} status. Only DRAFT orders can be confirmed.`);
    }

    const items = await trx('purchase_order_items').where({ purchase_order_id: id });
    if (!items || items.length === 0) {
      throw ApiError.badRequest('PO_EMPTY_ITEMS', 'Cannot confirm a purchase order without items.');
    }

    await trx('purchase_orders').where({ id }).update({
      status: PO_STATUS.CONFIRMED,
      confirmed_by: user.id,
      confirmed_at: trx.fn.now(),
      updated_at: trx.fn.now()
    });

    logger.info(`[PurchaseOrderService] PO ${po.po_number} (ID: ${id}) CONFIRMED by User ${user.id}`);

    const confirmed = await trx('purchase_orders').where({ id }).first();
    confirmed.items = items;
    return confirmed;
  });
};

// ─── Receive Goods (CONFIRMED / PARTIALLY_RECEIVED → PARTIALLY_RECEIVED / COMPLETED) ──

const receiveGoods = async (id, data, user) => {
  const { warehouse_id, location_id, items, notes } = data;

  return await db.transaction(async (trx) => {
    const po = await trx('purchase_orders').where({ id }).forUpdate().first();
    if (!po) throw ApiError.notFound('PO_NOT_FOUND', 'Purchase order not found');

    if (![PO_STATUS.CONFIRMED, PO_STATUS.PARTIALLY_RECEIVED].includes(po.status)) {
      throw ApiError.badRequest(
        'PO_INVALID_STATUS',
        `Cannot receive goods for PO in ${po.status} status. PO must be CONFIRMED or PARTIALLY_RECEIVED.`
      );
    }

    const poItems = await trx('purchase_order_items').where({ purchase_order_id: id }).forUpdate();
    const poItemMap = {};
    poItems.forEach((i) => { poItemMap[i.product_id] = i; });

    // Validate quantities
    for (const rcvItem of items) {
      const existing = poItemMap[rcvItem.product_id];
      if (!existing) {
        throw ApiError.badRequest('PO_PRODUCT_NOT_IN_ORDER', `Product ID ${rcvItem.product_id} is not part of PO ${po.po_number}.`);
      }
      const newReceivedTotal = Number(existing.received_quantity) + Number(rcvItem.received_quantity);
      if (newReceivedTotal > Number(existing.ordered_quantity)) {
        throw ApiError.badRequest(
          'PO_OVER_RECEIVING',
          `Cannot receive ${rcvItem.received_quantity} for Product #${rcvItem.product_id}. Ordered: ${existing.ordered_quantity}, Already received: ${existing.received_quantity}, Max allowable: ${Number(existing.ordered_quantity) - Number(existing.received_quantity)}.`
        );
      }
    }

    // Process each item: update PO item, update inventory stock, record stock movement
    for (const rcvItem of items) {
      const existing = poItemMap[rcvItem.product_id];
      const addedQty = Number(rcvItem.received_quantity);
      const newTotalReceived = Number(existing.received_quantity) + addedQty;

      await trx('purchase_order_items')
        .where({ id: existing.id })
        .update({
          received_quantity: newTotalReceived,
          updated_at: trx.fn.now()
        });

      // Update Inventory (Module 06)
      const hasInventory = await trx.schema.hasTable('inventory');
      let stockBefore = 0;
      let stockAfter = addedQty;

      if (hasInventory) {
        const invRecord = await trx('inventory')
          .where({ product_id: rcvItem.product_id, location_id })
          .forUpdate()
          .first();

        if (invRecord) {
          stockBefore = Number(invRecord.quantity);
          stockAfter = stockBefore + addedQty;
          await trx('inventory')
            .where({ id: invRecord.id })
            .increment('quantity', addedQty);
        } else {
          await trx('inventory').insert({
            product_id: rcvItem.product_id,
            warehouse_id,
            location_id,
            quantity: addedQty,
            reserved_quantity: 0,
            created_at: trx.fn.now(),
            updated_at: trx.fn.now()
          });
        }
      }

      // Record Stock Movement (Module 11)
      const hasMovements = await trx.schema.hasTable('stock_movements');
      if (hasMovements) {
        await trx('stock_movements').insert({
          product_id: rcvItem.product_id,
          location_id,
          movement_type: 'IN',
          quantity: addedQty,
          stock_before: stockBefore,
          stock_after: stockAfter,
          reference_type: 'PURCHASE_ORDER',
          reference_id: po.id,
          reference_number: po.po_number,
          reason: notes || `Received against PO ${po.po_number}`,
          performed_by: user.id,
          created_at: trx.fn.now()
        });
      }
    }

    // Determine new status: check if all items are fully received
    const updatedPoItems = await trx('purchase_order_items').where({ purchase_order_id: id });
    const allCompleted = updatedPoItems.every((i) => Number(i.received_quantity) >= Number(i.ordered_quantity));
    const anyReceived = updatedPoItems.some((i) => Number(i.received_quantity) > 0);

    const newStatus = allCompleted
      ? PO_STATUS.COMPLETED
      : anyReceived
      ? PO_STATUS.PARTIALLY_RECEIVED
      : po.status;

    await trx('purchase_orders').where({ id }).update({
      status: newStatus,
      completed_at: allCompleted ? trx.fn.now() : null,
      updated_at: trx.fn.now()
    });

    logger.info(`[PurchaseOrderService] Received goods for PO ${po.po_number}. New status: ${newStatus}`);

    const result = await trx('purchase_orders').where({ id }).first();
    result.items = updatedPoItems;
    return result;
  });
};

// ─── Cancel ────────────────────────────────────────────────────────────────────

const cancel = async (id, user, reason) => {
  return await db.transaction(async (trx) => {
    const po = await trx('purchase_orders').where({ id }).forUpdate().first();
    if (!po) throw ApiError.notFound('PO_NOT_FOUND', 'Purchase order not found');

    if (po.status === PO_STATUS.COMPLETED) {
      throw ApiError.badRequest('PO_CANNOT_CANCEL', 'COMPLETED purchase orders cannot be canceled.');
    }
    if (po.status === PO_STATUS.PARTIALLY_RECEIVED) {
      throw ApiError.badRequest('PO_CANNOT_CANCEL', 'Partially received purchase orders cannot be canceled.');
    }
    if (po.status === PO_STATUS.CANCELED) {
      throw ApiError.badRequest('PO_INVALID_STATUS', 'Purchase order is already canceled.');
    }

    const cancelNote = reason ? `\n[Cancellation Reason: ${reason}]` : '';
    await trx('purchase_orders').where({ id }).update({
      status: PO_STATUS.CANCELED,
      notes: po.notes ? `${po.notes}${cancelNote}` : (reason || 'Canceled'),
      updated_at: trx.fn.now()
    });

    logger.info(`[PurchaseOrderService] PO ${po.po_number} (ID: ${id}) CANCELED by User ${user.id}`);

    const canceled = await trx('purchase_orders').where({ id }).first();
    canceled.items = await trx('purchase_order_items').where({ purchase_order_id: id });
    return canceled;
  });
};

// ─── Master Data ──────────────────────────────────────────────────────────────

const getMasterData = async () => {
  let suppliers = [], products = [], warehouses = [], locations = [];

  const hasSuppliers = await db.schema.hasTable('suppliers');
  const hasProducts = await db.schema.hasTable('products');
  const hasWarehouses = await db.schema.hasTable('warehouses');
  const hasLocations = await db.schema.hasTable('locations');

  if (hasSuppliers) {
    suppliers = await db('suppliers').select('id', 'name', 'code', 'email', 'phone').where({ status: 'ACTIVE' });
  }
  if (hasProducts) {
    products = await db('products').select('id', 'sku', 'name', 'price', 'status').where({ status: 'ACTIVE' });
  }
  if (hasWarehouses) {
    warehouses = await db('warehouses').select('id', 'name', 'code', 'status').where({ status: 'ACTIVE' });
  }
  if (hasLocations) {
    locations = await db('locations').select('id', 'warehouse_id', 'name', 'code');
  }

  return { suppliers, products, warehouses, locations };
};

module.exports = { getAll, getById, create, update, confirm, receiveGoods, cancel, getMasterData };
