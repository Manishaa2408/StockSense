const express = require('express');
const goodsReceiptsController = require('./goodsReceipts.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { validate, schemas } = require('./goodsReceipts.validator');

const router = express.Router();

router.get('/', authenticate, authorize('RECEIPT.READ'), goodsReceiptsController.getAll);
router.get('/:id', authenticate, authorize('RECEIPT.READ'), goodsReceiptsController.getById);

router.post('/', authenticate, authorize('RECEIPT.CREATE'), validate(schemas.createReceiptSchema), goodsReceiptsController.create);
router.put('/:id', authenticate, authorize('RECEIPT.UPDATE'), validate(schemas.updateReceiptSchema), goodsReceiptsController.update);

router.post('/:id/receive', authenticate, authorize('RECEIPT.UPDATE'), goodsReceiptsController.markReceived);
router.post('/:id/confirm', authenticate, authorize('RECEIPT.VALIDATE'), goodsReceiptsController.confirm);
router.post('/:id/cancel', authenticate, authorize('RECEIPT.UPDATE'), validate(schemas.cancelSchema), goodsReceiptsController.cancel);

module.exports = router;
