exports.up = function(knex) {
  return knex.schema.createTable('delivery_items', (table) => {
    table.increments('id').primary();
    table.integer('delivery_id').unsigned().notNullable().references('id').inTable('deliveries').onDelete('CASCADE');
    table.integer('product_id').unsigned().notNullable().references('id').inTable('products');
    table.decimal('requested_quantity', 12, 4).notNullable();
    table.decimal('processed_quantity', 12, 4).notNullable().defaultTo(0.0000);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('delivery_id');
    table.index('product_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('delivery_items');
};
