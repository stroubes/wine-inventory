exports.up = function(knex) {
  return knex.schema.createTable('food_pairings', (table) => {
    table.uuid('id').primary();
    
    table.uuid('wine_id').references('id').inTable('wines').onDelete('CASCADE');
    
    table.string('food_item').notNullable();
    table.enu('category', ['Appetizer', 'Main Course', 'Dessert', 'Cheese', 'Other']).notNullable();
    table.text('description').nullable();
    table.integer('user_rating').checkBetween([1, 5]).nullable(); // User's rating of this pairing
    table.boolean('is_suggested').defaultTo(false); // true if from API, false if user-added
    table.string('source').nullable(); // API source or 'user'
    
    table.timestamps(true, true);
    
    // Indexes
    table.index(['wine_id']);
    table.index(['category']);
    table.index(['is_suggested']);
    table.unique(['wine_id', 'food_item']); // Prevent duplicate pairings
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('food_pairings');
};