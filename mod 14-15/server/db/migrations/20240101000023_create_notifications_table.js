exports.up = function(knex) {
  return knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('type', 50).notNullable();
    table.string('title', 255).notNullable();
    table.text('message').notNullable();
    table.enum('severity', ['INFO', 'WARNING', 'CRITICAL']).notNullable().defaultTo('INFO');
    table.boolean('is_read').notNullable().defaultTo(false);
    table.timestamp('read_at').nullable();
    table.string('entity_type', 50).nullable();
    table.string('entity_id', 100).nullable();
    table.string('action_url', 255).nullable();
    table.string('notification_key', 150).nullable();
    table.json('metadata').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Single and compound indexes for fast querying and unread counts
    table.index('user_id');
    table.index(['user_id', 'is_read']);
    table.index(['user_id', 'is_read', 'created_at']);
    table.index('created_at');
    table.index('type');
    table.index('severity');
    table.index('notification_key');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('notifications');
};
