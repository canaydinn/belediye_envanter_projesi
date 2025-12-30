# Entegrasyon Testleri

Bu klasör, Express API'nin gerçek veritabanı ve HTTP istekleri ile test edildiği entegrasyon testlerini içerir.

## Kurulum

1. Test veritabanını oluşturun:
```sql
CREATE DATABASE belediye_envanter_test;
```

2. Test ortamı için environment variable'ları ayarlayın (opsiyonel):
```bash
TEST_DB_HOST=127.0.0.1
TEST_DB_PORT=5432
TEST_DB_USER=postgres
TEST_DB_PASSWORD=your_password
TEST_DB_NAME=belediye_envanter_test
```

3. Test veritabanına migrasyonları çalıştırın:
```bash
NODE_ENV=test npx knex migrate:latest
```

## Test Çalıştırma

### Tüm testleri çalıştır:
```bash
npm test
```

### Sadece entegrasyon testlerini çalıştır:
```bash
npm run test:integration
```

### Windows'ta environment variable ile:
```bash
npm run test:integration:env
```

### Watch mode (değişiklikleri izleyerek):
```bash
npm run test:watch
```

## Test Yapısı

- `auth.integration.test.js` - Auth endpoint'leri için entegrasyon testleri
- `users.integration.test.js` - Users endpoint'leri için entegrasyon testleri

## Helper'lar

- `testSetup.js` - Veritabanı setup/teardown, app instance
- `authHelper.js` - JWT token oluşturma, auth header'ları

## Notlar

- Her test öncesi veritabanı temizlenir
- Test veritabanı production veritabanından ayrı olmalıdır
- Gerçek veri testleri için seed data veya test data factory'leri kullanılabilir

