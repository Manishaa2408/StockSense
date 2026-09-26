exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('stock_movements');
  if (!exists) {
    await knex.schema.createTable('stock_movements', (table) => {
      table.increments('id').primary();
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products');
      table.integer('location_id').unsigned().nullable().references('id').inTable('locations');
      table.integer('source_location_id').unsigned().nullable().references('id').inTable('locations');
      table.integer('destination_location_id').unsigned().nullable().references('id').inTable('locations');
      table.decimal('quantity', 12, 4).notNullable();
      table.decimal('stock_before', 12, 4).nullable();
      table.decimal('stock_after', 12, 4).nullable();
      table.string('movement_type', 50).notNullable();
      table.string('reference_type', 50).nullable();
      table.string('reference_id', 100).nullable();
      table.string('reference_number', 100).nullable();
      table.string('reason', 255).nullable();
      table.integer('performed_by').unsigned().nullable().references('id').inTable('users');
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index(['product_id']);
      table.index(['location_id']);
      table.index(['movement_type']);
      table.index(['reference_type', 'reference_id']);
      table.index(['performed_by']);
      table.index(['created_at']);
    });
  }
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('stock_movements');
};
