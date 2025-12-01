// db/migrations/20251130101000_create_departments_table.js
exports.up = function (knex) {
  return knex.schema.createTable('departments', (table) => {
    table.increments('id').primary();
    table.string('code', 20).notNullable().unique(); // örn: 'FENIS', 'PARKBAHCE'
    table.string('name', 150).notNullable();         // Birim adı
    table
      .integer('manager_user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('departments');
};
