exports.up = function (knex) {
  return knex.schema.table('assets', (table) => {
    table
      .integer('created_by_user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    table
      .integer('updated_by_user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
  });
};

exports.down = function (knex) {
  return knex.schema.table('assets', (table) => {
    table.dropColumn('created_by_user_id');
    table.dropColumn('updated_by_user_id');
  });
};
