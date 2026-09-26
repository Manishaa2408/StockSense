const express = require('express');
const router = express.Router();
const controller = require('./units.controller');
const { createUnitSchema, validate } = require('./units.validator');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

router.get('/', controller.getAll);
router.post('/', authorize('SETTING.UPDATE'), validate(createUnitSchema), controller.create);

module.exports = router;
