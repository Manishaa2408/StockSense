exports.seed = async function(knex) {
  const roles = [
    { name: 'Inventory Manager', description: 'Full access to all inventory management features' },
    { name: 'Warehouse Staff', description: 'Operational warehouse activities and daily tasks' }
  ];

  for (const role of roles) {
    const exists = await knex('roles').where('name', role.name).first();
    if (!exists) {
      await knex('roles').insert(role);
    }
  }
};
