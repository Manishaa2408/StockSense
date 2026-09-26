const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

const getAll = async () => {
  return await db('units').select('*').orderBy('name', 'asc');
};

const create = async (data) => {
  const existing = await db('units').where({ code: data.code }).first();
  if (existing) {
    throw ApiError.badRequest(errorCodes.VALIDATION_ERROR, 'A unit with this code already exists');
  }

  const [insertedId] = await db('units').insert({
    name: data.name,
    code: data.code,
    description: data.description || null,
    status: 'ACTIVE'
  });

  return await db('units').where({ id: insertedId }).first();
};

module.exports = {
  getAll,
  create
};
