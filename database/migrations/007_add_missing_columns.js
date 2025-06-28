exports.up = async function(knex) {
  // Check if winery column exists in wines table, if not add it
  const hasWineryColumn = await knex.schema.hasColumn('wines', 'winery');
  if (!hasWineryColumn) {
    await knex.schema.alterTable('wines', (table) => {
      table.string('winery').defaultTo('');
    });
  }

  // Check if content column exists in memories table, if not add it
  const hasContentColumn = await knex.schema.hasColumn('memories', 'content');
  if (!hasContentColumn) {
    await knex.schema.alterTable('memories', (table) => {
      table.text('content').defaultTo('');
    });
    
    // Copy description to content for existing records
    await knex('memories').update({
      content: knex.ref('description')
    });
  }

  // Check if date_experienced column exists in memories table, if not add it
  const hasDateExperiencedColumn = await knex.schema.hasColumn('memories', 'date_experienced');
  if (!hasDateExperiencedColumn) {
    await knex.schema.alterTable('memories', (table) => {
      table.timestamp('date_experienced').nullable();
    });
    
    // Copy experience_date to date_experienced for existing records
    await knex('memories').update({
      date_experienced: knex.ref('experience_date')
    });
  }
};

exports.down = async function(knex) {
  const hasWineryColumn = await knex.schema.hasColumn('wines', 'winery');
  if (hasWineryColumn) {
    await knex.schema.alterTable('wines', (table) => {
      table.dropColumn('winery');
    });
  }

  const hasContentColumn = await knex.schema.hasColumn('memories', 'content');
  if (hasContentColumn) {
    await knex.schema.alterTable('memories', (table) => {
      table.dropColumn('content');
    });
  }

  const hasDateExperiencedColumn = await knex.schema.hasColumn('memories', 'date_experienced');
  if (hasDateExperiencedColumn) {
    await knex.schema.alterTable('memories', (table) => {
      table.dropColumn('date_experienced');
    });
  }
};