const express = require('express');
const authenticate = require('../../middleware/authenticate');
const controller = require('./roles.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.get('/:id/permissions', controller.getPermissions);

module.exports = router;
