exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('phone', 20).nullable();
    table.string('password_hash', 255).notNullable();
    table.integer('role_id').unsigned().notNullable().references('id').inTable('roles');
    table.enum('status', ['PENDING_VERIFICATION','ACTIVE','SUSPENDED','DEACTIVATED']).notNullable().defaultTo('ACTIVE');
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('last_login_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('email');
    table.index('status');
    table.index('role_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
