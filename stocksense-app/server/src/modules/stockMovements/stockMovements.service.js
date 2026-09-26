const db = require('../../config/database');
const logger = require('../../utils/logger');

const MOVEMENT_TYPES = ['IN', 'OUT', 'TRANSFER_OUT', 'TRANSFER_IN', 'ADJUSTMENT_INCREASE', 'ADJUSTMENT_DECREASE', 'RETURN'];

// ─── List with filters & pagination ──────────────────────────────────────────

const getAll = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;

  const base = db('stock_movements as sm')
    .leftJoin('users as performer', 'sm.performed_by', 'performer.id')
    .leftJoin('products as prod', 'sm.product_id', 'prod.id')
    .leftJoin('locations as src_loc', 'sm.source_location_id', 'src_loc.id')
    .leftJoin('locations as dst_loc', 'sm.destination_location_id', 'dst_loc.id');

  if (query.product_id) base.where('sm.product_id', query.product_id);
  if (query.location_id) base.where('sm.location_id', query.location_id);
  if (query.movement_type) base.where('sm.movement_type', query.movement_type);
  if (query.reference_type) base.where('sm.reference_type', query.reference_type);
  if (query.reference_number) base.where('sm.reference_number', 'like', `%${query.reference_number}%`);
  if (query.performed_by) base.where('sm.performed_by', query.performed_by);
  if (query.from) base.where('sm.created_at', '>=', `${query.from} 00:00:00`);
  if (query.to) base.where('sm.created_at', '<=', `${query.to} 23:59:59`);

  const countRow = await base.clone().count('sm.id as total').first();
  const total = parseInt(countRow.total, 10) || 0;

  const movements = await base.clone()
    .select(
      'sm.id', 'sm.product_id',
      'sm.source_location_id', 'sm.destination_location_id',
      'sm.movement_type', 'sm.quantity',
      'sm.reference_type', 'sm.reference_id',
      'sm.performed_by', 'sm.created_at',
      'prod.name as product_name', 'prod.sku as product_sku',
      'src_loc.name as source_location_name',
      'dst_loc.name as destination_location_name',
      'performer.first_name as performer_first_name',
      'performer.last_name as performer_last_name',
      'performer.email as performer_email'
    )
    .orderBy('sm.id', 'desc')
    .limit(limit)
    .offset(offset);

  return {
    movements,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};

// ─── Detail ───────────────────────────────────────────────────────────────────

const getById = async (id) => {
  const movement = await db('stock_movements as sm')
    .leftJoin('users as performer', 'sm.performed_by', 'performer.id')
    .leftJoin('products as prod', 'sm.product_id', 'prod.id')
    .leftJoin('locations as src_loc', 'sm.source_location_id', 'src_loc.id')
    .leftJoin('locations as dst_loc', 'sm.destination_location_id', 'dst_loc.id')
    .where('sm.id', id)
    .select(
      'sm.*',
      'prod.name as product_name', 'prod.sku as product_sku',
      'src_loc.name as source_location_name',
      'dst_loc.name as destination_location_name',
      'performer.first_name as performer_first_name',
      'performer.last_name as performer_last_name',
      'performer.email as performer_email'
    )
    .first();

  if (!movement) {
    const { ApiError } = require('../../utils/ApiError');
    const errorCodes = require('../../constants/errorCodes');
    throw require('../../utils/ApiError').notFound('MOVEMENT_NOT_FOUND', 'Stock movement not found');
  }
  return movement;
};

module.exports = { getAll, getById, MOVEMENT_TYPES };
