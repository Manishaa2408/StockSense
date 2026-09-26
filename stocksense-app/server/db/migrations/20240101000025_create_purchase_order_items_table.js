/**
 * Migration: Create purchase_order_items table (Module 13)
 */
exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('purchase_order_items');
  if (!exists) {
    await knex.schema.createTable('purchase_order_items', (table) => {
      table.increments('id').primary();
      table.integer('purchase_order_id').unsigned().notNullable()
        .references('id').inTable('purchase_orders').onDelete('CASCADE');
      table.integer('product_id').unsigned().notNullable()
        .references('id').inTable('products').onDelete('RESTRICT');
      table.decimal('ordered_quantity', 12, 4).notNullable();
      table.decimal('received_quantity', 12, 4).notNullable().defaultTo(0);
      table.decimal('unit_price', 12, 2).notNullable().defaultTo(0);
      table.decimal('tax_rate', 6, 2).notNullable().defaultTo(0);
      table.decimal('discount', 12, 2).notNullable().defaultTo(0);
      table.decimal('line_total', 14, 2).notNullable().defaultTo(0);
      table.timestamps(true, true);

      table.index(['purchase_order_id']);
      table.index(['product_id']);
    });
  }
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('purchase_order_items');
};
