const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const dashboardController = require('./dashboard.controller');

router.use(authenticate);

router.get('/stats', dashboardController.getStats);

module.exports = router;
