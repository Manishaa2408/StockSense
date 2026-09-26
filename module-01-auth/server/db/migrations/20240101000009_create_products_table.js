exports.up = function(knex) {
  return knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.string('sku', 100).notNullable().unique();
    table.string('name', 255).notNullable();
    table.text('description').nullable();
    table.integer('category_id').unsigned().notNullable().references('id').inTable('categories');
    table.integer('unit_id').unsigned().notNullable().references('id').inTable('units');
    table.integer('reorder_level').unsigned().notNullable().defaultTo(0);
    table.enum('status', ['ACTIVE', 'INACTIVE']).notNullable().defaultTo('ACTIVE');
    table.integer('created_by').unsigned().nullable().references('id').inTable('users');
    table.integer('updated_by').unsigned().nullable().references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('sku');
    table.index('status');
    table.index('category_id');
    table.index('unit_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('products');
};
