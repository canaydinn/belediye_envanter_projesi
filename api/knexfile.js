require('dotenv').config();

// Supabase connection string oluştur
function getConnection() {
  // Eğer connection string varsa onu kullan
  if (process.env.SUPABASE_DB_CONNECTION_STRING) {
    return process.env.SUPABASE_DB_CONNECTION_STRING;
  }
  
  // Aksi halde connection object kullan
  return {
    host: process.env.SUPABASE_DB_HOST || 'qdmyveocfdjvpqziswxk.supabase.co',
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