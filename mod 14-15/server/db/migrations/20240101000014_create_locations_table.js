/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('locations', (table) => {
    table.increments('id').primary();
    table.integer('warehouse_id').unsigned().notNullable().references('id').inTable('warehouses');
    table.string('name', 200).notNullable();
    table.string('code', 50).notNullable();
    table.text('description').nullable();
    table.enum('status', ['ACTIVE', 'INACTIVE']).notNullable().defaultTo('ACTIVE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.unique(['warehouse_id', 'code']);
    table.index(['warehouse_id', 'status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('locations');
};
