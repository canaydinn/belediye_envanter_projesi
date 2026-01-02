// 20251221120000_fix_unique_constraints_for_municipality_scoped_tables.js
// Bu migration, municipality_id eklendikten sonra unique constraint'leri düzeltir.
// code alanları artık global değil, belediye bazında unique olmalı.

exports.up = async function (knex) {
  // asset_categories: code alanını global unique'den belediye bazlı unique'e çevir
  // Önce mevcut unique constraint'i kaldır
  try {
    await knex.schema.alterTable('asset_categories', (table) => {
      table.dropUnique(['code']);
    });
  } catch (err) {
    // Constraint yoksa veya farklı isimdeyse, raw SQL ile dene
    const result = await knex.raw(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'asset_categories' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name LIKE '%code%'
      LIMIT 1
    `);
    
    if (result.rows && result.rows.length > 0) {
      const constraintName = result.rows[0].constraint_name;
      await knex.raw(`ALTER TABLE asset_categories DROP CONSTRAINT ??`, [constraintName]);
    }
  }
  
  // Belediye bazında unique constraint ekle
  await knex.schema.alterTable('asset_categories', (table) => {
    table.unique(['municipality_id', 'code']);
  });

  // departments: code alanını global unique'den belediye bazlı unique'e çevir
  try {
    await knex.schema.alterTable('departments', (table) => {
      table.dropUnique(['code']);
    });
  } catch (err) {
    const result = await knex.raw(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'departments' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name LIKE '%code%'
      LIMIT 1
    `);
    
    if (result.rows && result.rows.length > 0) {
      const constraintName = result.rows[0].constraint_name;
      await knex.raw(`ALTER TABLE departments DROP CONSTRAINT ??`, [constraintName]);
    }
  }
  
  await knex.schema.alterTable('departments', (table) => {
    table.unique(['municipality_id', 'code']);
  });

  // locations: code alanını global unique'den belediye bazlı unique'e çevir
  try {
    await knex.schema.alterTable('locations', (table) => {
      table.dropUnique(['code']);
    });
  } catch (err) {
    const result = await knex.raw(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'locations' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name LIKE '%code%'
      LIMIT 1
    `);
    
    if (result.rows && result.rows.length > 0) {
      const constraintName = result.rows[0].constraint_name;
      await knex.raw(`ALTER TABLE locations DROP CONSTRAINT ??`, [constraintName]);
    }
  }
  
  await knex.schema.alterTable('locations', (table) => {
    table.unique(['municipality_id', 'code']);
  });

  // assets: asset_code alanını global unique'den belediye bazlı unique'e çevir
  try {
    await knex.schema.alterTable('assets', (table) => {
      table.dropUnique(['asset_code']);
    });
  } catch (err) {
    const result = await knex.raw(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'assets' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name LIKE '%asset_code%'
      LIMIT 1
    `);
    
    if (result.rows && result.rows.length > 0) {
      const constraintName = result.rows[0].constraint_name;
      await knex.raw(`ALTER TABLE assets DROP CONSTRAINT ??`, [constraintName]);
    }
  }
  
  await knex.schema.alterTable('assets', (table) => {
    table.unique(['municipality_id', 'asset_code']);
  });
};

exports.down = async function (knex) {
  // Geri alma işlemleri - composite unique constraint'leri kaldır ve global unique ekle
  
  // assets
  try {
    await knex.schema.alterTable('assets', (table) => {
      table.dropUnique(['municipality_id', 'asset_code']);
    });
  } catch (err) {
    // Constraint yoksa devam et
  }
  await knex.schema.alterTable('assets', (table) => {
    table.unique(['asset_code']);
  });

  // locations
  try {
    await knex.schema.alterTable('locations', (table) => {
      table.dropUnique(['municipality_id', 'code']);
    });
  } catch (err) {
    // Constraint yoksa devam et
  }
  await knex.schema.alterTable('locations', (table) => {
    table.unique(['code']);
  });

  // departments
  try {
    await knex.schema.alterTable('departments', (table) => {
      table.dropUnique(['municipality_id', 'code']);
    });
  } catch (err) {
    // Constraint yoksa devam et
  }
  await knex.schema.alterTable('departments', (table) => {
    table.unique(['code']);
  });

  // asset_categories
  try {
    await knex.schema.alterTable('asset_categories', (table) => {
      table.dropUnique(['municipality_id', 'code']);
    });
  } catch (err) {
    // Constraint yoksa devam et
  }
  await knex.schema.alterTable('asset_categories', (table) => {
    table.unique(['code']);
  });
};
