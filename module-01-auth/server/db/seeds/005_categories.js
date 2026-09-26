exports.seed = async function(knex) {
  const existing = await knex('categories').select('id');
  if (existing.length > 0) return;

  await knex('categories').insert([
    { id: 1, name: 'Electronics', description: 'Computers, gadgets and electronic components', status: 'ACTIVE' },
    { id: 2, name: 'Raw Materials', description: 'Raw materials for production and manufacturing', status: 'ACTIVE' },
    { id: 3, name: 'Office Supplies', description: 'Stationery and daily office supplies', status: 'ACTIVE' },
    { id: 4, name: 'Packaging', description: 'Boxes, tape, and protective shipping materials', status: 'ACTIVE' },
    { id: 5, name: 'Hardware', description: 'Tools, fasteners, bolts, and hardware components', status: 'ACTIVE' }
  ]);
};
