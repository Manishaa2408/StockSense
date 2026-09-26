exports.up = function(knex) {
  return knex.schema.createTable('permissions', (table) => {
    table.increments('id').primary();
    table.string('module', 50).notNullable();
    table.string('action', 50).notNullable();
    table.string('description', 255).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.unique(['module', 'action']);
    table.index('module');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('permissions');
};
