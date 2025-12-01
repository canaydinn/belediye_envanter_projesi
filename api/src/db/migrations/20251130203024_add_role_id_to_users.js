// db/migrations/XXXXXXXXXXXX_add_role_id_to_users.js

exports.up = async function (knex) {
  const hasRoleId = await knex.schema.hasColumn('users', 'role_id');

  if (!hasRoleId) {
    return knex.schema.table('users', (table) => {
      table
        .integer('role_id')
        .unsigned()
        .references('id')
        .inTable('roles')
        .onDelete('RESTRICT')
        .onUpdate('CASCADE');
    });
  }
};

exports.down = async function (knex) {
  const hasRoleId = await knex.schema.hasColumn('users', 'role_id');

  if (hasRoleId) {
    return knex.schema.table('users', (table) => {
      table.dropColumn('role_id');
    });
  }
};
