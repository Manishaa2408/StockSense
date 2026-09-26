const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { validateCreate, validateUpdate, validateReceive } = require('./purchaseOrders.validator');
const controller = require('./purchaseOrders.controller');

// Master data
router.get('/master-data', authenticate, authorize('PURCHASE_ORDER.READ'), controller.masterData);

// List POs
router.get('/', authenticate, authorize('PURCHASE_ORDER.READ'), controller.list);

// Get PO detail
router.get('/:id', authenticate, authorize('PURCHASE_ORDER.READ'), controller.detail);

// Create DRAFT PO
router.post('/', authenticate, authorize('PURCHASE_ORDER.CREATE'), validateCreate, controller.create);

// Update DRAFT PO
router.put('/:id', authenticate, authorize('PURCHASE_ORDER.UPDATE'), validateUpdate, controller.update);

// Confirm PO (DRAFT -> CONFIRMED)
router.post('/:id/confirm', authenticate, authorize('PURCHASE_ORDER.CONFIRM'), controller.confirm);

// Receive Goods against PO
router.post('/:id/receive', authenticate, authorize('PURCHASE_ORDER.UPDATE'), validateReceive, controller.receive);

// Cancel PO
router.post('/:id/cancel', authenticate, authorize('PURCHASE_ORDER.CANCEL'), controller.cancel);

module.exports = router;
