# Rol Bazlı UI Görünürlük Kuralları

Bu dokümantasyon, tüm kullanıcı türleri için UI görünürlük kurallarını açıklar.

## Rol Tanımları

| Rol ID | Rol Adı | Açıklama |
|--------|---------|----------|
| 1 | SUPERADMIN | Sistem süper admin (tüm belediyeler) |
| 2 | ADMIN | Belediye sistem yöneticisi |
| 3 | TASINIR_KAYIT | Taşınır kayıt yetkilisi |
| 4 | TASINIR_KONTROL | Taşınır kontrol yetkilisi |
| 5 | BIRIM_SORUMLUSU | Birim sorumlusu |
| 6 | KULLANICI | Normal kullanıcı |

---

## Menü Görünürlük Kuralları

### Dashboard
- **Görüntüleyebilen Roller**: Tüm roller (1-6)
- **Açıklama**: Herkes dashboard'u görebilir

### Varlıklar (Assets)
- **Görüntüleyebilen Roller**: Tüm roller (1-6)
- **Açıklama**: Herkes varlıkları görüntüleyebilir

### Varlık Hareketleri (Assets Movements)
- **Görüntüleyebilen Roller**: Tüm roller (1-6)
- **Açıklama**: Herkes varlık hareketlerini görüntüleyebilir

### Lokasyonlar (Locations)
- **Görüntüleyebilen Roller**: Tüm roller (1-6)
- **Açıklama**: Herkes lokasyonları görüntüleyebilir

### Kategoriler (Categories)
- **Görüntüleyebilen Roller**: Tüm roller (1-6)
- **Açıklama**: Herkes kategorileri görüntüleyebilir

### Kullanıcılar (Users)
- **Görüntüleyebilen Roller**: Sadece ADMIN (2) ve SUPERADMIN (1)
- **Açıklama**: Sadece sistem yöneticileri kullanıcı yönetimi sayfasını görebilir

### Profil (Profile)
- **Görüntüleyebilen Roller**: Tüm roller (1-6)
- **Açıklama**: Herkes kendi profilini görebilir

### Ayarlar (Settings)
- **Görüntüleyebilen Roller**: Tüm roller (1-6)
- **Açıklama**: Herkes ayarlar sayfasını görebilir

---

## Buton/Aksiyon Görünürlük Kuralları

### Varlık İşlemleri

#### "Yeni Varlık Ekle" Butonu
- **Görüntüleyebilen Roller**: ADMIN (2), TASINIR_KAYIT (3)
- **Sayfalar**: `assets.html`, `dashboard.html`
- **Açıklama**: Sadece admin ve taşınır kayıt yetkilisi yeni varlık ekleyebilir

#### "Varlık Düzenle" Butonu
- **Görüntüleyebilen Roller**: ADMIN (2), TASINIR_KAYIT (3), TASINIR_KONTROL (4)
- **Sayfalar**: `assets.html`, `asset-detail.html`
- **Açıklama**: Admin, kayıt ve kontrol yetkilisi varlıkları düzenleyebilir

#### "Varlık Sil" Butonu
- **Görüntüleyebilen Roller**: Sadece ADMIN (2)
- **Sayfalar**: `assets.html`, `asset-detail.html`
- **Açıklama**: Sadece admin varlık silebilir

#### "Varlık Onayla" Butonu
- **Görüntüleyebilen Roller**: ADMIN (2), TASINIR_KONTROL (4)
- **Sayfalar**: `assets.html`
- **Açıklama**: Sadece admin ve kontrol yetkilisi bekleyen varlıkları onaylayabilir

#### "Varlık Reddet" Butonu
- **Görüntüleyebilen Roller**: ADMIN (2), TASINIR_KONTROL (4)
- **Sayfalar**: `assets.html`
- **Açıklama**: Sadece admin ve kontrol yetkilisi bekleyen varlıkları reddedebilir

### Kullanıcı İşlemleri

#### "Yeni Kullanıcı Ekle" Butonu
- **Görüntüleyebilen Roller**: Sadece ADMIN (2)
- **Sayfalar**: `users.html`
- **Açıklama**: Sadece admin yeni kullanıcı ekleyebilir

#### "Kullanıcı Düzenle" Butonu
- **Görüntüleyebilen Roller**: Sadece ADMIN (2)
- **Sayfalar**: `users.html`, `municipality-user-detail.html`
- **Açıklama**: Sadece admin kullanıcı düzenleyebilir

#### "Kullanıcı Sil" Butonu
- **Görüntüleyebilen Roller**: Sadece ADMIN (2)
- **Sayfalar**: `users.html`
- **Açıklama**: Sadece admin kullanıcı silebilir

