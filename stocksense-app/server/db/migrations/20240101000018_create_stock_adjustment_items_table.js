/**
 * Migration: Create stock_adjustment_items table (Module 10)
 */
exports.up = function(knex) {
  return knex.schema.createTable('stock_adjustment_items', (table) => {
    table.increments('id').primary();
    table.integer('adjustment_id').unsigned().notNullable()
      .references('id').inTable('stock_adjustments').onDelete('CASCADE');
    table.integer('product_id').unsigned().notNullable();
    table.decimal('quantity', 12, 4).notNullable();
    table.enum('adjustment_type', ['INCREASE', 'DECREASE']).notNullable();
    table.string('reason', 100).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['adjustment_id']);
    table.index(['product_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('stock_adjustment_items');
};
