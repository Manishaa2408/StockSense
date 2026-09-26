require('dotenv').config();

const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'stocksense',
  JWT_SECRET: process.env.JWT_SECRET || 'stocksense-jwt-secret-change-in-production-2024',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  MAIL_HOST: process.env.MAIL_HOST || 'smtp.gmail.com',
  MAIL_PORT: process.env.MAIL_PORT || 587,
  MAIL_USER: process.env.MAIL_USER || '',
  MAIL_PASS: process.env.MAIL_PASS || '',
  MAIL_FROM: process.env.MAIL_FROM || 'noreply@stocksense.com',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173'
};

module.exports = Object.freeze(config);
