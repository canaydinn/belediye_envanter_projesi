// api/db/index.js
const knex = require('knex');
const knexConfig = require('../knexfile'); // eğer knexfile.js varsa
const env = process.env.NODE_ENV || 'development';

const db = knex(knexConfig[env]);

module.exports = db;
