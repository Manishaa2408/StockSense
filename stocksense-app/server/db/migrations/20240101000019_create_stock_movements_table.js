/**
 * Migration: Create stock_movements table (Module 11)
 * Immutable ledger — records every stock change across all modules.
 */
exports.up = function(knex) {
  return knex.schema.createTable('stock_movements', (table) => {
    table.increments('id').primary();
    table.integer('product_id').unsigned().notNullable();
    table.integer('location_id').unsigned().nullable();
    table.integer('source_location_id').unsigned().nullable();
    table.integer('destination_location_id').unsigned().nullable();
    table.enum('movement_type', [
      'IN', 'OUT', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT_INCREASE', 'ADJUSTMENT_DECREASE', 'RETURN'
    ]).notNullable();
    table.decimal('quantity', 12, 4).notNullable();
    table.decimal('stock_before', 12, 4).nullable();
    table.decimal('stock_after', 12, 4).nullable();
    table.string('reference_type', 50).nullable();  // 'DELIVERY', 'TRANSFER', 'ADJUSTMENT'
    table.integer('reference_id').unsigned().nullable();
    table.string('reference_number', 100).nullable(); // human-readable ref e.g. ADJ-000001
    table.string('reason', 255).nullable();
    table.integer('performed_by').unsigned().nullable()
      .references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['product_id']);
    table.index(['location_id']);
    table.index(['movement_type']);
    table.index(['reference_type', 'reference_id']);
    table.index(['performed_by']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('stock_movements');
};
