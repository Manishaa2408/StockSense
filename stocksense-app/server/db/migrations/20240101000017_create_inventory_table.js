exports.up = async function (knex) {
  await knex.schema.createTable('inventory', (table) => {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable().references('id').inTable('products');
    table.integer('warehouse_id').unsigned().notNullable().references('id').inTable('warehouses');
    table.integer('location_id').unsigned().notNullable().references('id').inTable('locations');
    table.decimal('quantity', 12, 4).notNullable().defaultTo(0);
    table.decimal('reserved_quantity', 12, 4).notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.unique(['product_id', 'location_id']);
    table.index('product_id');
    table.index('warehouse_id');
    table.index('location_id');
  });

  try {
    await knex.raw('CREATE VIEW stock AS SELECT id, product_id, warehouse_id, location_id, quantity, reserved_quantity, created_at, updated_at FROM inventory');
  } catch (err) {
    console.warn('View creation failed, falling back to basic setup', err);
  }
};

exports.down = async function (knex) {
  await knex.schema.dropViewIfExists('stock');
  await knex.schema.dropTableIfExists('inventory');
};
