const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  const usersExist = await knex('users').first();
  if (usersExist) return;

  const adminRole = await knex('roles').where({ name: 'Inventory Manager' }).first();
  if (!adminRole) return;

  const salt = await bcrypt.genSalt(12);
  const password_hash = await bcrypt.hash('Admin@123', salt);

  await knex('users').insert({
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@stocksense.com',
    password_hash,
    role_id: adminRole.id,
    status: 'ACTIVE',
    email_verified: true
  });
};
