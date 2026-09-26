exports.seed = async function (knex) {
  await knex('stock_adjustment_items').del();
  await knex('stock_adjustments').del();

  const products = await knex('products').select('id', 'sku');
  const locations = await knex('locations').select('id', 'code', 'warehouse_id');
  const users = await knex('users').select('id');

  if (users.length === 0) return;
  const adminId = users[0].id;

  const getProduct = (sku) => products.find((p) => p.sku === sku);
  const getLocation = (code) => locations.find((l) => l.code === code);

  const p1 = getProduct('PROD-DELL-XPS15');
  const p4 = getProduct('PROD-BOLT-M8-50');

  const l1 = getLocation('A-01'); // Chennai
  const l3 = getLocation('Z1-A'); // Bangalore

  if (l1 && p1) {
    const [adj1Id] = await knex('stock_adjustments').insert({
      reference: 'ADJ-2026-0001',
      warehouse_id: l1.warehouse_id,
      location_id: l1.id,
      status: 'APPROVED',
      reason: 'DAMAGED',
      notes: 'Physical audit discovered damaged unit during inspection',
      created_by: adminId,
      approved_by: adminId,
      approved_at: knex.fn.now(),
    });

    await knex('stock_adjustment_items').insert([
      { adjustment_id: adj1Id, product_id: p1.id, quantity: 1, adjustment_type: 'DECREASE', reason: 'DAMAGED' },
    ]);
  }

  if (l3 && p4) {
    const [adj2Id] = await knex('stock_adjustments').insert({
      reference: 'ADJ-2026-0002',
      warehouse_id: l3.warehouse_id,
      location_id: l3.id,
      status: 'DRAFT',
      reason: 'COUNT_CORRECTION',
      notes: 'Reconciliation after physical stock count',
      created_by: adminId,
    });

    await knex('stock_adjustment_items').insert([
      { adjustment_id: adj2Id, product_id: p4.id, quantity: 50, adjustment_type: 'INCREASE', reason: 'FOUND' },
    ]);
  }
};
