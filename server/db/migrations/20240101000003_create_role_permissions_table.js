exports.up = function(knex) {
  return knex.schema.createTable('role_permissions', (table) => {
    table.integer('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table.integer('permission_id').unsigned().notNullable().references('id').inTable('permissions').onDelete('CASCADE');
    table.primary(['role_id', 'permission_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('role_permissions');
};
