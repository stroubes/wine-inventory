import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('memories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('(lower(hex(randomblob(4))) || \'-\' || lower(hex(randomblob(2))) || \'-4\' || substr(lower(hex(randomblob(2))),2) || \'-\' || substr(\'89ab\',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || \'-\' || lower(hex(randomblob(6))))'));
    
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
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('memories');
}