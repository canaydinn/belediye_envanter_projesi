# Test Ortamı Kurulumu

## 1. Test Veritabanını Oluşturun

PostgreSQL'de test veritabanını oluşturun:

```sql
CREATE DATABASE belediye_envanter_test;
```

## 2. Test Veritabanına Migrasyonları Çalıştırın

Windows PowerShell'de:

```powershell
$env:NODE_ENV="test"
npx knex migrate:latest --knexfile knexfile.js
```

Veya CMD'de:

```cmd
set NODE_ENV=test
npx knex migrate:latest --knexfile knexfile.js
```

## 3. Test Veritabanı Bağlantı Bilgilerini Kontrol Edin

`knexfile.js` dosyasındaki test konfigürasyonunu kontrol edin:

```javascript
test: {
  client: 'pg',
  connection: {
    host: process.env.TEST_DB_HOST || '127.0.0.1',
    port: process.env.TEST_DB_PORT || 5432,
    user: process.env.TEST_DB_USER || 'postgres',
    password: process.env.TEST_DB_PASSWORD || '235689Derin',
    database: process.env.TEST_DB_NAME || 'belediye_envanter_test',
  },
  // ...
}
```

Gerekirse environment variable'ları ayarlayın veya `knexfile.js`'de doğrudan değiştirin.

## 4. Testleri Çalıştırın

```bash
npm run test:integration
```

## Sorun Giderme

### "Test database connection failed" hatası
- Test veritabanının oluşturulduğundan emin olun
- Bağlantı bilgilerini (host, port, user, password) kontrol edin
- PostgreSQL servisinin çalıştığından emin olun

### "Table does not exist" hatası
- Migrasyonların çalıştırıldığından emin olun
- `knex_migrations` tablosunun test veritabanında olduğunu kontrol edin

### "Foreign key constraint" hatası
- `cleanDatabase` fonksiyonu bu hataları yakalayacak şekilde güncellendi
- Eğer hala sorun yaşıyorsanız, test veritabanını silip yeniden oluşturun

