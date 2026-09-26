exports.seed = async function(knex) {
  const existing = await knex('units').select('id');
  if (existing.length > 0) return;

  await knex('units').insert([
    { id: 1, name: 'Pieces', code: 'PCS', description: 'Individual standalone units', status: 'ACTIVE' },
    { id: 2, name: 'Kilograms', code: 'KG', description: 'Weight in kilograms', status: 'ACTIVE' },
    { id: 3, name: 'Liters', code: 'L', description: 'Volume in liters', status: 'ACTIVE' },
    { id: 4, name: 'Box', code: 'BOX', description: 'Standard box packaging unit', status: 'ACTIVE' },
    { id: 5, name: 'Meters', code: 'M', description: 'Length measurement in meters', status: 'ACTIVE' }
  ]);
};
