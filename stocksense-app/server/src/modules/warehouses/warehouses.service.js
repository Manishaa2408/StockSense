const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

class WarehousesService {
  async getAll({ search, status }) {
    const query = db('warehouses').select('*').orderBy('name', 'asc');

    if (search) {
      query.where(function() {
        this.where('name', 'like', `%${search}%`)
            .orWhere('code', 'like', `%${search}%`);
      });
    }

    if (status) {
      query.where('status', status);
    }

    return await query;
  }

  async getById(id) {
    const warehouse = await db('warehouses').where({ id }).first();
    
    if (!warehouse) {
      throw new ApiError(errorCodes.RESOURCE_NOT_FOUND, 'Warehouse not found');
    }

    const { count } = await db('locations')
      .where({ warehouse_id: id })
      .count('* as count')
      .first();

    return { ...warehouse, location_count: parseInt(count, 10) };
  }

  async create(data) {
    const existingCode = await db('warehouses')
      .whereRaw('LOWER(code) = ?', [data.code.toLowerCase()])
      .first();

    if (existingCode) {
      throw new ApiError(errorCodes.RESOURCE_ALREADY_EXISTS, 'Warehouse with this code already exists');
    }

    const [id] = await db('warehouses').insert(data);
    return this.getById(id);
  }

  async update(id, data) {
    const warehouse = await db('warehouses').where({ id }).first();
    if (!warehouse) {
      throw new ApiError(errorCodes.RESOURCE_NOT_FOUND, 'Warehouse not found');
    }

    if (data.code && data.code.toLowerCase() !== warehouse.code.toLowerCase()) {
      const existingCode = await db('warehouses')
        .whereRaw('LOWER(code) = ?', [data.code.toLowerCase()])
        .first();

      if (existingCode) {
        throw new ApiError(errorCodes.RESOURCE_ALREADY_EXISTS, 'Warehouse with this code already exists');
      }
    }

    await db('warehouses')
      .where({ id })
      .update({
        ...data,
        updated_at: db.fn.now()
      });

    return this.getById(id);
  }

  async updateStatus(id, status) {
    const warehouse = await db('warehouses').where({ id }).first();
    if (!warehouse) {
      throw new ApiError(errorCodes.RESOURCE_NOT_FOUND, 'Warehouse not found');
    }

    if (status === 'INACTIVE') {
      const activeLocations = await db('locations')
        .where({ warehouse_id: id, status: 'ACTIVE' })
        .first();
        
      if (activeLocations) {
        throw new ApiError(errorCodes.BUSINESS_RULE_VIOLATION, 'Cannot deactivate warehouse with active locations');
      }
    }

    await db('warehouses')
      .where({ id })
      .update({ 
        status,
        updated_at: db.fn.now()
      });

    return this.getById(id);
  }
}

module.exports = new WarehousesService();
