const Joi = require('joi');

const itemSchema = Joi.object({
  product_id: Joi.number().integer().required(),
  ordered_quantity: Joi.number().min(0).required(),
  received_quantity: Joi.number().min(0).required(),
  accepted_quantity: Joi.number().min(0).optional(),
  rejected_quantity: Joi.number().min(0).optional(),
  remarks: Joi.string().allow('').optional(),
});

const createReceiptSchema = Joi.object({
  supplier_name: Joi.string().trim().required(),
  purchase_order_ref: Joi.string().allow('').optional(),
  warehouse_id: Joi.number().integer().required(),
  location_id: Joi.number().integer().required(),
  receipt_date: Joi.date().iso().required(),
  notes: Joi.string().allow('').optional(),
  items: Joi.array().items(itemSchema).min(1).required(),
});

const updateReceiptSchema = Joi.object({
  supplier_name: Joi.string().trim(),
  purchase_order_ref: Joi.string().allow(''),
  warehouse_id: Joi.number().integer(),
  location_id: Joi.number().integer(),
  receipt_date: Joi.date().iso(),
  notes: Joi.string().allow(''),
  items: Joi.array().items(itemSchema).min(1),
}).min(1);

const cancelSchema = Joi.object({
  reason: Joi.string().allow('').optional(),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return res.status(400).json({ success: false, error: { message: errorMessage } });
  }
  next();
};

module.exports = {
  validate,
  schemas: {
    createReceiptSchema,
    updateReceiptSchema,
    cancelSchema,
  },
};
