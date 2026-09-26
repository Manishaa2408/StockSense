const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

const getAll = async ({ search = '', unit_type, status } = {}) => {
  let query = db('units').select('*');

  if (search) {
    query = query.where(function() {
      this.where('name', 'like', `%${search}%`)
          .orWhere('code', 'like', `%${search}%`);
    });
  }

  if (unit_type) {
    query = query.where({ unit_type });
  }

  if (status) {
    query = query.where({ status });
  }

  return await query.orderBy('name', 'asc');
};

const getById = async (id) => {
  const unit = await db('units').where({ id }).first();
  if (!unit) {
    throw ApiError.notFound(errorCodes.RESOURCE_NOT_FOUND, 'Unit of measure not found');
  }

  const productCount = await db('products').where('unit_id', id).count({ count: '*' });

  return {
    ...unit,
    product_count: parseInt(productCount[0].count, 10) || 0
  };
};

const create = async (data) => {
  const existingCode = await db('units').whereRaw('LOWER(code) = ?', [data.code.toLowerCase()]).first();
  if (existingCode) {
    throw ApiError.badRequest(errorCodes.VALIDATION_ERROR, 'A unit with this code/symbol already exists');
  }

  const [insertedId] = await db('units').insert({
    name: data.name,
    code: data.code,
    unit_type: data.unit_type || 'Count',
    description: data.description || null,
    status: 'ACTIVE'
  });

  return await getById(insertedId);
};

const update = async (id, data) => {
  const unit = await db('units').where({ id }).first();
  if (!unit) {
    throw ApiError.notFound(errorCodes.RESOURCE_NOT_FOUND, 'Unit of measure not found');
  }

  if (data.code && data.code.toLowerCase() !== unit.code.toLowerCase()) {
    const existingCode = await db('units')
      .whereRaw('LOWER(code) = ?', [data.code.toLowerCase()])
      .whereNot({ id })
      .first();
    if (existingCode) {
      throw ApiError.badRequest(errorCodes.VALIDATION_ERROR, 'A unit with this code/symbol already exists');
    }
  }

  await db('units').where({ id }).update({
    name: data.name || unit.name,
    code: data.code || unit.code,
    unit_type: data.unit_type || unit.unit_type,
    description: data.description !== undefined ? data.description : unit.description,
    updated_at: db.fn.now()
  });

  return await getById(id);
};

const updateStatus = async (id, status) => {
  const unit = await db('units').where({ id }).first();
  if (!unit) {
    throw ApiError.notFound(errorCodes.RESOURCE_NOT_FOUND, 'Unit of measure not found');
  }

  await db('units').where({ id }).update({
    status,
    updated_at: db.fn.now()
  });

  return await getById(id);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  updateStatus
};
