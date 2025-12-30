exports.up = function (knex) {
  return knex.schema.table('asset_movements', (table) => {
    // Yeni sorumlu kullanıcı (zimmet için)
    table
      .integer('to_user_id')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Hareket gerekçesi
    table.string('reason', 500).nullable();

    // Talep eden kullanıcı
    table
      .integer('requested_by')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Onaylayan kullanıcı
    table
      .integer('approved_by')
      .unsigned()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    // Hareket durumu
    table.string('status', 50).nullable();
  });
};

exports.down = function (knex) {
  return knex.schema.table('asset_movements', (table) => {
    table.dropColumn('to_user_id');
    table.dropColumn('reason');
    table.dropColumn('requested_by');
    table.dropColumn('approved_by');
    table.dropColumn('status');
  });
};



