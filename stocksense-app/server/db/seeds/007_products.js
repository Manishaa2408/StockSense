exports.seed = async function(knex) {
  const existing = await knex('products').select('id');
  if (existing.length > 0) return;

  const adminUser = await knex('users').first();
  const userId = adminUser ? adminUser.id : null;

  await knex('products').insert([
    {
      sku: 'PROD-DELL-XPS15',
      name: 'Dell XPS 15 Laptop',
      description: 'High-performance laptop with 16GB RAM, 512GB SSD, Intel Core i7',
      category_id: 1,
      unit_id: 1,
      reorder_level: 5,
      status: 'ACTIVE',
      created_by: userId,
      updated_by: userId
    },
    {
      sku: 'PROD-LOGI-MXM3',
      name: 'Logitech MX Master 3 Mouse',
      description: 'Ergonomic wireless mouse with customizable gesture control',
      category_id: 1,
      unit_id: 1,
      reorder_level: 10,
      status: 'ACTIVE',
      created_by: userId,
      updated_by: userId
    },
    {
      sku: 'PROD-BOX-LG-01',
      name: 'Large Shipping Box (40x40x40cm)',
      description: 'Corrugated heavy-duty shipping box for packaging bulk inventory',
      category_id: 4,
      unit_id: 4,
      reorder_level: 50,
      status: 'ACTIVE',
      created_by: userId,
      updated_by: userId
    },
    {
      sku: 'PROD-BOLT-M8-50',
      name: 'M8 Stainless Steel Bolt 50mm',
      description: 'Industrial grade rust-resistant stainless steel hex bolt',
      category_id: 5,
      unit_id: 1,
      reorder_level: 200,
      status: 'ACTIVE',
      created_by: userId,
      updated_by: userId
    },
    {
      sku: 'PROD-PAPER-A4-80GSM',
      name: 'A4 Printing Paper 80gsm (Box of 5 Reams)',
      description: 'Standard multi-purpose white office printing paper',
      category_id: 3,
      unit_id: 4,
      reorder_level: 20,
      status: 'ACTIVE',
      created_by: userId,
      updated_by: userId
    }
  ]);
};
