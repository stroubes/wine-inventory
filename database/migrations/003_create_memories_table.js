exports.up = function(knex) {
  return knex.schema.createTable('memories', (table) => {
    table.uuid('id').primary();
    
    table.uuid('wine_id').references('id').inTable('wines').onDelete('CASCADE');
    
    table.string('title').notNullable();
    table.text('description').notNullable();
    table.timestamp('experience_date').notNullable();
    table.string('location').nullable();
    table.json('tags'); // Array of strings: ['Wine Tour', 'Dinner Party', 'Special Occasion', etc.]
    table.integer('rating').checkBetween([1, 5]).nullable(); // 1-5 stars for the experience
    
    table.timestamps(true, true);
    
    // Indexes
    table.index(['wine_id']);
    table.index(['experience_date']);
    table.index(['title']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('memories');
};