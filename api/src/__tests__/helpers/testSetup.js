/**
 * Test Setup Helper
 * 
 * Bu dosya entegrasyon testleri için gerekli setup ve teardown işlemlerini sağlar:
 * - Test veritabanı bağlantısı
 * - Express app instance'ı
 * - Test verilerini temizleme
 */

const knex = require('knex');
const knexConfig = require('../../../knexfile');
const app = require('../../app');

// Test ortamı için veritabanı bağlantısı
const getTestDb = () => {
  // Test ortamı için her zaman 'test' config'ini kullan
  const config = knexConfig.test;
  
  if (!config) {
    throw new Error(`Test database configuration not found. Please add 'test' config to knexfile.js`);
  }
  
  return knex(config);
};

// Test veritabanı instance'ı
let testDb = null;

/**
 * Test veritabanı bağlantısını başlatır
 */
const setupTestDb = async () => {
  if (!testDb) {
    try {
      testDb = getTestDb();
      // Bağlantıyı test et
      await testDb.raw('SELECT 1');
    } catch (err) {
      throw new Error(`Test database connection failed: ${err.message}. Please ensure test database exists and migrations are run.`);
    }
  }
  return testDb;
};

/**
 * Test veritabanı bağlantısını kapatır
 */
const teardownTestDb = async () => {
  if (testDb) {
    await testDb.destroy();
    testDb = null;
  }
};

/**
 * Tüm tabloları temizler (TRUNCATE CASCADE kullanarak)
 * Foreign key constraint'lerini devre dışı bırakarak deadlock'u önler
 */
