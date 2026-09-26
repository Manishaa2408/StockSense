const express = require('express');
const router = express.Router();
const controller = require('./products.controller');
const { createProductSchema, updateProductSchema, updateStatusSchema, validate } = require('./products.validator');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

router.get('/', authorize('PRODUCT.READ'), controller.getAll);
router.get('/:id', authorize('PRODUCT.READ'), controller.getById);
router.post('/', authorize('PRODUCT.CREATE'), validate(createProductSchema), controller.create);
router.put('/:id', authorize('PRODUCT.UPDATE'), validate(updateProductSchema), controller.update);
router.patch('/:id/status', authorize('PRODUCT.UPDATE'), validate(updateStatusSchema), controller.updateStatus);

module.exports = router;
