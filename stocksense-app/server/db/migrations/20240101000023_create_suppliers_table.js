/**
 * Migration: Create suppliers table (Module 12 foundation for POs)
 */
exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('suppliers');
  if (!exists) {
    await knex.schema.createTable('suppliers', (table) => {
      table.increments('id').primary();
      table.string('code', 50).notNullable().unique();
      table.string('name', 255).notNullable();
      table.string('email', 255).nullable();
      table.string('phone', 50).nullable();
      table.string('contact_person', 255).nullable();
      table.text('address').nullable();
      table.string('city', 100).nullable();
      table.string('country', 100).nullable().defaultTo('India');
      table.string('tax_id', 100).nullable();
      table.enum('status', ['ACTIVE', 'INACTIVE']).notNullable().defaultTo('ACTIVE');
      table.text('notes').nullable();
      table.timestamps(true, true);

      table.index(['code']);
      table.index(['name']);
      table.index(['status']);
    });
  }
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('suppliers');
};
