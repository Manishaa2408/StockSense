exports.seed = async function (knex) {
  await knex('purchase_order_items').del();
  await knex('purchase_orders').del();

  const suppliers = await knex('suppliers').select('id', 'code');
  const products = await knex('products').select('id', 'sku');
  const users = await knex('users').select('id');

  if (users.length === 0 || suppliers.length === 0) return;
  const adminId = users[0].id;

  const getSupplier = (code) => suppliers.find((s) => s.code === code);
  const getProduct = (sku) => products.find((p) => p.sku === sku);

  const s1 = getSupplier('SUP-001');
  const s2 = getSupplier('SUP-002');
  const p1 = getProduct('PROD-DELL-XPS15');
  const p2 = getProduct('PROD-LOGI-MXM3');
  const p3 = getProduct('PROD-BOX-LG-01');

  if (s1 && p1 && p2) {
    const subtotal = 10 * 1200.0 + 20 * 80.0;
    const tax = subtotal * 0.18;
    const grandTotal = subtotal + tax;

    const [po1Id] = await knex('purchase_orders').insert({
      po_number: 'PO-2026-0001',
      supplier_id: s1.id,
      order_date: '2026-01-10',
      expected_delivery_date: '2026-01-25',
      status: 'CONFIRMED',
      subtotal,
      tax,
      discount: 0,
      grand_total: grandTotal,
      notes: 'Initial procurement for Q1 inventory refresh',
      created_by: adminId,
      confirmed_by: adminId,
      confirmed_at: knex.fn.now(),
    });

    await knex('purchase_order_items').insert([
      { purchase_order_id: po1Id, product_id: p1.id, ordered_quantity: 10, unit_price: 1200.0, line_total: 12000.0 },
      { purchase_order_id: po1Id, product_id: p2.id, ordered_quantity: 20, unit_price: 80.0, line_total: 1600.0 },
    ]);
  }

  if (s2 && p3) {
    const subtotal = 200 * 2.5;
    const tax = subtotal * 0.18;
    const grandTotal = subtotal + tax;

    const [po2Id] = await knex('purchase_orders').insert({
      po_number: 'PO-2026-0002',
      supplier_id: s2.id,
      order_date: '2026-01-20',
      expected_delivery_date: '2026-02-05',
      status: 'DRAFT',
      subtotal,
      tax,
      discount: 0,
      grand_total: grandTotal,
      notes: 'Packaging supplies replenishment',
      created_by: adminId,
    });

    await knex('purchase_order_items').insert([
      { purchase_order_id: po2Id, product_id: p3.id, ordered_quantity: 200, unit_price: 2.5, line_total: 500.0 },
    ]);
  }
};
