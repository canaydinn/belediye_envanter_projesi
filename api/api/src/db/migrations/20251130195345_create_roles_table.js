// db/migrations/20251130100000_create_roles_table.js
exports.up = function (knex) {
  return knex.schema.createTable('roles', (table) => {
    table.increments('id').primary();
    table.string('name', 50).notNullable().unique(); // örn: 'admin', 'unit_manager'
    table.string('description', 255);
    table.timestamps(true, true); // created_at, updated_at
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('roles');
};
