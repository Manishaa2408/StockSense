exports.seed = async function (knex) {
  await knex('delivery_items').del();
  await knex('deliveries').del();

  const products = await knex('products').select('id', 'sku');
  const locations = await knex('locations').select('id', 'code', 'warehouse_id');
  const users = await knex('users').select('id');

  if (users.length === 0) return;
  const adminId = users[0].id;

  const getProduct = (sku) => products.find((p) => p.sku === sku);
  const getLocation = (code) => locations.find((l) => l.code === code);

  const p1 = getProduct('PROD-DELL-XPS15');
  const p2 = getProduct('PROD-LOGI-MXM3');
  const p4 = getProduct('PROD-BOLT-M8-50');

  const l1 = getLocation('A-01'); // Chennai
  const l3 = getLocation('Z1-A'); // Bangalore

  if (l1 && p1 && p2) {
    const [del1Id] = await knex('deliveries').insert({
      reference: 'DEL-2026-0001',
      source_warehouse_id: l1.warehouse_id,
      source_location_id: l1.id,
      status: 'READY',
      scheduled_date: '2026-02-01',
      notes: 'Priority dispatch for Tech Corp',
      created_by: adminId,
    });

    await knex('delivery_items').insert([
      { delivery_id: del1Id, product_id: p1.id, requested_quantity: 5, processed_quantity: 5 },
      { delivery_id: del1Id, product_id: p2.id, requested_quantity: 10, processed_quantity: 10 },
    ]);
  }

  if (l3 && p4) {
    const [del2Id] = await knex('deliveries').insert({
      reference: 'DEL-2026-0002',
      source_warehouse_id: l3.warehouse_id,
      source_location_id: l3.id,
      status: 'DRAFT',
      scheduled_date: '2026-02-05',
      notes: 'Standard warehouse pickup',
      created_by: adminId,
    });

    await knex('delivery_items').insert([
      { delivery_id: del2Id, product_id: p4.id, requested_quantity: 100, processed_quantity: 0 },
    ]);
  }
};
