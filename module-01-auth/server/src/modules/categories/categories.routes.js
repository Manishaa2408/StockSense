const express = require('express');
const router = express.Router();
const controller = require('./categories.controller');
const { createCategorySchema, validate } = require('./categories.validator');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.use(authenticate);

router.get('/', controller.getAll);
router.post('/', authorize('CATEGORY.CREATE'), validate(createCategorySchema), controller.create);

module.exports = router;
