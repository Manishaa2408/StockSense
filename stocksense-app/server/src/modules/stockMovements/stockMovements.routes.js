const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const controller = require('./stockMovements.controller');

// GET /api/v1/stock-movements
router.get('/', authenticate, authorize('LEDGER.READ'), controller.list);

// GET /api/v1/stock-movements/:id
router.get('/:id', authenticate, authorize('LEDGER.READ'), controller.detail);

module.exports = router;
