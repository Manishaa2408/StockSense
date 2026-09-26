const app = require('./app');
const config = require('./config/env');
const db = require('./config/database');
const logger = require('./utils/logger');

const startServer = async () => {
  try {
    await db.raw('SELECT 1');
    logger.info('Database connection established successfully.');

    app.listen(config.PORT, () => {
      logger.info(`StockSense API Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error(`Unable to start server: ${error.message}`);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

startServer();
