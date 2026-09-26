exports.seed = async function (knex) {
  await knex('stock_transfer_items').del();
  await knex('stock_transfers').del();

  const products = await knex('products').select('id', 'sku');
  const locations = await knex('locations').select('id', 'code', 'warehouse_id');
  const users = await knex('users').select('id');

  if (users.length === 0) return;
  const adminId = users[0].id;

  const getProduct = (sku) => products.find((p) => p.sku === sku);
  const getLocation = (code) => locations.find((l) => l.code === code);

  const p2 = getProduct('PROD-LOGI-MXM3');
  const p4 = getProduct('PROD-BOLT-M8-50');

  const l1 = getLocation('A-01'); // Chennai
  const l3 = getLocation('Z1-A'); // Bangalore
  const l4 = getLocation('DOCK-01'); // Mumbai

  if (l1 && l3 && p2) {
    const [trf1Id] = await knex('stock_transfers').insert({
      reference: 'TRF-2026-0001',
      source_warehouse_id: l1.warehouse_id,
      source_location_id: l1.id,
      destination_warehouse_id: l3.warehouse_id,
      destination_location_id: l3.id,
      status: 'IN_TRANSIT',
      notes: 'Inter-branch rebalancing transfer',
      created_by: adminId,
    });

    await knex('stock_transfer_items').insert([
      { transfer_id: trf1Id, product_id: p2.id, quantity: 15 },
    ]);
  }

  if (l3 && l4 && p4) {
    const [trf2Id] = await knex('stock_transfers').insert({
      reference: 'TRF-2026-0002',
      source_warehouse_id: l3.warehouse_id,
      source_location_id: l3.id,
      destination_warehouse_id: l4.warehouse_id,
      destination_location_id: l4.id,
      status: 'DRAFT',
      notes: 'Bulk stock replenishment',
      created_by: adminId,
    });

    await knex('stock_transfer_items').insert([
      { transfer_id: trf2Id, product_id: p4.id, quantity: 200 },
    ]);
  }
};
