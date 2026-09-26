const express = require('express');
const authenticate = require('../../middleware/authenticate');
const { validate, schemas } = require('./profile.validator');
const controller = require('./profile.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', controller.getProfile);
router.put('/', validate(schemas.updateProfileSchema), controller.updateProfile);
router.patch('/password', validate(schemas.changePasswordSchema), controller.changePassword);

module.exports = router;
