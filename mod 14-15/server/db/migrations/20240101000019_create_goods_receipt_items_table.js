exports.up = async function (knex) {
  await knex.schema.createTable('goods_receipt_items', (table) => {
    table.increments('id').primary();
    table.integer('goods_receipt_id').unsigned().notNullable().references('id').inTable('goods_receipts').onDelete('CASCADE');
    table.integer('product_id').unsigned().notNullable().references('id').inTable('products');
    table.decimal('ordered_quantity', 12, 4).notNullable().defaultTo(0);
    table.decimal('received_quantity', 12, 4).notNullable().defaultTo(0);
    table.decimal('accepted_quantity', 12, 4).notNullable().defaultTo(0);
    table.decimal('rejected_quantity', 12, 4).notNullable().defaultTo(0);
    table.text('remarks').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('goods_receipt_id');
    table.index('product_id');
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('goods_receipt_items');
};
