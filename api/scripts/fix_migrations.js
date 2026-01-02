// scripts/fix_migrations.js
// Bu script, mevcut migration'ları knex_migrations tablosuna ekler
// Böylece migration'lar tekrar çalıştırılmaz

require('dotenv').config();
const knex = require('knex');
const config = require('../knexfile');

const env = process.env.NODE_ENV || 'development';
const db = knex(config[env]);

async function fixMigrations() {
  try {
    console.log('Migration durumu kontrol ediliyor...');
    
    // Mevcut migration'ları kontrol et
    const existingMigrations = await db('knex_migrations')
      .select('name')
      .orderBy('id', 'asc');
    
    console.log(`Mevcut migration sayısı: ${existingMigrations.length}`);
    
    // Tüm migration dosyalarını listele (sadece isimleri)
    const migrationFiles = [
      '20251130194851_create_users_table.js',
      '20251130195345_create_roles_table.js',
      '20251130195405_create_departments_table.js',
      '20251130195415_create_locations_table.js',
      '20251130195430_create_asset_categories_table.js',
      '20251130195441_create_assets_table.js',
      '20251130195452_create_asset_movement_table.js',
      '20251130201635_add_inventory_fields_to_assets.js',
      '20251130201706_add_audit_fields_to_assets.js',
      '20251130201723_add_audit_fields_to_asset_movements.js',
      '20251130201737_create_asset_documents_table.js',
      '20251130202849_add_missing_columns_to_users.js',
      '20251130203024_add_role_id_to_users.js',
      '20251201120000_create_municipalities_table.js',
      '20251201121000_add_municipality_id_to_core_tables.js',
      '20251201130000_add_status_and_license_to_municipalities.js',
      '202512011310000_create_logs_table.js',
      '20251201140000_add_plan_type_to_municipalities.js',
      '20251205081908_add_extra_columns_to_municipalities.js',
      '20251205120000_create_users_table.js',
      '20251206000000_add_missing_fields_to_asset_movements.js',
      '202512201900_alter_to_user_id.js',
      '20251221120000_fix_unique_constraints_for_municipality_scoped_tables.js',
      '20251225120000_create_user_settings_table.js',
    ];
    
    const existingNames = existingMigrations.map(m => m.name);
    const missingMigrations = migrationFiles.filter(name => !existingNames.includes(name));
    
    if (missingMigrations.length === 0) {
      console.log('Tüm migration\'lar zaten işaretlenmiş.');
      return;
    }
    
    console.log(`Eksik migration sayısı: ${missingMigrations.length}`);
    console.log('Eksik migration\'lar:', missingMigrations);
    
    // Eksik migration'ları ekle
    for (const name of missingMigrations) {
      const batch = existingMigrations.length > 0 
        ? Math.max(...existingMigrations.map(m => m.batch)) + 1
        : 1;
      
      await db('knex_migrations').insert({
        name,
        batch,
        migration_time: new Date(),
      });
      
      console.log(`✓ ${name} eklendi`);
    }
    
    console.log('\nMigration\'lar başarıyla işaretlendi!');
    console.log('Şimdi sadece eksik migration\'ları çalıştırabilirsiniz: npm run migrate');
    
  } catch (error) {
    console.error('Hata:', error);
    throw error;
  } finally {
    await db.destroy();
  }
}

fixMigrations()
  .then(() => {
    console.log('İşlem tamamlandı.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('İşlem başarısız:', error);
    process.exit(1);
  });

