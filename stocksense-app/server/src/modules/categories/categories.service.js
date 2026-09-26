const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

const getAll = async ({ search = '', status } = {}) => {
  let query = db('categories as c')
    .leftJoin('categories as parent', 'c.parent_id', '=', 'parent.id')
    .select(
      'c.*',
      'parent.name as parent_name'
    );

  if (search) {
    query = query.where('c.name', 'like', `%${search}%`);
  }

  if (status) {
    query = query.where('c.status', status);
  }

  return await query.orderBy('c.name', 'asc');
};

const getById = async (id) => {
  const category = await db('categories as c')
    .leftJoin('categories as parent', 'c.parent_id', '=', 'parent.id')
    .select('c.*', 'parent.name as parent_name')
    .where('c.id', id)
    .first();

  if (!category) {
    throw ApiError.notFound(errorCodes.RESOURCE_NOT_FOUND, 'Category not found');
  }

  const subCategories = await db('categories')
    .where('parent_id', id)
    .select('id', 'name', 'status');

  const productCount = await db('products')
    .where('category_id', id)
    .count({ count: '*' });

  return {
    ...category,
    sub_categories: subCategories,
    product_count: parseInt(productCount[0].count, 10) || 0
  };
};

// Helper: check if targetParentId is a descendant of categoryId (prevents circular loops)
const isDescendant = async (categoryId, targetParentId) => {
  let curr = targetParentId;
  while (curr) {
    if (parseInt(curr, 10) === parseInt(categoryId, 10)) {
      return true;
    }
    const node = await db('categories').where({ id: curr }).select('parent_id').first();
    if (!node || !node.parent_id) break;
    curr = node.parent_id;
  }
  return false;
};

const create = async (data) => {
  const existing = await db('categories').whereRaw('LOWER(name) = ?', [data.name.toLowerCase()]).first();
  if (existing) {
    throw ApiError.badRequest(errorCodes.VALIDATION_ERROR, 'A category with this name already exists');
  }

  const parentId = data.parent_id ? parseInt(data.parent_id, 10) : null;
  if (parentId) {
    const parent = await db('categories').where({ id: parentId }).first();
    if (!parent) {
      throw ApiError.badRequest(errorCodes.VALIDATION_ERROR, 'Selected parent category does not exist');
    }
  }

  const [insertedId] = await db('categories').insert({
    name: data.name,
    description: data.description || null,
    parent_id: parentId,
    status: 'ACTIVE'
  });

  return await getById(insertedId);
};

const update = async (id, data) => {
  const category = await db('categories').where({ id }).first();
  if (!category) {
    throw ApiError.notFound(errorCodes.RESOURCE_NOT_FOUND, 'Category not found');
  }

  if (data.name && data.name.toLowerCase() !== category.name.toLowerCase()) {
    const existing = await db('categories')
      .whereRaw('LOWER(name) = ?', [data.name.toLowerCase()])
      .whereNot({ id })
      .first();
    if (existing) {
      throw ApiError.badRequest(errorCodes.VALIDATION_ERROR, 'A category with this name already exists');
    }
  }

  let parentId = category.parent_id;
  if (data.parent_id !== undefined) {
    parentId = data.parent_id ? parseInt(data.parent_id, 10) : null;
    if (parentId) {
      if (parentId === parseInt(id, 10)) {
        throw ApiError.badRequest(errorCodes.VALIDATION_ERROR, 'A category cannot be its own parent');
      }
      const parent = await db('categories').where({ id: parentId }).first();
      if (!parent) {
        throw ApiError.badRequest(errorCodes.VALIDATION_ERROR, 'Selected parent category does not exist');
      }
      const circular = await isDescendant(id, parentId);
      if (circular) {
        throw ApiError.badRequest(errorCodes.VALIDATION_ERROR, 'Circular category relationship detected');
      }
    }
  }

  await db('categories').where({ id }).update({
    name: data.name || category.name,
    description: data.description !== undefined ? data.description : category.description,
    parent_id: parentId,
    updated_at: db.fn.now()
  });

  return await getById(id);
};

const updateStatus = async (id, status) => {
  const category = await db('categories').where({ id }).first();
  if (!category) {
    throw ApiError.notFound(errorCodes.RESOURCE_NOT_FOUND, 'Category not found');
  }

  if (status === 'INACTIVE') {
    // Check active subcategories
    const activeSub = await db('categories').where({ parent_id: id, status: 'ACTIVE' }).first();
    if (activeSub) {
      throw ApiError.badRequest(errorCodes.VALIDATION_ERROR, 'Cannot deactivate category that has active sub-categories');
    }
  }

  await db('categories').where({ id }).update({
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
