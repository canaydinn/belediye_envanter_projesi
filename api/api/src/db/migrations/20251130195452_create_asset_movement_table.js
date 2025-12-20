// db/migrations/20251130103000_create_asset_movements_table.js
exports.up = function (knex) {
  return knex.schema.createTable('asset_movements', (table) => {
    table.increments('id').primary();

    table
      .integer('asset_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('assets')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Hareket tipi: zimmet, birim değişikliği, iade, hurdaya ayırma vb.
    table.enu('movement_type', [
      'assign',          // kullanıcıya zimmet
      'transfer',        // birim/konum değişikliği
      'return',          // kullanıcıdan geri alındı
      'maintenance',     // bakıma gönderildi
      'dispose',         // hurdaya ayrıldı
    ]).notNullable();

    // Önceki / yeni birim & konum
    table.integer('from_department_id').unsigned().references('id').inTable('departments').onDelete('SET NULL');
    table.integer('to_department_id').unsigned().references('id').inTable('departments').onDelete('SET NULL');

    table.integer('from_location_id').unsigned().references('id').inTable('locations').onDelete('SET NULL');
    table.integer('to_location_id').unsigned().references('id').inTable('locations').onDelete('SET NULL');

    // İşlemi yapan kullanıcı
    table
      .integer('performed_by_user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    table.timestamp('movement_date').notNullable().defaultTo(knex.fn.now());
    table.text('notes');

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('asset_movements');
};
