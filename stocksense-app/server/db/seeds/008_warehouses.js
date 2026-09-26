/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  const warehouses = [
    { name: 'Chennai Central Warehouse', code: 'CHN-WH-01', address: '123 Industrial Area, Chennai, Tamil Nadu 600001', description: 'Main Chennai storage facility', status: 'ACTIVE' },
    { name: 'Bangalore Distribution Center', code: 'BLR-WH-01', address: '456 Tech Park Road, Bangalore, Karnataka 560001', description: 'Bangalore distribution hub', status: 'ACTIVE' },
    { name: 'Mumbai Warehouse', code: 'MUM-WH-01', address: '789 Dock Area, Mumbai, Maharashtra 400001', description: 'Mumbai port-side warehouse', status: 'ACTIVE' }
  ];

  for (const warehouse of warehouses) {
    const existing = await knex('warehouses').where({ code: warehouse.code }).first();
    if (!existing) {
      await knex('warehouses').insert(warehouse);
    }
  }
};
