const express = require('express');
const router = express.Router();
const controller = require('./locations.controller');
const { validate, schemas } = require('./locations.validator');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

router.get('/', authenticate, authorize('LOCATION.READ'), controller.getAll);
router.get('/:id', authenticate, authorize('LOCATION.READ'), controller.getById);
router.post('/', authenticate, authorize('LOCATION.CREATE'), validate(schemas.createLocationSchema), controller.create);
router.put('/:id', authenticate, authorize('LOCATION.UPDATE'), validate(schemas.updateLocationSchema), controller.update);
router.patch('/:id/status', authenticate, authorize('LOCATION.UPDATE'), validate(schemas.updateStatusSchema), controller.updateStatus);

module.exports = router;
