const express = require('express');
const inventoryController = require('./inventory.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { validate, schemas } = require('./inventory.validator');

const router = express.Router();

router.get('/', authenticate, authorize('PRODUCT.READ'), validate(schemas.stockQuerySchema), inventoryController.getAll);
router.get('/summary', authenticate, authorize('PRODUCT.READ'), inventoryController.getStockSummary);
router.get('/:id', authenticate, authorize('PRODUCT.READ'), inventoryController.getById);

router.post('/increase', authenticate, authorize('PRODUCT.UPDATE'), validate(schemas.increaseStockSchema), inventoryController.increaseStock);
router.post('/decrease', authenticate, authorize('PRODUCT.UPDATE'), validate(schemas.decreaseStockSchema), inventoryController.decreaseStock);

module.exports = router;
