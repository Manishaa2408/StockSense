exports.seed = async function(knex) {
  const existing = await knex('categories').select('id');
  if (existing.length > 0) {
    // Update existing categories if parent_id is missing
    await knex('categories').where({ id: 1 }).update({ parent_id: null });
    await knex('categories').where({ id: 2 }).update({ parent_id: null });
    await knex('categories').where({ id: 3 }).update({ parent_id: null });
    await knex('categories').where({ id: 4 }).update({ parent_id: null });
    await knex('categories').where({ id: 5 }).update({ parent_id: null });
    return;
  }

  await knex('categories').insert([
    { id: 1, name: 'Electronics', description: 'Computers, gadgets and electronic components', parent_id: null, status: 'ACTIVE' },
    { id: 2, name: 'Computers', description: 'Desktop and portable computer systems', parent_id: 1, status: 'ACTIVE' },
    { id: 3, name: 'Laptops', description: 'Portable laptop computers', parent_id: 2, status: 'ACTIVE' },
    { id: 4, name: 'Monitors & Displays', description: 'Computer monitors and visual display panels', parent_id: 1, status: 'ACTIVE' },
    { id: 5, name: 'Office Supplies', description: 'Stationery and daily office supplies', parent_id: null, status: 'ACTIVE' },
    { id: 6, name: 'Packaging', description: 'Boxes, tape, and protective shipping materials', parent_id: null, status: 'ACTIVE' },
    { id: 7, name: 'Hardware', description: 'Tools, fasteners, bolts, and hardware components', parent_id: null, status: 'ACTIVE' }
  ]);
};
