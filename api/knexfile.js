require('dotenv').config();

// Supabase connection string oluştur
function getConnection() {
  // Eğer connection string varsa onu kullan
  if (process.env.SUPABASE_DB_CONNECTION_STRING) {
    const connString = process.env.SUPABASE_DB_CONNECTION_STRING;
    // Connection string içinde "host=host" veya "@host:" gibi yanlış değerler olabilir, kontrol et
    if (connString.includes('host=host') || 
        connString.includes('hostname=host') || 
        connString.includes('@host:') ||
        connString.includes('@host/')) {
      console.error('❌ SUPABASE_DB_CONNECTION_STRING içinde geçersiz host değeri tespit edildi!');
      console.error('❌ Connection String:', connString.replace(/:[^:@]+@/, ':****@')); // Password'u gizle
      throw new Error('SUPABASE_DB_CONNECTION_STRING içinde geçersiz host değeri ("host" kelimesi). Lütfen Vercel environment variables\'da connection string\'i düzeltin. Format: postgresql://user:password@db.xxxxx.supabase.co:5432/dbname');
    }
    return connString;
  }
  
  // Aksi halde connection object kullan
  const host = process.env.SUPABASE_DB_HOST || 'db.qdmyveocfdjvpqziswxk.supabase.co';
  
  // Host değerini validate et
  if (!host || host === 'host' || host.trim() === '') {
    console.error('❌ SUPABASE_DB_HOST geçersiz:', host);
    throw new Error(`SUPABASE_DB_HOST geçersiz: "${host}". Lütfen Vercel environment variables\'da SUPABASE_DB_HOST değerini kontrol edin.`);
  }
  
  // Debug log (production'da da görünür Vercel logs'da)
  if (process.env.NODE_ENV === 'production') {
    console.log('🔍 DB Connection Config:', {
      host: host,
      port: process.env.SUPABASE_DB_PORT || '5432',
      user: process.env.SUPABASE_DB_USER || 'postgres',
      database: process.env.SUPABASE_DB_NAME || 'postgres',
      hasPassword: !!process.env.SUPABASE_DB_PASSWORD
    });
  }
  
  return {
    host: host,
    port: parseInt(process.env.SUPABASE_DB_PORT || '5432'),
    user: process.env.SUPABASE_DB_USER || 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD,
    database: process.env.SUPABASE_DB_NAME || 'postgres',
    ssl: process.env.SUPABASE_DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
    connectTimeout: 10000, // 10 saniye timeout
    statement_timeout: 10000,
  };
}

module.exports = {
  development: {
    client: 'pg',
    connection: getConnection(),
    migrations: {
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
    pool: {
      min: 0,
      max: 5,
      createTimeoutMillis: 30000,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 2000,
    },
  },
  production: {
    client: 'pg',
    connection: getConnection(),
    migrations: {
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
    pool: {
      min: 0,
      max: 10,
      createTimeoutMillis: 30000,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 2000,
    },
  },
  test: {
    client: 'pg',
    connection: {
      host: process.env.TEST_DB_HOST || process.env.SUPABASE_DB_HOST || 'qdmyveocfdjvpqziswxk.supabase.co',
      port: parseInt(process.env.TEST_DB_PORT || process.env.SUPABASE_DB_PORT || '5432'),
      user: process.env.TEST_DB_USER || process.env.SUPABASE_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASSWORD || process.env.SUPABASE_DB_PASSWORD,
      database: process.env.TEST_DB_NAME || 'belediye_envanter_test',
      ssl: process.env.SUPABASE_DB_SSL !== 'false' ? { rejectUnauthorized: false } : false,
      connectTimeout: 10000,
      statement_timeout: 10000,
    },
    migrations: {
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
    pool: {
      min: 1,
      max: 1,
      createTimeoutMillis: 10000,
      acquireTimeoutMillis: 10000,
    },
  },
};