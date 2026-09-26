exports.up = function(knex) {
  return knex.schema
    .alterTable('categories', (table) => {
      table.integer('parent_id').unsigned().nullable().references('id').inTable('categories').onDelete('RESTRICT');
    })
    .alterTable('units', (table) => {
      table.enum('unit_type', ['Count', 'Weight', 'Volume', 'Length', 'Packaging', 'Other']).notNullable().defaultTo('Count');
    });
};

exports.down = function(knex) {
  return knex.schema
    .alterTable('categories', (table) => {
      table.dropForeign(['parent_id']);
      table.dropColumn('parent_id');
    })
    .alterTable('units', (table) => {
      table.dropColumn('unit_type');
    });
};
