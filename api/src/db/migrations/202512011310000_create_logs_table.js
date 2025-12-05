exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('logs');
  if (exists) return;

  return knex.schema.createTable('logs', (table) => {
    table.increments('id').primary();
    table
      .integer('municipality_id')
      .unsigned()
      .references('id')
      .inTable('municipalities')
      .onDelete('SET NULL')
      .index();
    table
      .integer('user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .index();
    table.string('level', 20).notNullable().defaultTo('INFO');
    table.string('module', 255).notNullable();
    table.string('action', 255).nullable();
    table.text('message').notNullable();
    table.jsonb('context').nullable();
    table.string('ip_address', 45).nullable();
    table.string('user_agent', 500).nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = async function (knex) {
  const exists = await knex.schema.hasTable('logs');
  if (exists) {
    await knex.schema.dropTable('logs');
  }
};