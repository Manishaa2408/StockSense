exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('audit_logs');
  if (!exists) {
    await knex.schema.createTable('audit_logs', (table) => {
      table.increments('id').primary();
      table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
      table.string('action', 50).notNullable();
      table.string('module', 50).notNullable();
      table.string('entity_type', 50).notNullable();
      table.string('entity_id', 100).nullable();
      table.text('description').nullable();
      table.json('before_data').nullable();
      table.json('after_data').nullable();
      table.json('metadata').nullable();
      table.string('ip_address', 45).nullable();
      table.text('user_agent').nullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      // Single and composite indexes for fast querying and filtering
      table.index('user_id');
      table.index('module');
      table.index('action');
      table.index('entity_type');
      table.index('created_at');
      table.index(['module', 'created_at']);
      table.index(['user_id', 'created_at']);
      table.index(['entity_type', 'entity_id']);
    });
  }
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('audit_logs');
};
