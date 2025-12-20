// db/migrations/20251130102000_create_asset_categories_table.js
exports.up = function (knex) {
  return knex.schema.createTable('asset_categories', (table) => {
    table.increments('id').primary();
    table.string('code', 20).notNullable().unique(); // örn: 'MOB', 'BT', 'ARAC'
    table.string('name', 100).notNullable();         // örn: 'Mobilya', 'BT Donanımı'
    table.string('description', 255);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('asset_categories');
};
