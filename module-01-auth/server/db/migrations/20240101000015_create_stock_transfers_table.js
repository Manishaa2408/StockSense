/**
 * Migration: Create stock_transfers table (Module 09)
 */
exports.up = function(knex) {
  return knex.schema.createTable('stock_transfers', (table) => {
    table.increments('id').primary();
    table.string('reference', 64).notNullable().unique();
    table.integer('source_warehouse_id').unsigned().notNullable();
    table.integer('source_location_id').unsigned().notNullable();
    table.integer('destination_warehouse_id').unsigned().notNullable();
    table.integer('destination_location_id').unsigned().notNullable();
    table.enum('status', ['DRAFT', 'READY', 'IN_TRANSIT', 'COMPLETED', 'CANCELED'])
      .notNullable()
      .defaultTo('DRAFT');
    table.text('notes').nullable();
    table.integer('created_by').unsigned().notNullable()
      .references('id').inTable('users').onDelete('RESTRICT');
    table.integer('completed_by').unsigned().nullable()
      .references('id').inTable('users').onDelete('RESTRICT');
    table.timestamp('completed_at').nullable();
    table.timestamps(true, true);

    table.index(['reference']);
    table.index(['status']);
    table.index(['source_warehouse_id']);
    table.index(['destination_warehouse_id']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('stock_transfers');
};
