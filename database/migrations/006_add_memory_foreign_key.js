exports.up = function(knex) {
  return knex.schema.alterTable('images', (table) => {
    table.foreign('memory_id').references('id').inTable('memories').onDelete('CASCADE');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('images', (table) => {
    table.dropForeign(['memory_id']);
  });
};