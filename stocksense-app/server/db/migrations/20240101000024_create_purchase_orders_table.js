/**
 * Migration: Create purchase_orders table (Module 13)
 */
exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('purchase_orders');
  if (!exists) {
    await knex.schema.createTable('purchase_orders', (table) => {
      table.increments('id').primary();
      table.string('po_number', 50).notNullable().unique();
      table.integer('supplier_id').unsigned().notNullable()
        .references('id').inTable('suppliers').onDelete('RESTRICT');
      table.date('order_date').notNullable();
      table.date('expected_delivery_date').nullable();
      table.enum('status', ['DRAFT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'COMPLETED', 'CANCELED'])
        .notNullable().defaultTo('DRAFT');
      table.decimal('subtotal', 14, 2).notNullable().defaultTo(0);
      table.decimal('tax', 14, 2).notNullable().defaultTo(0);
      table.decimal('discount', 14, 2).notNullable().defaultTo(0);
      table.decimal('grand_total', 14, 2).notNullable().defaultTo(0);
      table.text('notes').nullable();
      table.integer('created_by').unsigned().notNullable()
        .references('id').inTable('users').onDelete('RESTRICT');
      table.integer('confirmed_by').unsigned().nullable()
        .references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('confirmed_at').nullable();
      table.timestamp('completed_at').nullable();
      table.timestamps(true, true);

      table.index(['po_number']);
      table.index(['supplier_id']);
      table.index(['status']);
      table.index(['order_date']);
      table.index(['created_by']);
    });
  }
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('purchase_orders');
};
