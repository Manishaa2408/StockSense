exports.seed = async function (knex) {
  await knex('goods_receipt_items').del();
  await knex('goods_receipts').del();

  const products = await knex('products').select('id', 'name');
  const locations = await knex('locations').select('id', 'name', 'warehouse_id');
  const users = await knex('users').select('id');
  const getProduct = (name) => products.find((p) => p.name === name);
  const getLocation = (name) => locations.find((l) => l.name === name);

  if (users.length === 0) return;
  const adminId = users[0].id;

  const p1 = getProduct('Dell XPS 15');
  const p2 = getProduct('Logitech MX Master 3');
  const p4 = getProduct('M8 Stainless Steel Bolt');
  const l1 = getLocation('A-01'); // Chennai
  const l3 = getLocation('Z1-A'); // Bangalore

  if (l1 && p1 && p2) {
    const [gr1Id] = await knex('goods_receipts').insert({
      receipt_number: 'GRN-2026-0001',
      supplier_name: 'ABC Electronics Pvt Ltd',
      purchase_order_ref: 'PO-10025',
      warehouse_id: l1.warehouse_id,
      location_id: l1.id,
      receipt_date: '2026-01-15',
      status: 'CONFIRMED',
      created_by: adminId,
    });

    await knex('goods_receipt_items').insert([
      { goods_receipt_id: gr1Id, product_id: p1.id, ordered_quantity: 20, received_quantity: 20, accepted_quantity: 20 },
      { goods_receipt_id: gr1Id, product_id: p2.id, ordered_quantity: 50, received_quantity: 50, accepted_quantity: 50 },
    ]);
  }

  if (l3 && p4) {
    const [gr2Id] = await knex('goods_receipts').insert({
      receipt_number: 'GRN-2026-0002',
      supplier_name: 'Global Logistics & Supplies',
      purchase_order_ref: 'PO-10026',
      warehouse_id: l3.warehouse_id,
      location_id: l3.id,
      receipt_date: '2026-01-20',
      status: 'DRAFT',
      created_by: adminId,
    });

    await knex('goods_receipt_items').insert([
      { goods_receipt_id: gr2Id, product_id: p4.id, ordered_quantity: 500, received_quantity: 500, accepted_quantity: 500 },
    ]);
  }
};
