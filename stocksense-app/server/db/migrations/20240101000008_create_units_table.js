exports.up = function(knex) {
  return knex.schema.createTable('units', (table) => {
    table.increments('id').primary();
    table.string('name', 100).notNullable();
    table.string('code', 20).notNullable().unique();
    table.string('description', 255).nullable();
    table.enum('status', ['ACTIVE', 'INACTIVE']).notNullable().defaultTo('ACTIVE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('units');
};
