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
      min: 2,
      max: 10,
      createTimeoutMillis: 10000,
      acquireTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
    },
  },
};