exports.up = function(knex) {
  return knex.schema.createTable('password_reset_tokens', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('otp_hash', 255).notNullable();
    table.timestamp('expires_at').notNullable();
    table.integer('attempts').unsigned().defaultTo(0);
    table.integer('max_attempts').unsigned().defaultTo(3);
    table.boolean('used').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('user_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('password_reset_tokens');
};
