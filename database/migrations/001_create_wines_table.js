exports.up = function(knex) {
  return knex.schema.createTable('wines', (table) => {
    table.uuid('id').primary();
    
    // Required fields
    table.string('name').notNullable();
    table.string('vineyard').notNullable();
    table.string('region').notNullable();
    table.enu('color', ['Red', 'White', 'Rosé', 'Sparkling', 'Dessert', 'Fortified']).notNullable();
    table.json('grape_varieties').notNullable(); // Array of strings
    table.decimal('price', 10, 2);
    table.string('currency').defaultTo('USD');
    table.integer('vintage_year').checkBetween([1800, new Date().getFullYear()]);
    table.timestamp('date_added').defaultTo(knex.fn.now());
    table.string('rack_slot');
    table.enu('consumption_status', ['Available', 'Consumed', 'Reserved']).defaultTo('Available');
    table.timestamp('date_consumed').nullable();
    
    // Additional fields
    table.text('description');
    table.text('personal_notes');
    table.integer('rating').checkBetween([1, 100]); // 1-100 point system
    table.json('food_pairings'); // Array of strings
    
    // Metadata
    table.timestamps(true, true);
    
    // Indexes
    table.index(['name']);
    table.index(['vineyard']);
    table.index(['region']);
    table.index(['color']);
    table.index(['vintage_year']);
    table.index(['consumption_status']);
    table.index(['rack_slot']);
    table.index(['date_added']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('wines');
};