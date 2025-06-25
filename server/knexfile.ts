import type { Knex } from 'knex';
import path from 'path';

const config: { [key: string]: Knex.Config } = {
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
      filename: path.join(__dirname, '../database/wine_inventory.db')
    },
    migrations: {
      directory: path.join(__dirname, '../database/migrations')
    },
    useNullAsDefault: true
  }
};

export default config;