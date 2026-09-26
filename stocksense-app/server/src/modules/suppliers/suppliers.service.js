const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');

const getAll = async (query = {}) => {
  const base = db('suppliers');
  if (query.status) base.where('status', query.status);
  if (query.search) {
    const s = `%${query.search.trim()}%`;
    base.where(function() {
      this.where('name', 'like', s)
        .orWhere('code', 'like', s)
        .orWhere('email', 'like', s)
        .orWhere('contact_person', 'like', s);
    });
  }
  return await base.orderBy('name', 'asc');
};

const getById = async (id) => {
  const supplier = await db('suppliers').where({ id }).first();
  if (!supplier) throw ApiError.notFound('SUPPLIER_NOT_FOUND', 'Supplier not found');
  return supplier;
};

const create = async (data) => {
  const [id] = await db('suppliers').insert({
    code: data.code || `SUP-${Date.now().toString().slice(-4)}`,
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    contact_person: data.contact_person || null,
    address: data.address || null,
    city: data.city || null,
    country: data.country || 'India',
    tax_id: data.tax_id || null,
    status: data.status || 'ACTIVE',
    notes: data.notes || null,
    created_at: db.fn.now(),
    updated_at: db.fn.now()
  });
  return await db('suppliers').where({ id }).first();
};

module.exports = { getAll, getById, create };
