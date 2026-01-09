# Envanter Onay Sistemi Test Rehberi

## 1. Veritabanı Kontrolü

Supabase SQL Editor'de şu sorguları çalıştırarak migration'ın başarılı olduğunu kontrol edin:

```sql
-- 1. Yeni kolonların varlığını kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assets' 
AND column_name IN ('approval_status', 'approved_by_user_id', 'approved_at');

-- 2. user_departments tablosunu kontrol et
SELECT * FROM user_departments LIMIT 5;

-- 3. users tablosunda primary_department_id kolonunu kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'primary_department_id';

-- 4. Mevcut envanterlerin onay durumunu kontrol et
SELECT id, name, approval_status, created_by_user_id, approved_by_user_id 
FROM assets 
ORDER BY id DESC 
LIMIT 10;
```

## 2. Test Kullanıcıları Oluşturma

### Senaryo 1: Taşınır Kayıt Yetkilisi
1. Admin paneline giriş yapın
2. `/admin/create-users.html` sayfasına gidin
3. Yeni kullanıcı oluşturun:
   - **Rol**: Taşınır Kayıt (role_id: 3)
   - **Birim**: Bir birim seçin
   - **Diğer bilgileri** doldurun

### Senaryo 2: Taşınır Kontrol Yetkilisi
1. Aynı sayfada yeni kullanıcı oluşturun:
   - **Rol**: Taşınır Kontrol (role_id: 4)
   - **Birim**: Bir birim seçin
   - **Diğer bilgileri** doldurun

## 3. Test Senaryoları

### Test 1: Yeni Envanter Ekleme (Taşınır Kayıt Yetkilisi)

1. **Taşınır Kayıt Yetkilisi** olarak giriş yapın
2. `/admin/create_asset.html` sayfasına gidin
3. Yeni bir envanter ekleyin:
   - Varlık adı: "Test Bilgisayar"
   - Kategori, Birim, Lokasyon seçin
   - Diğer bilgileri doldurun
   - **Kaydet** butonuna tıklayın

**Beklenen Sonuç:**
- Envanter başarıyla oluşturulur
- `approval_status = 'pending'` olarak kaydedilir
- `/admin/assets.html` sayfasında "Beklemede" badge'i görünür

**Kontrol:**
```sql
SELECT id, name, approval_status, created_by_user_id 
FROM assets 
WHERE name = 'Test Bilgisayar';
```

### Test 2: Bekleyen Envanterleri Görüntüleme

1. **Taşınır Kontrol Yetkilisi** olarak giriş yapın
2. `/admin/assets.html` sayfasına gidin
3. "Onay Durumu" filtresinden **"Beklemede"** seçin
4. **Filtrele** butonuna tıklayın

**Beklenen Sonuç:**
- Sadece `approval_status = 'pending'` olan envanterler listelenir
- Her envanterin yanında **Onay** (✓) ve **Red** (✗) butonları görünür

### Test 3: Envanter Onaylama

1. **Taşınır Kontrol Yetkilisi** olarak giriş yapın
2. `/admin/assets.html` sayfasında bekleyen bir envanter bulun
3. Yeşil **✓ (Onayla)** butonuna tıklayın
4. Onay mesajını onaylayın

**Beklenen Sonuç:**
- "Envanter başarıyla onaylandı" mesajı gösterilir
- Envanterin `approval_status` değeri `'approved'` olur
- `approved_by_user_id` kontrol yetkilisinin ID'si olur
- `approved_at` şimdiki zaman olur
- Liste otomatik yenilenir ve badge "Onaylandı" (yeşil) olur

**Kontrol:**
```sql
SELECT id, name, approval_status, approved_by_user_id, approved_at 
FROM assets 
WHERE approval_status = 'approved' 
ORDER BY approved_at DESC 
LIMIT 5;
```

### Test 4: Envanter Reddetme

1. **Taşınır Kontrol Yetkilisi** olarak giriş yapın
2. `/admin/assets.html` sayfasında bekleyen bir envanter bulun
3. Kırmızı **✗ (Reddet)** butonuna tıklayın
4. Red nedeni girin (opsiyonel)
5. Onay mesajını onaylayın

**Beklenen Sonuç:**
- "Envanter reddedildi" mesajı gösterilir
- Envanterin `approval_status` değeri `'rejected'` olur
- `approved_by_user_id` kontrol yetkilisinin ID'si olur
- `approved_at` şimdiki zaman olur
- Liste otomatik yenilenir ve badge "Reddedildi" (kırmızı) olur

### Test 5: Normal Kullanıcı Yetkisi Kontrolü

1. **Normal Kullanıcı** (role_id: 6) olarak giriş yapın
2. `/admin/assets.html` sayfasına gidin
3. Bekleyen envanterleri görüntüleyin

**Beklenen Sonuç:**
- Envanterleri görebilir
- Onay durumu badge'lerini görebilir
- **AMA** Onay/Red butonlarını **GÖREMEZ** (sadece kontrol yetkilisi görebilir)

### Test 6: API Endpoint Testleri

