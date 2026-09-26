exports.up = async function (knex) {
  await knex.schema.createTable('stock_movements', (table) => {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable().references('id').inTable('products');
    table.integer('source_location_id').unsigned().nullable().references('id').inTable('locations');
    table.integer('destination_location_id').unsigned().nullable().references('id').inTable('locations');
    table.decimal('quantity', 12, 4).notNullable();
    table.string('movement_type', 50).notNullable();
    table.string('reference_type', 50).nullable();
    table.string('reference_id', 100).nullable();
    table.integer('performed_by').unsigned().nullable().references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('stock_movements');
};
