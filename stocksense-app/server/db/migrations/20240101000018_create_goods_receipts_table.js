exports.up = async function (knex) {
  await knex.schema.createTable('goods_receipts', (table) => {
    table.increments('id').primary();
    table.string('receipt_number', 64).notNullable().unique();
    table.string('supplier_name', 255).notNullable();
    table.string('purchase_order_ref', 100).nullable();
    table.integer('warehouse_id').unsigned().notNullable().references('id').inTable('warehouses');
    table.integer('location_id').unsigned().notNullable().references('id').inTable('locations');
    table.date('receipt_date').notNullable();
    table.enum('status', ['DRAFT', 'RECEIVED', 'CONFIRMED', 'CANCELED']).notNullable().defaultTo('DRAFT');
    table.text('notes').nullable();
    table.integer('created_by').unsigned().notNullable().references('id').inTable('users');
    table.integer('updated_by').unsigned().nullable().references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('receipt_number');
    table.index('status');
    table.index('warehouse_id');
    table.index('location_id');
    table.index('receipt_date');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('goods_receipts');
};
