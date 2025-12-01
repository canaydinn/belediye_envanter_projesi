exports.up = function (knex) {
  return knex.schema.createTable('asset_documents', (table) => {
    table.increments('id').primary();

    table
      .integer('asset_id')
      .unsigned()
      .references('id')
      .inTable('assets')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    table.enu('document_type', [
      'fatura',
      'tif',           // Taşınır İşlem Fişi
      'muayene_kabul',
      'devir_belgesi',
      'hurda_karari',
      'bakim_formu',
      'diğer'
    ]).notNullable();

    table.string('document_no', 100);
    table.integer('fiscal_year');             // Bütçe yılı
    table.date('issue_date');                 // Belge tarihi
    table.decimal('amount', 14, 2);           // Fatura / belge tutarı
    table.text('notes');

    // Belgeyi sisteme kim ekledi?
    table
      .integer('uploaded_by_user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('asset_documents');
};
