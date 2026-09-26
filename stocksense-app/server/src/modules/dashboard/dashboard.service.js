const db = require('../../config/database');

class DashboardService {
  async getStats() {
    // Basic counts
    const [{ count: products_count }] = await db('products').count({ count: '*' });
    const [{ count: warehouses_count }] = await db('warehouses').where({ status: 'ACTIVE' }).count({ count: '*' });
    const [{ count: locations_count }] = await db('locations').where({ status: 'ACTIVE' }).count({ count: '*' });
    
    // Process pending items
    const [{ count: pending_deliveries_count }] = await db('deliveries').whereIn('status', ['DRAFT', 'READY']).count({ count: '*' });
    const [{ count: pending_receipts_count }] = await db('goods_receipts').whereIn('status', ['DRAFT', 'RECEIVED']).count({ count: '*' });
    
    // Check if stock_transfers table exists before counting
    const hasTransfersTable = await db.schema.hasTable('stock_transfers');
    let pending_transfers_count = 0;
    if (hasTransfersTable) {
      const [{ count: transfers }] = await db('stock_transfers').whereIn('status', ['DRAFT', 'IN_TRANSIT']).count({ count: '*' });
      pending_transfers_count = transfers;
    }

    // Low stock count
    const [{ count: low_stock_count }] = await db('inventory')
      .join('products', 'inventory.product_id', '=', 'products.id')
      .whereRaw('(inventory.quantity - inventory.reserved_quantity) <= products.reorder_level')
      .count({ count: '*' });

    // Total inventory
    const [{ total: total_stock_qty }] = await db('inventory').sum({ total: 'quantity' });

    // Low stock items top 5
    const low_stock_items = await db('inventory')
      .join('products', 'inventory.product_id', '=', 'products.id')
      .leftJoin('categories', 'products.category_id', '=', 'categories.id')
      .join('locations', 'inventory.location_id', '=', 'locations.id')
      .join('warehouses', 'locations.warehouse_id', '=', 'warehouses.id')
      .select(
        'products.name as product_name',
        'products.sku',
        'categories.name as category_name',
        'warehouses.name as warehouse_name',
        'locations.name as location_name',
        'inventory.quantity',
        'inventory.reserved_quantity',
        db.raw('(inventory.quantity - inventory.reserved_quantity) as available_quantity'),
        'products.reorder_level'
      )
      .whereRaw('(inventory.quantity - inventory.reserved_quantity) <= products.reorder_level')
      .limit(5);

    // Recent activities (stock movements)
    let recent_activities = [];
    const hasMovementsTable = await db.schema.hasTable('stock_movements');
    if (hasMovementsTable) {
      recent_activities = await db('stock_movements')
        .join('products', 'stock_movements.product_id', '=', 'products.id')
        .select(
          'stock_movements.movement_type',
          'stock_movements.reference_type',
          'stock_movements.reference_id',
          'stock_movements.quantity',
          'products.name as product_name',
          'products.sku',
          'stock_movements.created_at'
        )
        .orderBy('stock_movements.created_at', 'desc')
        .limit(10);
    }

    return {
      stats: {
        products_count: Number(products_count || 0),
        warehouses_count: Number(warehouses_count || 0),
        locations_count: Number(locations_count || 0),
        pending_deliveries_count: Number(pending_deliveries_count || 0),
        pending_receipts_count: Number(pending_receipts_count || 0),
        pending_transfers_count: Number(pending_transfers_count || 0),
        low_stock_count: Number(low_stock_count || 0),
        total_stock_qty: Number(total_stock_qty || 0)
      },
      low_stock_items,
      recent_activities
    };
  }
}

module.exports = new DashboardService();