const cleanDatabase = async () => {
  if (!testDb) {
    await setupTestDb();
  }
  
  try {
    // Önce tabloların varlığını kontrol et
    const tables = await testDb.raw(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'knex%'
      ORDER BY tablename;
    `);
    
    // Eğer tablo yoksa, sadece return et (hata verme)
    if (!tables.rows || tables.rows.length === 0) {
      return;
    }
    
    // Foreign key constraint'lerini geçici olarak devre dışı bırak
    // Bu, deadlock'u önler ve CASCADE ile tüm bağımlı kayıtları siler
    await testDb.raw('SET session_replication_role = replica;');
    
    // Tüm tabloları tek bir transaction içinde temizle
    // CASCADE ile foreign key constraint'leri otomatik olarak yönetilir
    const tableNames = tables.rows.map(row => `"${row.tablename}"`).join(', ');
    try {
      await testDb.transaction(async (trx) => {
        await trx.raw(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);
      });
    } catch (err) {
      // Eğer toplu truncate başarısız olursa, tek tek dene
      for (const row of tables.rows) {
        try {
          await testDb.transaction(async (trx) => {
            await trx.raw(`TRUNCATE TABLE "${row.tablename}" RESTART IDENTITY CASCADE;`);
          });
        } catch (singleErr) {
          // Bazı tablolar truncate edilemeyebilir, devam et
          if (!singleErr.message || !singleErr.message.includes('deadlock')) {
            console.warn(`Warning: Could not truncate table ${row.tablename}:`, singleErr.message);
          }
        }
      }
    }
    
    // Foreign key constraint'lerini tekrar etkinleştir
    await testDb.raw('SET session_replication_role = DEFAULT;');
  } catch (err) {
    // Veritabanı bağlantı hatası veya tablo yoksa, hata verme
    // Test ortamında tablolar henüz oluşturulmamış olabilir
    if (err.message && !err.message.includes('deadlock')) {
      console.warn('Warning: Could not clean database:', err.message);
    }
  }
};

/**
 * Migrasyonları çalıştırır
 */
const runMigrations = async () => {
  if (!testDb) {
    await setupTestDb();
  }
  await testDb.migrate.latest();
  
  // Test veritabanında purchase_price kolonunun decimal olduğundan emin ol
  try {
    const columnInfo = await testDb.raw(`
      SELECT data_type, udt_name
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'assets' 
      AND column_name = 'purchase_price'
    `);
    
    if (columnInfo.rows && columnInfo.rows.length > 0) {
      const dataType = columnInfo.rows[0].data_type;
      const udtName = columnInfo.rows[0].udt_name;
      
      // PostgreSQL'de integer için data_type 'integer', decimal için 'numeric'
      if (dataType === 'integer' || udtName === 'int4') {
        console.log('Fixing purchase_price column type from integer to decimal...');
        // purchase_price integer ise decimal'e çevir
        await testDb.raw(`
          ALTER TABLE assets 
          ALTER COLUMN purchase_price TYPE DECIMAL(14, 2) USING purchase_price::DECIMAL(14, 2)
        `);
        console.log('purchase_price column type fixed to DECIMAL(14, 2)');
      }
    }
  } catch (err) {
    // Kolon yoksa veya hata varsa devam et
    console.warn('Warning: Could not check/fix purchase_price column type:', err.message);
  }
  
  // Locations tablosunda type, latitude, longitude kolonlarının varlığını kontrol et
  try {
    const locationColumns = await testDb.raw(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'locations'
      AND column_name IN ('type', 'latitude', 'longitude')
    `);
    
    const existingColumns = locationColumns.rows.map(row => row.column_name);
    
    // type kolonu yoksa ekle veya tipini kontrol et
    if (!existingColumns.includes('type')) {
      console.log('Adding type column to locations table...');
      await testDb.raw(`
        ALTER TABLE locations 
        ADD COLUMN type INTEGER
      `);
      console.log('type column added to locations table');
    } else {
      // type kolonu varsa tipini kontrol et
      const typeColumnInfo = await testDb.raw(`
        SELECT data_type, udt_name
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'locations' 
        AND column_name = 'type'
      `);
      
      if (typeColumnInfo.rows && typeColumnInfo.rows.length > 0) {
        const dataType = typeColumnInfo.rows[0].data_type;
        const udtName = typeColumnInfo.rows[0].udt_name;
        
        // Eğer character(1) veya char(1) ise INTEGER'a çevir
        if (dataType === 'character' || dataType === 'character varying' || udtName === 'bpchar' || udtName === 'varchar') {
          console.log('Fixing type column from character to integer...');
          await testDb.raw(`
            ALTER TABLE locations 
            ALTER COLUMN type TYPE INTEGER USING CASE 
              WHEN type ~ '^[0-9]+$' THEN type::INTEGER 
              ELSE NULL 
            END
          `);
          console.log('type column fixed to INTEGER');
        }
      }
    }
    
    // latitude kolonu yoksa ekle
    if (!existingColumns.includes('latitude')) {
      console.log('Adding latitude column to locations table...');
      await testDb.raw(`
        ALTER TABLE locations 
        ADD COLUMN latitude DECIMAL(10, 8)
      `);
      console.log('latitude column added to locations table');
    }
    
    // longitude kolonu yoksa ekle
    if (!existingColumns.includes('longitude')) {
      console.log('Adding longitude column to locations table...');
      await testDb.raw(`
        ALTER TABLE locations 
        ADD COLUMN longitude DECIMAL(11, 8)
      `);
      console.log('longitude column added to locations table');
    }
  } catch (err) {
    // Kolonlar zaten varsa veya hata varsa devam et
    console.warn('Warning: Could not check/add locations columns:', err.message);
  }
  
  // maintenance_requests tablosunun varlığını kontrol et ve oluştur
  try {
    const tableExists = await testDb.raw(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'maintenance_requests'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('Creating maintenance_requests table...');
      await testDb.raw(`
        CREATE TABLE maintenance_requests (
          id SERIAL PRIMARY KEY,
          municipality_id INTEGER NOT NULL,
          asset_id INTEGER NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          priority VARCHAR(50) NOT NULL DEFAULT 'medium',
          status VARCHAR(50) NOT NULL DEFAULT 'open',
          due_date TIMESTAMP,
          assigned_to_user_id INTEGER,
          created_by_user_id INTEGER NOT NULL,
          updated_by_user_id INTEGER NOT NULL,
          completed_by_user_id INTEGER,
          completed_at TIMESTAMP,
          resolution_note TEXT,
          requested_at TIMESTAMP,
          started_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      console.log('maintenance_requests table created');
    } else {
      // Tablo varsa eksik kolonları ekle
      try {
        const columns = await testDb.raw(`
          SELECT column_name
          FROM information_schema.columns 
          WHERE table_schema = 'public'
          AND table_name = 'maintenance_requests'
          AND column_name IN ('requested_at', 'started_at', 'assigned_to_user_id')
        `);
        
        const existingColumns = columns.rows.map(row => row.column_name);
        
        if (!existingColumns.includes('requested_at')) {
          await testDb.raw(`ALTER TABLE maintenance_requests ADD COLUMN requested_at TIMESTAMP;`);
        }
        if (!existingColumns.includes('started_at')) {
          await testDb.raw(`ALTER TABLE maintenance_requests ADD COLUMN started_at TIMESTAMP;`);
        }
        // assigned_to_user_id kolonu yoksa, assigned_to_id'yi kontrol et
        if (!existingColumns.includes('assigned_to_user_id')) {
          const assignedToIdExists = await testDb.raw(`
            SELECT column_name
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND table_name = 'maintenance_requests'
            AND column_name = 'assigned_to_id'
          `);
          if (!assignedToIdExists.rows || assignedToIdExists.rows.length === 0) {
            await testDb.raw(`ALTER TABLE maintenance_requests ADD COLUMN assigned_to_user_id INTEGER;`);
          }
        }
      } catch (alterErr) {
        // Kolonlar zaten varsa veya hata varsa devam et
        console.warn('Warning: Could not add maintenance_requests columns:', alterErr.message);
      }
    }
  } catch (err) {
    // Tablo zaten varsa veya hata varsa devam et
    console.warn('Warning: Could not check/create maintenance_requests table:', err.message);
  }
};

/**
 * Seed'leri çalıştırır
 */
const runSeeds = async () => {
  if (!testDb) {
    await setupTestDb();
  }
  await testDb.seed.run();
};

/**
 * Test için Express app instance'ı döndürür
 */
const getTestApp = () => {
  return app;
};

// Test veritabanı instance'ına erişim için
const getTestDbInstance = () => testDb;

module.exports = {
  setupTestDb,
  teardownTestDb,
  cleanDatabase,
  runMigrations,
  runSeeds,
  getTestApp,
  getTestDb: getTestDbInstance,
};

