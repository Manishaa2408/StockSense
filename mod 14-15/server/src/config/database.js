const knex = require('knex');
const knexfile = require('../../knexfile');
const config = require('./env');

const environment = config.NODE_ENV || 'development';
const db = knex(knexfile[environment]);

module.exports = db;