### Kategori İşlemleri

#### "Yeni Kategori Ekle" Butonu
- **Görüntüleyebilen Roller**: Sadece ADMIN (2)
- **Sayfalar**: `categories.html`
- **Açıklama**: Sadece admin yeni kategori ekleyebilir

#### "Kategori Düzenle" Butonu
- **Görüntüleyebilen Roller**: Sadece ADMIN (2)
- **Sayfalar**: `categories.html`, `category-detail.html`
- **Açıklama**: Sadece admin kategori düzenleyebilir

#### "Kategori Sil" Butonu
- **Görüntüleyebilen Roller**: Sadece ADMIN (2)
- **Sayfalar**: `categories.html`, `category-detail.html`
- **Açıklama**: Sadece admin kategori silebilir

### Lokasyon İşlemleri

#### "Yeni Lokasyon Ekle" Butonu
- **Görüntüleyebilen Roller**: Sadece ADMIN (2)
- **Sayfalar**: `locations.html`
- **Açıklama**: Sadece admin yeni lokasyon ekleyebilir

#### "Lokasyon Düzenle" Butonu
- **Görüntüleyebilen Roller**: Sadece ADMIN (2)
- **Sayfalar**: `locations.html`, `location-detail.html`
- **Açıklama**: Sadece admin lokasyon düzenleyebilir

#### "Lokasyon Sil" Butonu
- **Görüntüleyebilen Roller**: Sadece ADMIN (2)
- **Sayfalar**: `locations.html`, `location-detail.html`
- **Açıklama**: Sadece admin lokasyon silebilir

### Birim İşlemleri

#### "Yeni Birim Ekle" Butonu
- **Görüntüleyebilen Roller**: Sadece ADMIN (2)
- **Sayfalar**: `departments.html` (varsa)
- **Açıklama**: Sadece admin yeni birim ekleyebilir

#### "Birim Düzenle" Butonu
- **Görüntüleyebilen Roller**: Sadece ADMIN (2)
- **Açıklama**: Sadece admin birim düzenleyebilir

#### "Birim Sil" Butonu
- **Görüntüleyebilen Roller**: Sadece ADMIN (2)
- **Açıklama**: Sadece admin birim silebilir

### Varlık Hareket İşlemleri

#### "Yeni Hareket Oluştur" Butonu
- **Görüntüleyebilen Roller**: ADMIN (2), TASINIR_KAYIT (3), BIRIM_SORUMLUSU (5)
- **Sayfalar**: `assets-movements.html`, `assets.html`
- **Açıklama**: Admin, kayıt yetkilisi ve birim sorumlusu yeni hareket oluşturabilir

### Diğer İşlemler

#### "Toplu İçe Aktar" Butonu
- **Görüntüleyebilen Roller**: ADMIN (2), TASINIR_KAYIT (3)
- **Sayfalar**: `assets.html`, `bulk-import.html`
- **Açıklama**: Admin ve kayıt yetkilisi toplu içe aktarım yapabilir

---

## Sayfa Erişim Kontrolü

Eğer bir kullanıcı yetkisi olmayan bir sayfaya direkt URL ile erişmeye çalışırsa, otomatik olarak `dashboard.html` sayfasına yönlendirilir.

### Örnek Senaryolar:

1. **KULLANICI (6)** → `/admin/users.html` → ❌ Yönlendirilir → `/admin/dashboard.html`
2. **TASINIR_KAYIT (3)** → `/admin/users.html` → ❌ Yönlendirilir → `/admin/dashboard.html`
3. **ADMIN (2)** → `/admin/users.html` → ✅ Erişim verilir

---

## Teknik Detaylar

### Dosya Yapısı

- **Kontrol Dosyası**: `admin/assets/js/app/role-based-ui.js`
- **Yükleme**: Tüm HTML sayfalarında `<script src="/admin/assets/js/app/role-based-ui.js"></script>` ile yüklenir

### Çalışma Mantığı

1. Sayfa yüklendiğinde `initRoleBasedUI()` fonksiyonu çalışır
2. Kullanıcının rolü `/api/auth/me` endpoint'inden alınır
3. Rol bilgisi `localStorage`'a cache'lenir
4. Menü öğeleri ve butonlar rol bazlı gösterilir/gizlenir
5. Sayfa erişim kontrolü yapılır

### Cache Mekanizması

