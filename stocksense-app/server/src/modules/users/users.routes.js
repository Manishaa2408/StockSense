const express = require('express');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { validate, schemas } = require('./users.validator');
const controller = require('./users.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('USER.READ'), controller.getAll);
router.get('/:id', authorize('USER.READ'), controller.getById);
router.post('/', authorize('USER.CREATE'), validate(schemas.createUserSchema), controller.create);
router.put('/:id', authorize('USER.UPDATE'), validate(schemas.updateUserSchema), controller.update);
router.patch('/:id/status', authorize('USER.MANAGE'), validate(schemas.updateStatusSchema), controller.updateStatus);
router.patch('/:id/role', authorize('USER.MANAGE'), validate(schemas.updateRoleSchema), controller.updateRole);

module.exports = router;
