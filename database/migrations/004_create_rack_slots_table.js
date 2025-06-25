exports.up = function(knex) {
  return knex.schema.createTable('rack_slots', (table) => {
    table.string('slot_id').primary(); // e.g., 'A1', 'B2', 'C3-4'
    
    table.uuid('wine_id').nullable().references('id').inTable('wines').onDelete('SET NULL');
    
    table.integer('rack_number').notNullable();
    table.string('row').notNullable(); // A, B, C, etc.
    table.integer('position').notNullable(); // 1, 2, 3, etc.
    table.integer('x_coordinate').notNullable(); // SVG x position
    table.integer('y_coordinate').notNullable(); // SVG y position
    table.integer('width').defaultTo(20); // Slot width in SVG units
    table.integer('height').defaultTo(80); // Slot height in SVG units
    
    table.boolean('is_occupied').defaultTo(false);
    table.timestamp('last_updated').defaultTo(knex.fn.now());
    
    table.timestamps(true, true);
    
    // Indexes
    table.index(['wine_id']);
    table.index(['rack_number']);
    table.index(['is_occupied']);
    table.unique(['rack_number', 'row', 'position']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('rack_slots');
};