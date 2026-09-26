exports.up = function(knex) {
  return knex.schema.createTable('deliveries', (table) => {
    table.increments('id').primary();
    table.string('reference', 64).notNullable().unique();
    table.integer('source_warehouse_id').unsigned().notNullable();
    table.integer('source_location_id').unsigned().notNullable();
    table.enum('status', ['DRAFT', 'READY', 'DONE', 'CANCELED']).notNullable().defaultTo('DRAFT');
    table.date('scheduled_date').nullable();
    table.text('notes').nullable();
    table.integer('created_by').unsigned().notNullable().references('id').inTable('users');
    table.integer('updated_by').unsigned().nullable().references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('reference');
    table.index('status');
    table.index('source_warehouse_id');
    table.index('source_location_id');
    table.index('scheduled_date');
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('deliveries');
};
