import knex from 'knex';
const config = require('../knexfile.js');

const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

export default db;