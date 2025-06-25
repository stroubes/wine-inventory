import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('images', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(4))) || \'-\' || lower(hex(randomblob(2))) || \'-4\' || substr(lower(hex(randomblob(2))),2) || \'-\' || substr(\'89ab\',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || \'-\' || lower(hex(randomblob(6))))'));
    
    table.uuid('wine_id').references('id').inTable('wines').onDelete('CASCADE').nullable();
    table.uuid('memory_id').nullable(); // Will be updated after memories table is created
    
    table.string('filename').notNullable();
    table.string('original_name').notNullable();
    table.string('mime_type').notNullable();
    table.integer('size').notNullable(); // in bytes
    table.integer('width').nullable();
    table.integer('height').nullable();
    
    table.enu('image_type', ['front_label', 'back_label', 'memory']).notNullable();
    table.text('alt_text').nullable();
    table.text('description').nullable();
    
    table.timestamps(true, true);
    
    // Indexes
    table.index(['wine_id']);
    table.index(['memory_id']);
    table.index(['image_type']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('images');
}