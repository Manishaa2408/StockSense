/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  const suppliers = [
    { code: 'SUP-001', name: 'ABC Electronics Pvt Ltd', contact_person: 'Rahul Sharma', email: 'sales@abcelectronics.com', phone: '+91 98765 43210', address: 'Plot 45, Electronics City, Bangalore 560100', status: 'ACTIVE' },
    { code: 'SUP-002', name: 'Global Logistics & Packaging', contact_person: 'Priya Sundaram', email: 'orders@globallogistics.in', phone: '+91 98123 45678', address: '78 Port Road, Chennai 600001', status: 'ACTIVE' },
    { code: 'SUP-003', name: 'Apex Industrial Fasteners', contact_person: 'Amit Patel', email: 'contact@apexfasteners.com', phone: '+91 97111 22233', address: '12 Industrial Estate, Mumbai 400015', status: 'ACTIVE' }
  ];

  for (const supplier of suppliers) {
    const exists = await knex('suppliers').where('code', supplier.code).first();
    if (!exists) {
      await knex('suppliers').insert(supplier);
    }
  }
};
