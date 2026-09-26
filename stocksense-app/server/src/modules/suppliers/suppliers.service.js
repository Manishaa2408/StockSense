const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

class SuppliersService {
  async getAll({ search = '', status } = {}) {
    const query = db('suppliers').select('*');

    if (search) {
      query.where(function() {
        this.where('code', 'like', `%${search}%`)
          .orWhere('name', 'like', `%${search}%`)
          .orWhere('contact_person', 'like', `%${search}%`);
      });
    }

    if (status) {
      query.where('status', status);
    }

    query.orderBy('name', 'asc');

    return await query;
  }

  async getById(id) {
    const supplier = await db('suppliers').where({ id }).first();
    if (!supplier) {
      throw new ApiError(404, errorCodes.RESOURCE_NOT_FOUND, 'Supplier not found');
    }
    return supplier;
  }

  async create(data) {
    const existing = await db('suppliers').where({ code: data.code }).first();
    if (existing) {
      throw new ApiError(400, errorCodes.VALIDATION_ERROR, 'A supplier with this code already exists');
    }

    const [id] = await db('suppliers').insert(data);
    return await this.getById(id);
  }

  async update(id, data) {
    await this.getById(id); // Ensure exists

    const updateData = {
      ...data,
      updated_at: db.fn.now()
    };

    await db('suppliers').where({ id }).update(updateData);
    return await this.getById(id);
  }

  async updateStatus(id, status) {
    await this.getById(id); // Ensure exists
    
    await db('suppliers').where({ id }).update({
      status,
      updated_at: db.fn.now()
    });

    return await this.getById(id);
  }
}

module.exports = new SuppliersService();
