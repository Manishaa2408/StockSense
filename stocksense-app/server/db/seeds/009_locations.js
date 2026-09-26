/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  const locationsData = {
    'CHN-WH-01': [
      { name: 'Aisle A - Rack 1', code: 'A-01', description: 'First rack in Aisle A' },
      { name: 'Aisle A - Rack 2', code: 'A-02', description: 'Second rack in Aisle A' },
      { name: 'Aisle B - Rack 1', code: 'B-01', description: 'First rack in Aisle B' },
      { name: 'Cold Storage Zone', code: 'COLD-01', description: 'Temperature-controlled storage' }
    ],
    'BLR-WH-01': [
      { name: 'Zone 1 - Shelf A', code: 'Z1-A', description: 'Zone 1 shelf section A' },
      { name: 'Zone 1 - Shelf B', code: 'Z1-B', description: 'Zone 1 shelf section B' },
      { name: 'Zone 2 - Bulk Storage', code: 'Z2-BULK', description: 'Bulk item storage area' }
    ],
    'MUM-WH-01': [
      { name: 'Dock Area 1', code: 'DOCK-01', description: 'Primary dock loading area' },
      { name: 'Dock Area 2', code: 'DOCK-02', description: 'Secondary dock loading area' }
    ]
  };

  for (const [warehouseCode, locations] of Object.entries(locationsData)) {
    const warehouse = await knex('warehouses').where({ code: warehouseCode }).first();
    if (warehouse) {
      for (const loc of locations) {
        const existing = await knex('locations')
          .where({ warehouse_id: warehouse.id, code: loc.code })
          .first();
        if (!existing) {
          await knex('locations').insert({
            ...loc,
            warehouse_id: warehouse.id,
            status: 'ACTIVE'
          });
        }
      }
    }
  }
};
