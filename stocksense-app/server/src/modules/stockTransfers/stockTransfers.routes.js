const express = require('express');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { validate, schemas } = require('./stockTransfers.validator');
const controller = require('./stockTransfers.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('TRANSFER.READ'), controller.getAll);
router.get('/meta/master-data', authorize('TRANSFER.READ'), controller.getMasterData);
router.get('/meta/stock', authorize('TRANSFER.READ'), controller.getStockAvailability);
router.get('/:id', authorize('TRANSFER.READ'), controller.getById);

router.post('/', authorize('TRANSFER.CREATE'), validate(schemas.createTransferSchema), controller.create);
router.put('/:id', authorize('TRANSFER.UPDATE'), validate(schemas.updateTransferSchema), controller.update);

router.post('/:id/ready', authorize('TRANSFER.UPDATE'), controller.markReady);
router.post('/:id/start', authorize('TRANSFER.VALIDATE'), controller.startTransfer);
router.post('/:id/complete', authorize('TRANSFER.VALIDATE'), controller.completeTransfer);
router.post('/:id/cancel', authorize('TRANSFER.UPDATE'), validate(schemas.cancelTransferSchema), controller.cancelTransfer);

module.exports = router;
