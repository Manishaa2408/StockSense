const express = require('express');
const router = express.Router();
const controller = require('./units.controller');
const { createUnitSchema, updateUnitSchema, updateStatusSchema, validate } = require('./units.validator');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

router.get('/', authorize('CATEGORY.READ'), controller.getAll);
router.get('/:id', authorize('CATEGORY.READ'), controller.getById);
router.post('/', authorize('CATEGORY.CREATE'), validate(createUnitSchema), controller.create);
router.put('/:id', authorize('CATEGORY.UPDATE'), validate(updateUnitSchema), controller.update);
router.patch('/:id/status', authorize('CATEGORY.UPDATE'), validate(updateStatusSchema), controller.updateStatus);

module.exports = router;
