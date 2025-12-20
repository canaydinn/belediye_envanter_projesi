# Envanter360 API - Unit Test Matrisi (DB Tam Mock)

Bu doküman, **E2E öncesi** kapsamlı birim testlerini sistematik şekilde planlamak için hazırlanmıştır.

## Test yaklaşımı

- **Test runner:** Node.js 22 yerleşik `node:test`.
- **DB:** Tamamen mock (Knex query builder + transaction). Gerçek DB/ENV gerektirmez.
- **Hedef:** Controller/middleware/utils davranışını; doğrulama, yetkilendirme, tenant kapsamı, hata yönetimi, “happy path” ve kenar durumlar üzerinden doğrulamak.

## Mevcut eklenen örnek testler

- `src/middleware/*.test.js` (auth / authorize / tenantScope)
- `src/controllers/assets*.test.js` (createAsset / getStatusDistribution / updateAsset senaryoları)
- `src/utils/jwt.test.js`

Bu dosyalar, kalan modüller için **şablon** olarak kullanılabilir.

---

## Kapsam matrisi (önerilen minimum senaryo seti)

### 1) Middleware

**auth.js**
- Token yok → 401
- Bearer token var → doğrula + user yükle + `req.user` set + next
- Token geçersiz/süresi dolmuş → 401
- User bulunamadı/pasif → 401
- `originalUrl` admin alanı (cookie token) / api alanı (Bearer) kombinasyonları

**authorize.js**
- role_id izinli değil → 403
- role_id izinli → next

**tenantScope.js**
- Superadmin allowSuperadmin=true → next
- Tenant user municipality_id yok → 403
- Tenant user municipality_id var → `req.tenantMunicipalityId` set

**softAuth.js**
- Token yok → sessiz geçiş (next)
- Token geçerli → `req.user` set
- Token geçersiz → sessiz geçiş (next)

---

### 2) Controllers

Aşağıdaki her controller için ortak çekirdek senaryolar:

- **Validation:** zorunlu alanlar eksik → 400
- **Tenant scope:** municipality_id/tenantMunicipalityId uyumsuz → 403/404/400 (mevcut davranışa göre)
- **Not found:** id ile kayıt yok → 404
- **Happy path:** 200/201 + doğru payload
- **DB error:** knex/transaction hata fırlatır → 500 + error code/message
- **Pagination/filters:** query parametreleri yanlış/eksik → beklenen varsayılanlar

#### assets.controller.js
- createAsset:
  - required alanlar eksik → 400
  - category/department/location tenant dışı → 400
  - insert + asset_code üretimi + 201
  - transaction hata → 500
- listAssets:
  - filtreler (status, category_id, department_id, location_id, search)
  - pagination page/limit
- getAssetById:
  - tenant dışı erişim → 404
- updateAsset:
  - asset yok → 404
  - asset_code çakışması → 400
  - FK ref tenant dışı → 400
  - başarılı update → 200
- deleteAsset:
  - del count 0 → 404
  - del count 1 → 200
- getStatusDistribution:
  - boş sonuç → tüm statüler 0
  - karışık statüler → normalize map

#### assetMovements.controller.js
- createMovement:
  - required alanlar eksik → 400
  - asset/department/location tenant dışı → 400
  - insert + 201
  - unique/constraint hataları → 400/409 (mevcut koda göre)
- listMovements:
  - tarih aralığı, movement_type filtreleri
  - pagination
- recentMovements:
  - limit varsayılanı
  - boş liste

#### auth.controller.js
- login:
  - kullanıcı yok → 401
  - şifre yanlış → 401
  - kullanıcı pasif → 403/401
  - başarılı login → token üretimi + cookie ayarı + user payload
- logout:
  - cookie temizliği

#### users.controller.js
- createUser:
  - email/username unique çakışması
  - role_id doğrulama
  - municipality kapsamı
- listUsers:
  - tenant filter
- updateUser / deactivate:
  - id yok → 404

#### locations.controller.js / departments.controller.js / assetCategories.controller.js
- CRUD temel senaryolar
- isim/code unique çakışmaları
- tenant scope

#### municipalities.controller.js / superadmin.controller.js
- superadmin-only endpointler: authorize(1)
- plan_type/status değişimleri
- pagination + arama

#### maintenance.controller.js
- createTicket:
  - inventoryId/title zorunlu → 400
  - req.user.id kullanımı → 201
- listTickets:
  - filtreler (status, departmentId, priority)
- getUpcomingMaintenance:
  - municipalityId yok → 400

#### uploads.controller.js / qrcode.controller.js
- upload:
  - dosya yok → 400
  - kabul edilen mime/size
- qrcode:
  - içerik yok → 400
  - başarılı üretim → 200

#### reports.controller.js / dashboard.controller.js / audit.controller.js
- aggregation çıktıları:
  - boş veri → 0/empty set
  - tenant scope
  - tarih filtreleri

---

### 3) Utils

- jwt.js
  - generateToken payload doğruluğu
  - verifyToken delegasyonu

---

## Admin (Frontend) için öneri

Admin tarafındaki JS’ler çoğunlukla **tarayıcı script’i** olduğu için “gerçek unit test” için iki yol var:

1) **Refactor:** `parseJsonSafe`, `authFetch`, `fillSelect`, `setSelectState` gibi saf fonksiyonları bir `src/lib/*.js` modülüne çıkarıp export etmek.
2) **JSDOM tabanlı test:** DOM etkileşimli fonksiyonları JSDOM ile test etmek (Node runner ile mümkündür ama refactor olmadan zor).

Bu nedenle öncelik: API unit testleri (hızlı, deterministik, DB mock) → sonra UI bileşen testleri → en son E2E.
