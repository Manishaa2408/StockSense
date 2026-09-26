const db = require('../../config/database');
const ApiError = require('../../utils/ApiError');
const errorCodes = require('../../constants/errorCodes');

class LocationsService {
  async getAll({ search, status, warehouse_id }) {
    const query = db('locations as l')
      .join('warehouses as w', 'l.warehouse_id', 'w.id')
      .select(
        'l.*',
        'w.name as warehouse_name',
        'w.code as warehouse_code'
      )
      .orderBy('w.name', 'asc')
      .orderBy('l.code', 'asc');

    if (warehouse_id) {
      query.where('l.warehouse_id', warehouse_id);
    }

    if (search) {
      query.where(function() {
        this.where('l.name', 'like', `%${search}%`)
            .orWhere('l.code', 'like', `%${search}%`);
      });
    }

    if (status) {
      query.where('l.status', status);
    }

    return await query;
  }

  async getById(id) {
    const location = await db('locations as l')
      .join('warehouses as w', 'l.warehouse_id', 'w.id')
      .select(
        'l.*',
        'w.name as warehouse_name',
        'w.code as warehouse_code'
      )
      .where('l.id', id)
      .first();
    
    if (!location) {
      throw new ApiError(errorCodes.RESOURCE_NOT_FOUND, 'Location not found');
    }

    return location;
  }

  async create(data) {
    const warehouse = await db('warehouses').where({ id: data.warehouse_id }).first();
    if (!warehouse) {
      throw new ApiError(errorCodes.RESOURCE_NOT_FOUND, 'Warehouse not found');
    }
    if (warehouse.status !== 'ACTIVE') {
      throw new ApiError(errorCodes.BUSINESS_RULE_VIOLATION, 'Cannot add location to an inactive warehouse');
    }

    const existingCode = await db('locations')
      .where({ warehouse_id: data.warehouse_id })
      .andWhereRaw('LOWER(code) = ?', [data.code.toLowerCase()])
      .first();

    if (existingCode) {
      throw new ApiError(errorCodes.RESOURCE_ALREADY_EXISTS, 'Location with this code already exists in the selected warehouse');
    }

    const [id] = await db('locations').insert(data);
    return this.getById(id);
  }

  async update(id, data) {
    const location = await db('locations').where({ id }).first();
    if (!location) {
      throw new ApiError(errorCodes.RESOURCE_NOT_FOUND, 'Location not found');
    }

    let warehouseId = location.warehouse_id;

    if (data.warehouse_id && data.warehouse_id !== location.warehouse_id) {
      const warehouse = await db('warehouses').where({ id: data.warehouse_id }).first();
      if (!warehouse) {
        throw new ApiError(errorCodes.RESOURCE_NOT_FOUND, 'Warehouse not found');
      }
      if (warehouse.status !== 'ACTIVE') {
        throw new ApiError(errorCodes.BUSINESS_RULE_VIOLATION, 'Cannot move location to an inactive warehouse');
      }
      warehouseId = data.warehouse_id;
    }

    const newCode = data.code || location.code;

    if ((data.code && data.code.toLowerCase() !== location.code.toLowerCase()) || 
        (data.warehouse_id && data.warehouse_id !== location.warehouse_id)) {
      
      const existingCode = await db('locations')
        .where({ warehouse_id: warehouseId })
        .andWhereRaw('LOWER(code) = ?', [newCode.toLowerCase()])
        .andWhereNot('id', id)
        .first();

      if (existingCode) {
        throw new ApiError(errorCodes.RESOURCE_ALREADY_EXISTS, 'Location with this code already exists in the selected warehouse');
      }
    }

    await db('locations')
      .where({ id })
      .update({
        ...data,
        updated_at: db.fn.now()
      });

    return this.getById(id);
  }

  async updateStatus(id, status) {
    const location = await db('locations').where({ id }).first();
    if (!location) {
      throw new ApiError(errorCodes.RESOURCE_NOT_FOUND, 'Location not found');
    }

    await db('locations')
      .where({ id })
      .update({ 
        status,
        updated_at: db.fn.now()
      });

    return this.getById(id);
  }
}

module.exports = new LocationsService();
