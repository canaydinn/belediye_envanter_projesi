# Entegrasyon Test Planı

Bu doküman, projede yapılabilecek entegrasyon testlerini öncelik sırasına göre listeler.

## ✅ Tamamlanan Testler

1. **Auth Integration Tests** (`auth.integration.test.js`)
   - Login, signup, logout, me endpoint'leri
   - Token doğrulama
   - Hata durumları

2. **QR Code Integration Tests** (`qrcode.integration.test.js`)
   - POST /api/qrcode/scan endpoint'i
   - Asset tag ve serial number ile arama

3. **Users Integration Tests** (`users.integration.test.js`)
   - Temel yapı oluşturuldu (genişletilebilir)

4. **Dashboard Integration Tests** (`dashboard.integration.test.js`)
   - GET /api/dashboard/stats - Belediye istatistikleri
   - GET /api/dashboard/municipality - Belediye bilgileri
   - GET /api/dashboard/recent-movements - Son hareketler
   - GET /api/dashboard/category-distribution - Kategori dağılımı
   - GET /api/dashboard/upcoming-maintenance - Yaklaşan bakımlar
   - Tenant scope kontrolü
   - Veri doğruluğu testleri

## 🎯 Öncelikli Testler (Yapılması Önerilen)

### 1. Assets/Inventory Integration Tests ⭐⭐⭐
**Öncelik: ÇOK YÜKSEK**
- **Dosya:** `assets.integration.test.js`
- **Test Senaryoları:**
  - ✅ POST /api/assets - Yeni envanter oluşturma
  - ✅ GET /api/assets - Envanter listesi
  - ✅ GET /api/assets/:id - Envanter detayı
  - ✅ PUT /api/assets/:id - Envanter güncelleme
  - ✅ DELETE /api/assets/:id - Envanter silme
  - ✅ Filtreleme ve arama
  - ✅ Tenant scope kontrolü (kullanıcı sadece kendi belediyesinin verilerini görmeli)
  - ✅ Validation hataları

**Neden Önemli:** Sistemin temel modülü, en çok kullanılan endpoint'ler

---

### 2. Locations Integration Tests ⭐⭐⭐
**Öncelik: YÜKSEK**
- **Dosya:** `locations.integration.test.js`
- **Test Senaryoları:**
  - ✅ POST /api/locations - Yeni lokasyon oluşturma
  - ✅ GET /api/locations - Lokasyon listesi
  - ✅ GET /api/locations/:id - Lokasyon detayı
  - ✅ PUT /api/locations/:id - Lokasyon güncelleme
  - ✅ DELETE /api/locations/:id - Lokasyon silme
  - ✅ GET /api/locations/stats - Lokasyon istatistikleri
  - ✅ GET /api/locations/search - Lokasyon arama
  - ✅ Foreign key constraint'leri (assets ile ilişki)

**Neden Önemli:** Assets ile yakından ilişkili, sık kullanılan modül

---

### 3. Asset Movements Integration Tests ⭐⭐
**Öncelik: YÜKSEK**
- **Dosya:** `asset-movements.integration.test.js`
- **Test Senaryoları:**
  - ✅ POST /api/asset-movements - Yeni hareket oluşturma (zimmet, transfer)
  - ✅ GET /api/asset-movements - Hareket listesi
  - ✅ GET /api/asset-movements/:id - Hareket detayı
  - ✅ Hareket onaylama/reddetme
  - ✅ Asset durum güncellemeleri (hareket sonrası)
  - ✅ From/to location kontrolü
  - ✅ From/to user kontrolü

**Neden Önemli:** İş mantığı açısından kritik, karmaşık işlemler içeriyor

---

### 4. Inventory Integration Tests ⭐⭐
**Öncelik: ORTA-YÜKSEK**
- **Dosya:** `inventory.integration.test.js`
- **Test Senaryoları:**
  - ✅ POST /api/inventory - Yeni envanter kaydı
  - ✅ GET /api/inventory - Envanter listesi
  - ✅ GET /api/inventory/:id - Envanter detayı
  - ✅ PUT /api/inventory/:id - Envanter güncelleme
  - ✅ Stok miktarı güncellemeleri
  - ✅ Quantity kontrolü

**Neden Önemli:** Assets ile ilişkili, stok yönetimi için kritik

---

### 5. Asset Categories Integration Tests ⭐
**Öncelik: ORTA**
- **Dosya:** `asset-categories.integration.test.js`
- **Test Senaryoları:**
  - ✅ POST /api/asset-categories - Yeni kategori oluşturma
  - ✅ GET /api/asset-categories - Kategori listesi
  - ✅ GET /api/asset-categories/:id - Kategori detayı
  - ✅ PUT /api/asset-categories/:id - Kategori güncelleme
  - ✅ DELETE /api/asset-categories/:id - Kategori silme
  - ✅ Foreign key kontrolü (assets ile ilişki)

