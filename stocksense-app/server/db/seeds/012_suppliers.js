exports.seed = async function(knex) {
  const hasSuppliers = await knex.schema.hasTable('suppliers');
  if (!hasSuppliers) return;

  const count = await knex('suppliers').count('id as total').first();
  if (parseInt(count.total, 10) > 0) return;

  await knex('suppliers').insert([
    {
      code: 'SUP-001',
      name: 'ABC Electronics Ltd',
      email: 'sales@abcelectronics.com',
      phone: '+91 98765 43210',
      contact_person: 'Rajesh Sharma',
      address: '124 Industrial Area, Phase II',
      city: 'Bangalore',
      country: 'India',
      tax_id: 'GSTIN29ABCDE1234F1Z5',
      status: 'ACTIVE',
      notes: 'Primary IT hardware vendor',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      code: 'SUP-002',
      name: 'Global Component Supplies',
      email: 'orders@globalcomponents.com',
      phone: '+91 98765 11223',
      contact_person: 'Anita Verma',
      address: '45 Tech Park, OMR',
      city: 'Chennai',
      country: 'India',
      tax_id: 'GSTIN33XYZAB5678C1Z2',
      status: 'ACTIVE',
      notes: 'Peripherals and cabling vendor',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      code: 'SUP-003',
      name: 'Prime Distribution Logistics',
      email: 'supply@primedist.com',
      phone: '+91 98765 99887',
      contact_person: 'Vikram Patel',
      address: '78 Sector 18',
      city: 'Gurgaon',
      country: 'India',
      tax_id: 'GSTIN07QWERT9012P1Z8',
      status: 'ACTIVE',
      notes: 'Packaging and bulk supplies',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);
};
