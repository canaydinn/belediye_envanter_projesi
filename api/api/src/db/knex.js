const knex = require('knex');
const config = require('../../knexfile'); // knexfile.js hem root'ta hem api'de olsa bu yol çalışır

const env = process.env.NODE_ENV || 'development';
const knexConfig = config[env];

const db = knex(knexConfig);

module.exports = db;
