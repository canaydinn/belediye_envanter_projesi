// db/migrations/20251130102500_create_assets_table.js
exports.up = function (knex) {
  return knex.schema.createTable('assets', (table) => {
    table.increments('id').primary();

    // Envanter kimlik bilgileri
    table.string('asset_code', 50).notNullable().unique(); // Belediyenin demirbaş/qr kodu
    table.string('name', 150).notNullable();               // Envanter adı
    table.text('description');                             // Açıklama

    // Kategori ve konum ilişkileri
    table
      .integer('category_id')
      .unsigned()
      .references('id')
      .inTable('asset_categories')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE');

    table
      .integer('department_id')
      .unsigned()
      .references('id')
      .inTable('departments')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    table
      .integer('location_id')
      .unsigned()
      .references('id')
      .inTable('locations')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Sorumlu kullanıcı (varsa)
    table
      .integer('assigned_user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Finansal bilgiler
    table.decimal('purchase_price', 14, 2);
    table.date('purchase_date');
    table.string('serial_number', 100);

    // Durum alanları
    table.enu('status', ['active', 'in_maintenance', 'disposed', 'lost']).notNullable().defaultTo('active');
    table.boolean('is_qr_tagged').notNullable().defaultTo(false); // QR etiketi basıldı mı?

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('assets');
};
