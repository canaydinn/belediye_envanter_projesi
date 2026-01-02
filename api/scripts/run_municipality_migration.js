// scripts/run_municipality_migration.js
// Bu script, municipality_id migration'ını manuel olarak çalıştırır

require('dotenv').config();
const knex = require('knex');
const config = require('../knexfile');

const env = process.env.NODE_ENV || 'development';
const db = knex(config[env]);

async function runMunicipalityMigration() {
  try {
    console.log('municipality_id migration çalıştırılıyor...');
    
    // Migration dosyasını require et
    const migration = require('../src/db/migrations/20251201121000_add_municipality_id_to_core_tables.js');
    
    // Migration'ı çalıştır
    await migration.up(db);
    
    console.log('✓ Migration başarıyla çalıştırıldı!');
    
  } catch (error) {
    console.error('✗ Migration hatası:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

runMunicipalityMigration()
  .then(() => {
    console.log('İşlem tamamlandı.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('İşlem başarısız:', error);
    process.exit(1);
  });