- Kullanıcı rolü `localStorage.getItem('user_role_id')` ile cache'lenir
- Sayfa yenilendiğinde cache'den okunur
- Logout yapıldığında cache temizlenir (logout.js'de yapılmalı)

---

## Test Senaryoları

### Senaryo 1: Normal Kullanıcı (KULLANICI - 6)

**Görebilecekleri:**
- ✅ Dashboard
- ✅ Varlıklar (sadece görüntüleme)
- ✅ Varlık Hareketleri (sadece görüntüleme)
- ✅ Lokasyonlar (sadece görüntüleme)
- ✅ Kategoriler (sadece görüntüleme)
- ✅ Profil
- ✅ Ayarlar

**Göremeyecekleri:**
- ❌ Kullanıcılar menüsü
- ❌ "Yeni Varlık Ekle" butonu
- ❌ "Varlık Düzenle" butonu
- ❌ "Varlık Sil" butonu
- ❌ "Varlık Onayla/Reddet" butonları
- ❌ Tüm yönetim butonları

### Senaryo 2: Taşınır Kayıt Yetkilisi (TASINIR_KAYIT - 3)

**Görebilecekleri:**
- ✅ Dashboard
- ✅ Varlıklar
- ✅ "Yeni Varlık Ekle" butonu
- ✅ "Varlık Düzenle" butonu (kendi eklediği varlıklar için)
- ✅ "Yeni Hareket Oluştur" butonu
- ✅ Varlık Hareketleri
- ✅ Lokasyonlar (sadece görüntüleme)
- ✅ Kategoriler (sadece görüntüleme)
- ✅ Profil
- ✅ Ayarlar

**Göremeyecekleri:**
- ❌ Kullanıcılar menüsü
- ❌ "Varlık Sil" butonu
- ❌ "Varlık Onayla/Reddet" butonları
- ❌ "Yeni Kategori/Lokasyon/Birim Ekle" butonları

### Senaryo 3: Taşınır Kontrol Yetkilisi (TASINIR_KONTROL - 4)

**Görebilecekleri:**
- ✅ Dashboard
- ✅ Varlıklar
- ✅ "Varlık Düzenle" butonu
- ✅ "Varlık Onayla/Reddet" butonları (bekleyen varlıklar için)
- ✅ Varlık Hareketleri
- ✅ Lokasyonlar (sadece görüntüleme)
- ✅ Kategoriler (sadece görüntüleme)
- ✅ Profil
- ✅ Ayarlar

**Göremeyecekleri:**
- ❌ Kullanıcılar menüsü
- ❌ "Yeni Varlık Ekle" butonu
- ❌ "Varlık Sil" butonu
- ❌ "Yeni Kategori/Lokasyon/Birim Ekle" butonları

### Senaryo 4: Birim Sorumlusu (BIRIM_SORUMLUSU - 5)

**Görebilecekleri:**
- ✅ Dashboard
- ✅ Varlıklar (sadece görüntüleme)
- ✅ "Yeni Hareket Oluştur" butonu (kendi birimi için)
- ✅ Varlık Hareketleri
- ✅ Lokasyonlar (sadece görüntüleme)
- ✅ Kategoriler (sadece görüntüleme)
- ✅ Profil
- ✅ Ayarlar

**Göremeyecekleri:**
- ❌ Kullanıcılar menüsü
- ❌ "Yeni Varlık Ekle" butonu
- ❌ "Varlık Düzenle/Sil" butonları
- ❌ "Varlık Onayla/Reddet" butonları
- ❌ Tüm yönetim butonları

### Senaryo 5: Admin (ADMIN - 2)

**Görebilecekleri:**
- ✅ Tüm menü öğeleri
- ✅ Tüm butonlar ve aksiyonlar
- ✅ Tam sistem yönetimi yetkisi

---

## Uygulama Durumu

✅ **Tamamlandı:**
- `role-based-ui.js` dosyası oluşturuldu
- Tüm ana sayfalara script eklendi
- Menü görünürlük kontrolü aktif
- Buton görünürlük kontrolü aktif
- Sayfa erişim kontrolü aktif

✅ **Güncellenen Sayfalar:**
- `assets.html`
- `dashboard.html`
- `users.html`
- `locations.html`
- `categories.html`
- `assets-movements.html`
- `create_asset.html`
- `create-users.html`
- `create-locations.html`
- `create-categories.html`
- `asset-edit.html`
- `asset-detail.html`
- `category-edit.html`
- `location-edit.html`
- `profile.html`
- `settings.html`

---

## Notlar

1. **Cache Temizleme**: Logout yapıldığında `localStorage.removeItem('user_role_id')` çağrılmalı
2. **Sayfa Yenileme**: Rol değişikliği yapıldığında sayfa yenilenmeli veya cache temizlenmeli
3. **Backend Kontrolü**: Frontend kontrolleri sadece UX içindir. Backend'de de yetkilendirme kontrolü yapılmalıdır.
