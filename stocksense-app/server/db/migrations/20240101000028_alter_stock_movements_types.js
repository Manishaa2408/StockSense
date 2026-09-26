exports.up = async function(knex) {
  const hasTable = await knex.schema.hasTable('stock_movements');
  if (hasTable) {
    await knex.schema.alterTable('stock_movements', (table) => {
      table.string('movement_type', 50).notNullable().alter();
      table.string('reference_id', 100).nullable().alter();
    });
  }
};

exports.down = async function(knex) {
  // No-op rollback
};
