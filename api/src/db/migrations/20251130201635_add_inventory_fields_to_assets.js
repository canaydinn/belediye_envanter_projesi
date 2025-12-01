exports.up = function (knex) {
  return knex.schema.table('assets', (table) => {
    table.integer('quantity').notNullable().defaultTo(1);          // Adet
    table.string('unit', 20).notNullable().defaultTo('Adet');      // Ölçü birimi
    table.string('tasinir_code', 50);                              // TKYS taşınır kodu
    table.enu('asset_type', ['demirbas', 'tuketim'])               // Demirbaş / tüketim
      .notNullable()
      .defaultTo('demirbas');
  });
};

exports.down = function (knex) {
  return knex.schema.table('assets', (table) => {
    table.dropColumn('quantity');
    table.dropColumn('unit');
    table.dropColumn('tasinir_code');
    table.dropColumn('asset_type');
  });
};
