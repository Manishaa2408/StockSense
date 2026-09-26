exports.seed = async function(knex) {
  const inventoryManagerRole = await knex('roles').where({ name: 'Inventory Manager' }).first();
  const warehouseStaffRole = await knex('roles').where({ name: 'Warehouse Staff' }).first();
  const allPermissions = await knex('permissions').select('id', 'module', 'action');

  if (!inventoryManagerRole || !warehouseStaffRole) return;

  const staffAllowed = [
    'DASHBOARD.VIEW', 'PRODUCT.READ', 'CATEGORY.READ', 'WAREHOUSE.READ', 'LOCATION.READ',
    'RECEIPT.CREATE', 'RECEIPT.READ', 'RECEIPT.UPDATE', 'RECEIPT.VALIDATE',
    'DELIVERY.CREATE', 'DELIVERY.READ', 'DELIVERY.UPDATE', 'DELIVERY.VALIDATE',
    'TRANSFER.CREATE', 'TRANSFER.READ', 'TRANSFER.UPDATE', 'TRANSFER.VALIDATE',
    'ADJUSTMENT.CREATE', 'ADJUSTMENT.READ', 'ADJUSTMENT.UPDATE',
    'PURCHASE_ORDER.CREATE', 'PURCHASE_ORDER.READ', 'PURCHASE_ORDER.UPDATE',
    'SUPPLIER.READ',
    'LEDGER.READ', 'ALERT.READ', 'NOTIFICATION.READ', 'NOTIFICATION.MANAGE', 'AUDIT.READ'
  ];

  for (const perm of allPermissions) {
    // Inventory Manager gets all
    const existsManager = await knex('role_permissions')
      .where({ role_id: inventoryManagerRole.id, permission_id: perm.id }).first();
    if (!existsManager) {
      await knex('role_permissions').insert({ role_id: inventoryManagerRole.id, permission_id: perm.id });
    }

    // Warehouse Staff gets specific
    const permString = `${perm.module}.${perm.action}`;
    if (staffAllowed.includes(permString)) {
      const existsStaff = await knex('role_permissions')
        .where({ role_id: warehouseStaffRole.id, permission_id: perm.id }).first();
      if (!existsStaff) {
        await knex('role_permissions').insert({ role_id: warehouseStaffRole.id, permission_id: perm.id });
      }
    }
  }
};
