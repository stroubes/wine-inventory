import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('images', (table) => {
    table.foreign('memory_id').references('id').inTable('memories').onDelete('CASCADE');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('images', (table) => {
    table.dropForeign(['memory_id']);
  });
}