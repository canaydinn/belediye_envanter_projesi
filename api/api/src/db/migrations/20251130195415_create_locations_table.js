// db/migrations/20251130101500_create_locations_table.js
exports.up = function (knex) {
  return knex.schema.createTable('locations', (table) => {
    table.increments('id').primary();
    table.string('code', 50).notNullable().unique();  // örn: 'BLD-A-101'
    table.string('name', 150).notNullable();          // örn: 'Ana Bina 1. Kat 101'
    table.string('address', 255);
    table
      .integer('department_id')
      .unsigned()
      .references('id')
      .inTable('departments')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('locations');
};
