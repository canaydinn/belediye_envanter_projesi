// 20251201121000_add_municipality_id_to_core_tables.js

exports.up = async function (knex) {
  // NOT: Bu migration'ın çalışabilmesi için municipalities tablosu zaten var olmalı.

  // users
  await knex.schema.alterTable('users', (table) => {
    table
      .integer('municipality_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('municipalities')
      .onDelete('RESTRICT')
      .index();
  });

  // departments
  await knex.schema.alterTable('departments', (table) => {
    table
      .integer('municipality_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('municipalities')
      .onDelete('RESTRICT')
      .index();
  });

  // locations
  await knex.schema.alterTable('locations', (table) => {
    table
      .integer('municipality_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('municipalities')
      .onDelete('RESTRICT')
      .index();
  });

  // asset_categories (ister global ister belediye bazlı; biz şimdilik belediye bazlı yapıyoruz)
  await knex.schema.alterTable('asset_categories', (table) => {
    table
      .integer('municipality_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('municipalities')
      .onDelete('RESTRICT')
      .index();
  });

  // assets
  await knex.schema.alterTable('assets', (table) => {
    table
      .integer('municipality_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('municipalities')
      .onDelete('RESTRICT')
      .index();
  });

  // asset_movements
  await knex.schema.alterTable('asset_movements', (table) => {
    table
      .integer('municipality_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('municipalities')
      .onDelete('RESTRICT')
      .index();
  });

  // asset_documents
  await knex.schema.alterTable('asset_documents', (table) => {
    table
      .integer('municipality_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('municipalities')
      .onDelete('RESTRICT')
      .index();
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable('asset_documents', (table) => {
    table.dropColumn('municipality_id');
  });

  await knex.schema.alterTable('asset_movements', (table) => {
    table.dropColumn('municipality_id');
  });

  await knex.schema.alterTable('assets', (table) => {
    table.dropColumn('municipality_id');
  });

  await knex.schema.alterTable('asset_categories', (table) => {
    table.dropColumn('municipality_id');
  });

  await knex.schema.alterTable('locations', (table) => {
    table.dropColumn('municipality_id');
  });

  await knex.schema.alterTable('departments', (table) => {
    table.dropColumn('municipality_id');
  });

  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('municipality_id');
  });
};
