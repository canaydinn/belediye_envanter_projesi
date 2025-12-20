// db/migrations/XXXXXXXXXXXX_add_missing_columns_to_users.js

exports.up = async function (knex) {
  const hasEmail = await knex.schema.hasColumn('users', 'email');
  const hasFullName = await knex.schema.hasColumn('users', 'full_name');
  const hasIsActive = await knex.schema.hasColumn('users', 'is_active');

  return knex.schema.table('users', (table) => {
    if (!hasEmail) {
      table.string('email', 100).unique();
    }
    if (!hasFullName) {
      table.string('full_name', 100);
    }
    if (!hasIsActive) {
      table.boolean('is_active').notNullable().defaultTo(true);
    }
  });
};

exports.down = async function (knex) {
  const hasEmail = await knex.schema.hasColumn('users', 'email');
  const hasFullName = await knex.schema.hasColumn('users', 'full_name');
  const hasIsActive = await knex.schema.hasColumn('users', 'is_active');

  return knex.schema.table('users', (table) => {
    if (hasEmail) {
      table.dropColumn('email');
    }
    if (hasFullName) {
      table.dropColumn('full_name');
    }
    if (hasIsActive) {
      table.dropColumn('is_active');
    }
  });
};
