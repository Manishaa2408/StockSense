const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

const getAll = async () => {
  return await db('categories').select('*').orderBy('name', 'asc');
};

const create = async (data) => {
  const existing = await db('categories').where({ name: data.name }).first();
  if (existing) {
    throw ApiError.badRequest(errorCodes.VALIDATION_ERROR, 'A category with this name already exists');
  }

  const [insertedId] = await db('categories').insert({
    name: data.name,
    description: data.description || null,
    status: 'ACTIVE'
  });

  return await db('categories').where({ id: insertedId }).first();
};

module.exports = {
  getAll,
  create
};
