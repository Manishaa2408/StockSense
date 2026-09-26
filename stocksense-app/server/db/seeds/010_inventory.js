exports.seed = async function (knex) {
  // Clear existing entries
  await knex('inventory').del();

  const products = await knex('products').select('id', 'sku');
  const locations = await knex('locations').select('id', 'code', 'warehouse_id');

  const getProduct = (sku) => products.find((p) => p.sku === sku);
  const getLocation = (code) => locations.find((l) => l.code === code);

  const p1 = getProduct('PROD-DELL-XPS15');
  const p2 = getProduct('PROD-LOGI-MXM3');
  const p3 = getProduct('PROD-BOX-LG-01');
  const p4 = getProduct('PROD-BOLT-M8-50');
  const p5 = getProduct('PROD-PAPER-A4-80GSM');

  const l1 = getLocation('A-01'); // Chennai
  const l2 = getLocation('A-02'); // Chennai
  const l3 = getLocation('Z1-A'); // Bangalore
  const l4 = getLocation('DOCK-01'); // Mumbai

  const inventoryData = [];

  if (p1 && l1) inventoryData.push({ product_id: p1.id, warehouse_id: l1.warehouse_id, location_id: l1.id, quantity: 50, reserved_quantity: 5 });
  if (p2 && l1) inventoryData.push({ product_id: p2.id, warehouse_id: l1.warehouse_id, location_id: l1.id, quantity: 100, reserved_quantity: 10 });
  if (p3 && l2) inventoryData.push({ product_id: p3.id, warehouse_id: l2.warehouse_id, location_id: l2.id, quantity: 500, reserved_quantity: 0 });
  if (p4 && l3) inventoryData.push({ product_id: p4.id, warehouse_id: l3.warehouse_id, location_id: l3.id, quantity: 1000, reserved_quantity: 50 });
  if (p5 && l4) inventoryData.push({ product_id: p5.id, warehouse_id: l4.warehouse_id, location_id: l4.id, quantity: 200, reserved_quantity: 0 });

  if (inventoryData.length > 0) {
    await knex('inventory').insert(inventoryData);
  }
};
