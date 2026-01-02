exports.up = async function (knex) {
  // Kolonların zaten var olup olmadığını kontrol et
  const hasToUserId = await knex.schema.hasColumn('asset_movements', 'to_user_id');
  const hasReason = await knex.schema.hasColumn('asset_movements', 'reason');
  const hasRequestedBy = await knex.schema.hasColumn('asset_movements', 'requested_by');
  const hasApprovedBy = await knex.schema.hasColumn('asset_movements', 'approved_by');
  const hasStatus = await knex.schema.hasColumn('asset_movements', 'status');

  return knex.schema.table('asset_movements', (table) => {
    // Yeni sorumlu kullanıcı (zimmet için) - sadece yoksa ekle
    if (!hasToUserId) {
      table
        .integer('to_user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .onUpdate('CASCADE');
    }

    // Hareket gerekçesi
    if (!hasReason) {
      table.string('reason', 500).nullable();
    }

    // Talep eden kullanıcı
    if (!hasRequestedBy) {
      table
        .integer('requested_by')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .onUpdate('CASCADE');
    }

    // Onaylayan kullanıcı
    if (!hasApprovedBy) {
      table
        .integer('approved_by')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .onUpdate('CASCADE');
    }

    // Hareket durumu
    if (!hasStatus) {
      table.string('status', 50).nullable();
    }
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




