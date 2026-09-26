const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

const getAll = async ({ page = 1, limit = 20, search = '', category_id, unit_id, status }) => {
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const offset = (pageNum - 1) * limitNum;

  let query = db('products')
    .leftJoin('categories', 'products.category_id', '=', 'categories.id')
    .leftJoin('units', 'products.unit_id', '=', 'units.id')
    .leftJoin('users as creator', 'products.created_by', '=', 'creator.id')
    .select(
      'products.*',
      'categories.name as category_name',
      'units.name as unit_name',
      'units.code as unit_code',
      db.raw("CONCAT(creator.first_name, ' ', creator.last_name) as creator_name")
    );

  if (search) {
    query = query.where(function() {
      this.where('products.name', 'like', `%${search}%`)
          .orWhere('products.sku', 'like', `%${search}%`);
    });
  }

  if (category_id) {
    query = query.where('products.category_id', category_id);
  }

  if (unit_id) {
    query = query.where('products.unit_id', unit_id);
  }

  if (status) {
    query = query.where('products.status', status);
  }

  // Count query
  const countQuery = db('products');
  if (search) {
    countQuery.where(function() {
      this.where('name', 'like', `%${search}%`)
          .orWhere('sku', 'like', `%${search}%`);
    });
  }
  if (category_id) countQuery.where({ category_id });
  if (unit_id) countQuery.where({ unit_id });
  if (status) countQuery.where({ status });

  const [{ count }] = await countQuery.count({ count: '*' });
  const total = parseInt(count, 10);

  const products = await query.orderBy('products.created_at', 'desc').limit(limitNum).offset(offset);

  return {
    products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

const getById = async (id) => {
  const product = await db('products')
    .leftJoin('categories', 'products.category_id', '=', 'categories.id')
    .leftJoin('units', 'products.unit_id', '=', 'units.id')
    .leftJoin('users as creator', 'products.created_by', '=', 'creator.id')
    .leftJoin('users as updater', 'products.updated_by', '=', 'updater.id')
    .select(
      'products.*',
      'categories.name as category_name',
      'units.name as unit_name',
      'units.code as unit_code',
      db.raw("CONCAT(creator.first_name, ' ', creator.last_name) as creator_name"),
      db.raw("CONCAT(updater.first_name, ' ', updater.last_name) as updater_name")
    )
    .where('products.id', id)
    .first();

  if (!product) {
    throw ApiError.notFound(errorCodes.RESOURCE_NOT_FOUND, 'Product not found');
  }

  return product;
};

const create = async (data, userId) => {
  // Check SKU uniqueness
  const existingSku = await db('products').where({ sku: data.sku }).first();
  if (existingSku) {
    throw ApiError.badRequest('SKU_ALREADY_EXISTS', 'A product with this SKU already exists');
  }

  // Check category
  const category = await db('categories').where({ id: data.category_id }).first();
  if (!category) {
    throw ApiError.badRequest('INVALID_CATEGORY', 'Selected category does not exist');
  }

  // Check unit
  const unit = await db('units').where({ id: data.unit_id }).first();
  if (!unit) {
    throw ApiError.badRequest('INVALID_UNIT', 'Selected unit of measure does not exist');
  }

  const [insertedId] = await db('products').insert({
    sku: data.sku,
    name: data.name,
    description: data.description || null,
    category_id: data.category_id,
    unit_id: data.unit_id,
    reorder_level: data.reorder_level ?? 0,
    status: 'ACTIVE',
    created_by: userId,
    updated_by: userId
  });

  return await getById(insertedId);
};

const update = async (id, data, userId) => {
  const product = await db('products').where({ id }).first();
  if (!product) {
    throw ApiError.notFound(errorCodes.RESOURCE_NOT_FOUND, 'Product not found');
  }

  if (data.sku && data.sku !== product.sku) {
    const existingSku = await db('products').where({ sku: data.sku }).whereNot({ id }).first();
    if (existingSku) {
      throw ApiError.badRequest('SKU_ALREADY_EXISTS', 'A product with this SKU already exists');
    }
  }

  if (data.category_id) {
    const category = await db('categories').where({ id: data.category_id }).first();
    if (!category) {
      throw ApiError.badRequest('INVALID_CATEGORY', 'Selected category does not exist');
    }
  }

  if (data.unit_id) {
    const unit = await db('units').where({ id: data.unit_id }).first();
    if (!unit) {
      throw ApiError.badRequest('INVALID_UNIT', 'Selected unit of measure does not exist');
    }
  }

  const updatePayload = {
    ...data,
    updated_by: userId,
    updated_at: db.fn.now()
  };

  await db('products').where({ id }).update(updatePayload);

  return await getById(id);
};

const updateStatus = async (id, status, userId) => {
  const product = await db('products').where({ id }).first();
  if (!product) {
    throw ApiError.notFound(errorCodes.RESOURCE_NOT_FOUND, 'Product not found');
  }

  await db('products').where({ id }).update({
    status,
    updated_by: userId,
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
