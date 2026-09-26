exports.seed = async function (knex) {
  await knex('audit_logs').del();

  const users = await knex('users').select('id');
  if (users.length === 0) return;
  const adminId = users[0].id;

  await knex('audit_logs').insert([
    {
      user_id: adminId,
      action: 'CREATE',
      module: 'PRODUCT',
      entity_type: 'PRODUCT',
      entity_id: '1',
      description: 'Created new product Dell XPS 15 Laptop (PROD-DELL-XPS15)',
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    {
      user_id: adminId,
      action: 'CONFIRM',
      module: 'RECEIPT',
      entity_type: 'GOODS_RECEIPT',
      entity_id: '1',
      description: 'Confirmed goods receipt GRN-2026-0001 and increased warehouse inventory',
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    {
      user_id: adminId,
      action: 'UPDATE',
      module: 'WAREHOUSE',
      entity_type: 'WAREHOUSE',
      entity_id: '1',
      description: 'Updated warehouse details for Chennai Central Warehouse',
      ip_address: '127.0.0.1',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  ]);
};
