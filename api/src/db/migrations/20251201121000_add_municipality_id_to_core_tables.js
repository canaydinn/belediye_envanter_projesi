// 20251201121000_add_municipality_id_to_core_tables.js

exports.up = async function (knex) {
  // NOT: Bu migration'ın çalışabilmesi için municipalities tablosu zaten var olmalı.
  
  // İlk belediyeyi al (default değer için)
  const firstMunicipality = await knex('municipalities').select('id').first();
  const defaultMunicipalityId = firstMunicipality?.id || 1;

  // Helper function: Kolon yoksa ekle, varsa atla
  const addMunicipalityColumn = async (tableName) => {
    const hasColumn = await knex.schema.hasColumn(tableName, 'municipality_id');
    
    if (!hasColumn) {
      // Önce nullable olarak ekle
      await knex.schema.alterTable(tableName, (table) => {
        table
          .integer('municipality_id')
          .unsigned()
          .nullable()
          .references('id')
          .inTable('municipalities')
          .onDelete('RESTRICT')
          .index();
      });
      
      // Mevcut verilere default değer ata
      await knex(tableName).whereNull('municipality_id').update({ municipality_id: defaultMunicipalityId });
      
      // Şimdi notNullable yap
      await knex.schema.alterTable(tableName, (table) => {
        table.integer('municipality_id').notNullable().alter();
      });
      
      console.log(`✓ ${tableName}.municipality_id eklendi`);
    } else {
      console.log(`- ${tableName}.municipality_id zaten var, atlandı`);
    }
  };

  // users
  await addMunicipalityColumn('users');

  // departments
  await addMunicipalityColumn('departments');

  // locations
  await addMunicipalityColumn('locations');

  // asset_categories
  await addMunicipalityColumn('asset_categories');

  // assets
  await addMunicipalityColumn('assets');

  // asset_movements
  await addMunicipalityColumn('asset_movements');

  // asset_documents
  await addMunicipalityColumn('asset_documents');
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
