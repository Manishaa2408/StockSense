/**
 * Migration: Create stock_transfer_items table (Module 09)
 */
exports.up = function(knex) {
  return knex.schema.createTable('stock_transfer_items', (table) => {
    table.increments('id').primary();
    table.integer('transfer_id').unsigned().notNullable()
      .references('id').inTable('stock_transfers').onDelete('CASCADE');
    table.integer('product_id').unsigned().notNullable();
    table.decimal('quantity', 12, 4).notNullable();
    table.timestamps(true, true);

    table.index(['transfer_id']);
    table.index(['product_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('stock_transfer_items');
};
