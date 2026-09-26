exports.seed = async function(knex) {
  const existing = await knex('units').select('id');
  if (existing.length > 0) {
    // Update unit_type on existing units if needed
    await knex('units').where({ code: 'PCS' }).update({ unit_type: 'Count' });
    await knex('units').where({ code: 'KG' }).update({ unit_type: 'Weight' });
    await knex('units').where({ code: 'L' }).update({ unit_type: 'Volume' });
    await knex('units').where({ code: 'BOX' }).update({ unit_type: 'Packaging' });
    await knex('units').where({ code: 'M' }).update({ unit_type: 'Length' });
    return;
  }

  await knex('units').insert([
    { id: 1, name: 'Pieces', code: 'PCS', unit_type: 'Count', description: 'Individual standalone units', status: 'ACTIVE' },
    { id: 2, name: 'Kilograms', code: 'KG', unit_type: 'Weight', description: 'Weight in kilograms', status: 'ACTIVE' },
    { id: 3, name: 'Grams', code: 'G', unit_type: 'Weight', description: 'Weight in grams', status: 'ACTIVE' },
    { id: 4, name: 'Liters', code: 'L', unit_type: 'Volume', description: 'Volume in liters', status: 'ACTIVE' },
    { id: 5, name: 'Milliliters', code: 'ML', unit_type: 'Volume', description: 'Volume in milliliters', status: 'ACTIVE' },
    { id: 6, name: 'Box', code: 'BOX', unit_type: 'Packaging', description: 'Standard box packaging unit', status: 'ACTIVE' },
    { id: 7, name: 'Meters', code: 'M', unit_type: 'Length', description: 'Length measurement in meters', status: 'ACTIVE' }
  ]);
};
