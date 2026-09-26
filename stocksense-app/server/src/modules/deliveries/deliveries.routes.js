const express = require('express');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { validate, schemas } = require('./deliveries.validator');
const controller = require('./deliveries.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('DELIVERY.READ'), controller.getAll);
router.get('/meta/master-data', authorize('DELIVERY.READ'), controller.getMasterData);
router.get('/meta/stock', authorize('DELIVERY.READ'), controller.getStockAvailability);
router.get('/:id', authorize('DELIVERY.READ'), controller.getById);
router.post('/', authorize('DELIVERY.CREATE'), validate(schemas.createDeliverySchema), controller.create);
router.put('/:id', authorize('DELIVERY.UPDATE'), validate(schemas.updateDeliverySchema), controller.update);
router.post('/:id/ready', authorize('DELIVERY.UPDATE'), controller.markReady);
router.post('/:id/validate', authorize('DELIVERY.VALIDATE'), controller.validateDelivery);
router.post('/:id/cancel', authorize('DELIVERY.UPDATE'), validate(schemas.cancelDeliverySchema), controller.cancelDelivery);

module.exports = router;