#### 6.1. Bekleyen Envanterleri Listele
```bash
# Terminal'de veya Postman'de
curl -X GET "http://localhost:4000/api/assets?approval_status=pending" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

**Beklenen Sonuç:**
- Sadece `approval_status: 'pending'` olan envanterler döner

#### 6.2. Envanter Onayla
```bash
curl -X POST "http://localhost:4000/api/assets/123/approve" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Beklenen Sonuç:**
```json
{
  "message": "Envanter başarıyla onaylandı",
  "asset": {
    "id": 123,
    "approval_status": "approved",
    "approved_by_user_id": 5,
    "approved_at": "2025-01-03T10:30:00.000Z"
  }
}
```

#### 6.3. Envanter Reddet
```bash
curl -X POST "http://localhost:4000/api/assets/123/reject" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Eksik bilgi var"}'
```

## 4. Hata Senaryoları Testleri

### Test 7: Zaten Onaylanmış Envanteri Tekrar Onaylama

1. Zaten onaylanmış bir envanteri tekrar onaylamayı deneyin

**Beklenen Sonuç:**
- Hata mesajı: "Bu envanter zaten onaylanmış durumda"
- Status: 400 Bad Request

### Test 8: Yetkisiz Kullanıcı Onay Denemesi

1. **Normal Kullanıcı** olarak giriş yapın
2. API'ye direkt onay isteği gönderin

**Beklenen Sonuç:**
- Status: 403 Forbidden
- Mesaj: "Bu işlem için yetkiniz yok"

## 5. Frontend Görsel Kontrolleri

### Kontrol Listesi:
- [ ] Onay durumu kolonu tabloda görünüyor mu?
- [ ] Beklemede envanterler sarı badge gösteriyor mu?
- [ ] Onaylanmış envanterler yeşil badge gösteriyor mu?
- [ ] Reddedilmiş envanterler kırmızı badge gösteriyor mu?
- [ ] Kontrol yetkilisi onay/red butonlarını görebiliyor mu?
- [ ] Normal kullanıcı onay/red butonlarını göremiyor mu?
- [ ] Onay durumu filtresi çalışıyor mu?
- [ ] Bildirim mesajları gösteriliyor mu?

## 6. Veritabanı Kontrol Sorguları

### Tüm Onay Durumlarını Görüntüle
```sql
SELECT 
  approval_status,
  COUNT(*) as count
FROM assets
GROUP BY approval_status;
```

### Onaylanmış Envanterler (Son 10)
```sql
SELECT 
  a.id,
  a.name,
  a.approval_status,
  u1.full_name as created_by,
  u2.full_name as approved_by,
  a.approved_at
FROM assets a
LEFT JOIN users u1 ON a.created_by_user_id = u1.id
LEFT JOIN users u2 ON a.approved_by_user_id = u2.id
WHERE a.approval_status = 'approved'
ORDER BY a.approved_at DESC
LIMIT 10;
```

### Bekleyen Envanterler
```sql
SELECT 
  a.id,
  a.name,
  a.created_at,
  u.full_name as created_by
FROM assets a
LEFT JOIN users u ON a.created_by_user_id = u.id
WHERE a.approval_status = 'pending'
ORDER BY a.created_at ASC;
```

## 7. Hızlı Test Senaryosu (5 Dakika)

1. **Admin** olarak giriş yap
2. Yeni **Taşınır Kayıt Yetkilisi** oluştur (role_id: 3)
3. Yeni **Taşınır Kontrol Yetkilisi** oluştur (role_id: 4)
4. **Taşınır Kayıt Yetkilisi** olarak çıkış yap, yeni kullanıcı ile giriş yap
5. Yeni bir envanter ekle → `pending` durumunda olmalı
6. **Taşınır Kontrol Yetkilisi** olarak çıkış yap, kontrol yetkilisi ile giriş yap
7. `/admin/assets.html` → "Onay Durumu: Beklemede" filtresi uygula
8. Bekleyen envanteri bul → Onayla butonuna tıkla
9. Envanterin "Onaylandı" (yeşil) badge gösterdiğini kontrol et

## 8. Sorun Giderme

### Problem: Onay butonları görünmüyor
**Çözüm:**
- Kullanıcının rolünü kontrol edin (ADMIN veya TASINIR_KONTROL olmalı)
- Browser console'da hata var mı kontrol edin
- `assets-approval.js` dosyasının yüklendiğinden emin olun

### Problem: API 403 hatası veriyor
**Çözüm:**
- Token'ın geçerli olduğundan emin olun
- Kullanıcının rolünü kontrol edin
- Backend'de route yetkilendirmesini kontrol edin

### Problem: Onay durumu badge'i görünmüyor
**Çözüm:**
- API'den gelen veride `approval_status` alanının olduğundan emin olun
- Browser console'da `renderApprovalStatusBadge` fonksiyonunun tanımlı olduğunu kontrol edin

## 9. Test Sonuçları Kaydetme

Test sonuçlarını bu formatta kaydedin:

```
Test Tarihi: [TARİH]
Test Eden: [İSİM]

✅ Test 1: Yeni Envanter Ekleme - BAŞARILI
✅ Test 2: Bekleyen Envanterleri Görüntüleme - BAŞARILI
✅ Test 3: Envanter Onaylama - BAŞARILI
✅ Test 4: Envanter Reddetme - BAŞARILI
✅ Test 5: Normal Kullanıcı Yetkisi - BAŞARILI
❌ Test 6: [HATA VARSA AÇIKLA]
```
