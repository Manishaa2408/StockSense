const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const suppliersService = require('./suppliers.service');
const ApiResponse = require('../../utils/ApiResponse');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const list = await suppliersService.getAll(req.query);
    return ApiResponse.success(res, 'Suppliers retrieved successfully', list);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const supplier = await suppliersService.getById(req.params.id);
    return ApiResponse.success(res, 'Supplier retrieved successfully', supplier);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const supplier = await suppliersService.create(req.body);
    return ApiResponse.created(res, 'Supplier created successfully', supplier);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
