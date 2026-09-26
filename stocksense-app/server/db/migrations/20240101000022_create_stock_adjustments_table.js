/**
 * Migration: Create stock_adjustments table (Module 10)
 */
exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('stock_adjustments');
  if (!exists) {
    await knex.schema.createTable('stock_adjustments', (table) => {
      table.increments('id').primary();
      table.string('reference', 50).notNullable().unique();
      table.integer('warehouse_id').unsigned().notNullable()
        .references('id').inTable('warehouses').onDelete('RESTRICT');
      table.integer('location_id').unsigned().notNullable()
        .references('id').inTable('locations').onDelete('RESTRICT');
      table.enum('status', ['DRAFT', 'APPROVED', 'COMPLETED', 'CANCELED']).notNullable().defaultTo('DRAFT');
      table.string('reason', 100).notNullable();
      table.text('notes').nullable();
      table.integer('created_by').unsigned().notNullable()
        .references('id').inTable('users').onDelete('RESTRICT');
      table.integer('approved_by').unsigned().nullable()
        .references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('approved_at').nullable();
      table.timestamp('completed_at').nullable();
      table.timestamps(true, true);

      table.index(['status']);
      table.index(['warehouse_id']);
      table.index(['location_id']);
      table.index(['created_by']);
      table.index(['reference']);
    });
  }
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('stock_adjustments');
};
