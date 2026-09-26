/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('suppliers');
  if (!exists) {
    await knex.schema.createTable('suppliers', (table) => {
      table.increments('id').primary();
      table.string('code', 50).notNullable().unique();
      table.string('name', 200).notNullable();
      table.string('contact_person', 100).nullable();
      table.string('email', 100).nullable();
      table.string('phone', 50).nullable();
      table.text('address').nullable();
      table.enum('status', ['ACTIVE', 'INACTIVE']).notNullable().defaultTo('ACTIVE');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index('code');
      table.index('status');
      table.index('name');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('suppliers');
};
