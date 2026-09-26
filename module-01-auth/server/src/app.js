const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: config.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/api/', apiLimiter);

app.use('/api/v1/auth', require('./modules/auth/auth.routes'));
app.use('/api/v1/users', require('./modules/users/users.routes'));
app.use('/api/v1/roles', require('./modules/roles/roles.routes'));
app.use('/api/v1/profile', require('./modules/profile/profile.routes'));
app.use('/api/v1/categories', require('./modules/categories/categories.routes'));
app.use('/api/v1/units', require('./modules/units/units.routes'));
app.use('/api/v1/products', require('./modules/products/products.routes'));
app.use('/api/v1/warehouses', require('./modules/warehouses/warehouses.routes'));
app.use('/api/v1/locations', require('./modules/locations/locations.routes'));
app.use('/api/v1/deliveries', require('./modules/deliveries/deliveries.routes'));

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'StockSense API is running',
    data: {
      timestamp: new Date().toISOString(),
      environment: config.NODE_ENV
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

app.use(errorHandler);

module.exports = app;
