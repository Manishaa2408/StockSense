exports.seed = async function (knex) {
  await knex('notifications').del();

  const users = await knex('users').select('id');
  if (users.length === 0) return;
  const adminId = users[0].id;

  await knex('notifications').insert([
    {
      user_id: adminId,
      type: 'LOW_STOCK',
      title: 'Low Stock Alert: Dell XPS 15 Laptop',
      message: 'Available stock quantity (45) is near reorder threshold (50). Consider placing a purchase order.',
      severity: 'WARNING',
      is_read: false,
      entity_type: 'PRODUCT',
      entity_id: '1',
      action_url: '/inventory/1',
      notification_key: 'LOW_STOCK_PROD-DELL-XPS15',
    },
    {
      user_id: adminId,
      type: 'RECEIPT_CONFIRMED',
      title: 'Goods Receipt Confirmed: GRN-2026-0001',
      message: 'Goods receipt GRN-2026-0001 has been confirmed and warehouse stock levels updated.',
      severity: 'INFO',
      is_read: true,
      read_at: knex.fn.now(),
      entity_type: 'GOODS_RECEIPT',
      entity_id: '1',
      action_url: '/goods-receipts/1',
      notification_key: 'GRN_CONFIRM_GRN-2026-0001',
    },
    {
      user_id: adminId,
      type: 'TRANSFER_CREATED',
      title: 'Stock Transfer In-Transit: TRF-2026-0001',
      message: 'Stock transfer TRF-2026-0001 from Chennai to Bangalore is now in transit.',
      severity: 'INFO',
      is_read: false,
      entity_type: 'STOCK_TRANSFER',
      entity_id: '1',
      action_url: '/stock-transfers/1',
      notification_key: 'TRF_CREATE_TRF-2026-0001',
    },
  ]);
};
