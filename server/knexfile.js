const path = require('path');

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, '../database/wine_inventory.db')
    },
    migrations: {
      directory: path.join(__dirname, '../database/migrations')
    },
    seeds: {
      directory: path.join(__dirname, '../database/seeds')
    },
    useNullAsDefault: true
  },

  production: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DATABASE_PATH || path.join(__dirname, '../database/wine_inventory.db')
    },
    migrations: {
      directory: path.join(__dirname, '../database/migrations')
    },
    useNullAsDefault: true
  }
};