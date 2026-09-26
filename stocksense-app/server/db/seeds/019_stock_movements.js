exports.seed = async function (knex) {
  await knex('stock_movements').del();

  const products = await knex('products').select('id', 'sku');
  const locations = await knex('locations').select('id', 'code');
  const users = await knex('users').select('id');

  if (users.length === 0) return;
  const adminId = users[0].id;

  const getProduct = (sku) => products.find((p) => p.sku === sku);
  const getLocation = (code) => locations.find((l) => l.code === code);

  const p1 = getProduct('PROD-DELL-XPS15');
  const p2 = getProduct('PROD-LOGI-MXM3');

  const l1 = getLocation('A-01');
  const l3 = getLocation('Z1-A');

  if (p1 && l1) {
    await knex('stock_movements').insert([
      {
        product_id: p1.id,
        destination_location_id: l1.id,
        quantity: 20,
        movement_type: 'RECEIPT',
        reference_type: 'GOODS_RECEIPT',
        reference_id: 'GRN-2026-0001',
        performed_by: adminId,
      },
      {
        product_id: p1.id,
        source_location_id: l1.id,
        quantity: 1,
        movement_type: 'ADJUSTMENT_DECREASE',
        reference_type: 'ADJUSTMENT',
        reference_id: 'ADJ-2026-0001',
        performed_by: adminId,
      }
    ]);
  }

  if (p2 && l1 && l3) {
    await knex('stock_movements').insert([
      {
        product_id: p2.id,
        source_location_id: l1.id,
        destination_location_id: l3.id,
        quantity: 15,
        movement_type: 'TRANSFER',
        reference_type: 'STOCK_TRANSFER',
        reference_id: 'TRF-2026-0001',
        performed_by: adminId,
      }
    ]);
  }
};