---

### 6. Departments Integration Tests ⭐
**Öncelik: ORTA**
- **Dosya:** `departments.integration.test.js`
- **Test Senaryoları:**
  - ✅ POST /api/departments - Yeni departman oluşturma
  - ✅ GET /api/departments - Departman listesi
  - ✅ GET /api/departments/:id - Departman detayı
  - ✅ PUT /api/departments/:id - Departman güncelleme
  - ✅ DELETE /api/departments/:id - Departman silme
  - ✅ Tenant scope kontrolü

---

### 7. Maintenance Integration Tests ⭐
**Öncelik: ORTA**
- **Dosya:** `maintenance.integration.test.js`
- **Test Senaryoları:**
  - ✅ POST /api/maintenance - Yeni bakım kaydı oluşturma
  - ✅ GET /api/maintenance - Bakım kayıtları listesi
  - ✅ GET /api/maintenance/:id - Bakım kaydı detayı
  - ✅ PUT /api/maintenance/:id - Bakım kaydı güncelleme
  - ✅ Bakım durumu güncellemeleri
  - ✅ Asset ile ilişki kontrolü

---

### 8. Dashboard Integration Tests ⭐
**Öncelik: DÜŞÜK-ORTA**
- **Dosya:** `dashboard.integration.test.js`
- **Test Senaryoları:**
  - ✅ GET /api/dashboard/stats - Dashboard istatistikleri
  - ✅ GET /api/dashboard/municipality - Belediye bilgileri
  - ✅ GET /api/dashboard/recent-movements - Son hareketler
  - ✅ GET /api/dashboard/category-distribution - Kategori dağılımı
  - ✅ GET /api/dashboard/upcoming-maintenance - Yaklaşan bakımlar
  - ✅ Veri doğruluğu (istatistiklerin doğru hesaplanması)
  - ✅ Tenant scope kontrolü

---

### 9. Reports Integration Tests ⭐
**Öncelik: DÜŞÜK**
- **Dosya:** `reports.integration.test.js`
- **Test Senaryoları:**
  - ✅ GET /api/reports/... - Çeşitli rapor endpoint'leri
  - ✅ Filtreleme parametreleri
  - ✅ Tarih aralığı kontrolleri
  - ✅ Export işlemleri (eğer varsa)

---

### 10. Profile Integration Tests ⭐
**Öncelik: DÜŞÜK**
- **Dosya:** `profile.integration.test.js`
- **Test Senaryoları:**
  - ✅ GET /api/profile - Kullanıcı profili
  - ✅ PUT /api/profile - Profil güncelleme
  - ✅ POST /api/profile/change-password - Şifre değiştirme
  - ✅ Validation kontrolleri

---

## 🔧 Test Helper'ları

Mevcut helper'lar:
- `testSetup.js` - Veritabanı setup/teardown
- `authHelper.js` - JWT token oluşturma

**Eklenebilecek Helper'lar:**
- `dataFactory.js` - Test verisi oluşturma (municipality, user, asset, location vb.)
- `dbHelper.js` - Veritabanı işlemleri için yardımcı fonksiyonlar

---

## 📝 Test Yazım İpuçları

1. **Her test bağımsız olmalı** - Testler birbirini etkilememeli
2. **Gerçek veritabanı kullan** - Mock kullanma, gerçek DB işlemleri test et
3. **Tenant scope'u test et** - Multi-tenant yapı için kritik
4. **Foreign key ilişkilerini test et** - Veri bütünlüğü için önemli
5. **Hata durumlarını test et** - Sadece başarılı senaryolar değil
6. **Validation'ları test et** - Girdi doğrulama kontrolleri

---

## 🚀 Hızlı Başlangıç

Yeni bir entegrasyon testi yazmak için:

1. `api/src/__tests__/integration/` klasöründe yeni dosya oluştur
2. Mevcut test dosyalarını (örn: `auth.integration.test.js`) referans al
3. Test setup'ı kullan: `setupTestDb`, `cleanDatabase`, `getTestApp`
4. Auth helper kullan: `getAuthHeader` ile token oluştur
5. Test verilerini oluştur (municipality, user, vb.)
6. HTTP isteklerini `supertest` ile gönder
7. Assertion'ları yap

---

## 📊 Test Kapsamı Hedefi

- **Yüksek Öncelikli:** %100 test kapsamı
- **Orta Öncelikli:** %80 test kapsamı
- **Düşük Öncelikli:** %60 test kapsamı

