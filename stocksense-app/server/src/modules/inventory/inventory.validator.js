const Joi = require('joi');

const increaseStockSchema = Joi.object({
  product_id: Joi.number().integer().required(),
  warehouse_id: Joi.number().integer().required(),
  location_id: Joi.number().integer().required(),
  quantity: Joi.number().min(0.0001).required(),
});

const decreaseStockSchema = Joi.object({
  product_id: Joi.number().integer().required(),
  location_id: Joi.number().integer().required(),
  quantity: Joi.number().min(0.0001).required(),
});

const stockQuerySchema = Joi.object({
  product_id: Joi.number().integer(),
  warehouse_id: Joi.number().integer(),
  location_id: Joi.number().integer(),
  search: Joi.string().allow(''),
  status: Joi.string().valid('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).default(20),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.method === 'GET' ? req.query : req.body, { abortEarly: false });
  if (error) {
    const errorMessage = error.details.map((details) => details.message).join(', ');
    return res.status(400).json({ success: false, error: { message: errorMessage } });
  }
  next();
};

module.exports = {
  validate,
  schemas: {
    increaseStockSchema,
    decreaseStockSchema,
    stockQuerySchema,
  },
};
