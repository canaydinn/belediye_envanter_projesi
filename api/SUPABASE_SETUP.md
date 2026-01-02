# Supabase Bağlantı Kurulumu

## Önemli: Connection String'i Supabase Dashboard'dan Alın

Timeout hatası alıyorsanız, Supabase Dashboard'dan doğru connection string'i almanız gerekiyor.

### Adımlar:

1. **Supabase Dashboard'a gidin:**
   - https://supabase.com/dashboard
   - Projenize giriş yapın

2. **Settings → Database bölümüne gidin**

3. **Connection string'i kopyalayın:**
   - "Connection string" bölümünde
   - "URI" formatını seçin
   - Connection string şu formatta olmalı:
     ```
     postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
     ```
   - VEYA direct connection için:
     ```
     postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require
     ```

4. **`.env` dosyanıza ekleyin:**
   ```env
   SUPABASE_DB_CONNECTION_STRING=postgresql://postgres:[PASSWORD]@...
   ```

5. **Test edin:**
   ```bash
   npm run migrate:status
   ```

## Alternatif: Ayrı Parametreler

Eğer connection string çalışmazsa, ayrı parametreleri kullanabilirsiniz:

```env
SUPABASE_DB_HOST=db.qdmyveocfdjvpqziswxk.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your_password_here
SUPABASE_DB_NAME=postgres
SUPABASE_DB_SSL=true
```

**Not:** Host genellikle `db.[PROJECT_REF].supabase.co` formatındadır, `[PROJECT_REF].supabase.co` değil.

## Connection Pooling (Önerilen)

Supabase'de connection pooling kullanmak için port **6543** kullanın:

```env
SUPABASE_DB_PORT=6543
```

## Sorun Giderme

### ETIMEDOUT Hatası
- Supabase projenizin aktif olduğundan emin olun (paused değil)
- Database password'ün doğru olduğundan emin olun
- Firewall veya network sorunlarını kontrol edin
- Supabase Dashboard'dan connection string'i kopyalayın

### "The pool is probably full" Hatası
- Pool ayarlarını kontrol edin (`knexfile.js`)
- Connection string kullanmayı deneyin
- Supabase connection pooling portunu (6543) kullanın

## Mevcut Ayarlar

Proje URL: `https://qdmyveocfdjvpqziswxk.supabase.co`
API Key: `sb_publishable_KdlV-rlywoxShqaYbtPEiA_q-Izzm4-`

Database password'ü Supabase Dashboard → Settings → Database bölümünden alabilirsiniz.

