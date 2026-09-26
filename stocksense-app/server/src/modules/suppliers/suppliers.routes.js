const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const { validate, schemas } = require('./suppliers.validator');
const suppliersController = require('./suppliers.controller');

router.use(authenticate);

router.get('/', suppliersController.getAll);
router.get('/:id', suppliersController.getById);
router.post('/', validate(schemas.createSupplierSchema), suppliersController.create);
router.put('/:id', validate(schemas.updateSupplierSchema), suppliersController.update);
router.patch('/:id/status', validate(schemas.updateStatusSchema), suppliersController.updateStatus);

module.exports = router;
