exports.seed = async function (knex) {
  // Clear existing entries
  await knex('inventory').del();

  const products = await knex('products').select('id', 'name');
  const locations = await knex('locations').select('id', 'name', 'warehouse_id');

  const getProduct = (name) => products.find((p) => p.name === name);
  const getLocation = (name) => locations.find((l) => l.name === name);

  const p1 = getProduct('Dell XPS 15');
  const p2 = getProduct('Logitech MX Master 3');
  const p3 = getProduct('Large Shipping Box');
  const p4 = getProduct('M8 Stainless Steel Bolt');
  const p5 = getProduct('A4 Printing Paper');

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
