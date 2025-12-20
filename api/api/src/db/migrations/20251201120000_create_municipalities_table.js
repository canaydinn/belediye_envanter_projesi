/**
 * Municipalities (Belediyeler) Tablosu
 * Çok belediyeli sistem altyapısı için temel tablo.
 */

exports.up = function (knex) {
  return knex.schema.createTable("municipalities", function (table) {
    table.increments("id").primary();
    table.string("code", 50).notNullable().unique();    // Örn: URLA_BLD, ETIMESGUT_BLD
    table.string("name", 255).notNullable();             // Belediye adı
    table.string("province", 100).notNullable();         // Örn: İzmir, Ankara
    table.string("district", 100).notNullable();         // Örn: Urla, Etimesgut
    table.string("tax_number", 20).unique().nullable();  // Vergi numarası
    table.string("address", 500).nullable();             // Resmî adres
    table.string("contact_email", 150).nullable();       // Kurumsal e-posta
    table.string("contact_phone", 50).nullable();        // Santral/iletişim

    // Sistem kullanımı için
    table.boolean("is_active").defaultTo(true);

    // Audit alanları
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("municipalities");
};
