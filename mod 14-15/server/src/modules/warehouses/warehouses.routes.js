const express = require('express');
const router = express.Router();
const controller = require('./warehouses.controller');
const { validate, schemas } = require('./warehouses.validator');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.get('/', authenticate, authorize('WAREHOUSE.READ'), controller.getAll);
router.get('/:id', authenticate, authorize('WAREHOUSE.READ'), controller.getById);
router.post('/', authenticate, authorize('WAREHOUSE.CREATE'), validate(schemas.createWarehouseSchema), controller.create);
router.put('/:id', authenticate, authorize('WAREHOUSE.UPDATE'), validate(schemas.updateWarehouseSchema), controller.update);
router.patch('/:id/status', authenticate, authorize('WAREHOUSE.UPDATE'), validate(schemas.updateStatusSchema), controller.updateStatus);

module.exports = router;
