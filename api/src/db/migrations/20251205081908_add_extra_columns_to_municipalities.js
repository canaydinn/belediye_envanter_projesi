// örnek dosya adı:
// 20251205120000_add_extra_columns_to_municipalities.js

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable('municipalities', function (table) {
    // Belediyenin logosu
    table.string('logo_url').nullable();

    // Belediyeye özel domain / subdomain
    table.string('domain_url').nullable();

    // Dış sistem entegrasyonu için API anahtarı
    table.string('api_key').nullable();

    // Plan bazlı maksimum kullanıcı sayısı
    table.integer('max_users').nullable();

    // Plan bazlı maksimum envanter (varlık) sayısı
    table.integer('max_assets').nullable();

    // Superadmin için belediye notları
    table.text('notes').nullable();

    // Aktivasyon süreçleri için token
    table.string('activation_token').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable('municipalities', function (table) {
    table.dropColumn('logo_url');
    table.dropColumn('domain_url');
    table.dropColumn('api_key');
    table.dropColumn('max_users');
    table.dropColumn('max_assets');
    table.dropColumn('notes');
    table.dropColumn('activation_token');
  });
};
