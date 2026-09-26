exports.seed = async function(knex) {
  const modules = {
    DASHBOARD: ['VIEW'],
    PRODUCT: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    CATEGORY: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    WAREHOUSE: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    LOCATION: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    RECEIPT: ['CREATE', 'READ', 'UPDATE', 'VALIDATE', 'DELETE'],
    DELIVERY: ['CREATE', 'READ', 'UPDATE', 'VALIDATE', 'DELETE'],
    TRANSFER: ['CREATE', 'READ', 'UPDATE', 'VALIDATE', 'DELETE'],
    ADJUSTMENT: ['CREATE', 'READ', 'UPDATE', 'APPROVE', 'COMPLETE', 'CANCEL', 'DELETE'],
    PURCHASE_ORDER: ['CREATE', 'READ', 'UPDATE', 'CONFIRM', 'CANCEL', 'DELETE'],
    SUPPLIER: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
    LEDGER: ['READ'],
    ALERT: ['READ', 'MANAGE'],
    USER: ['CREATE', 'READ', 'UPDATE', 'MANAGE'],
    SETTING: ['READ', 'UPDATE'],
    AUDIT: ['READ'],
    NOTIFICATION: ['READ', 'MANAGE']
  };

  const permissionsToInsert = [];

  for (const [mod, actions] of Object.entries(modules)) {
    for (const action of actions) {
      permissionsToInsert.push({
        module: mod,
        action: action,
        description: `${action} operations for ${mod}`.toLowerCase()
      });
    }
  }

  for (const perm of permissionsToInsert) {
    const exists = await knex('permissions')
      .where({ module: perm.module, action: perm.action })
      .first();
    if (!exists) {
      await knex('permissions').insert(perm);
    }
  }
};
