const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { validateCreate, validateUpdate, validateCancel } = require('./adjustments.validator');
const controller = require('./adjustments.controller');

// GET /api/v1/adjustments
router.get('/', authenticate, authorize('ADJUSTMENT.READ'), controller.list);

// GET /api/v1/adjustments/master-data
router.get('/master-data', authenticate, authorize('ADJUSTMENT.READ'), controller.masterData);

// GET /api/v1/adjustments/:id
router.get('/:id', authenticate, authorize('ADJUSTMENT.READ'), controller.detail);

// POST /api/v1/adjustments
router.post('/', authenticate, authorize('ADJUSTMENT.CREATE'), validateCreate, controller.create);

// PUT /api/v1/adjustments/:id
router.put('/:id', authenticate, authorize('ADJUSTMENT.UPDATE'), validateUpdate, controller.update);

// POST /api/v1/adjustments/:id/approve
router.post('/:id/approve', authenticate, authorize('ADJUSTMENT.APPROVE'), controller.approve);

// POST /api/v1/adjustments/:id/complete
router.post('/:id/complete', authenticate, authorize('ADJUSTMENT.COMPLETE'), controller.complete);

// POST /api/v1/adjustments/:id/cancel
router.post('/:id/cancel', authenticate, authorize('ADJUSTMENT.CANCEL'), validateCancel, controller.cancel);

module.exports = router;
