/**
 * QR Code Routes Integration Tests
 * 
 * Bu dosya QR code endpoint'lerinin gerçek veritabanı ve Express app ile
 * entegrasyon testlerini içerir.
 * 
 * Özellikle POST /api/qrcode/scan endpoint'i için detaylı testler içerir.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupTestDb, teardownTestDb, cleanDatabase, getTestApp, getTestDb, runMigrations } = require('../helpers/testSetup');
const { getAuthHeader } = require('../helpers/authHelper');

// Test başlamadan önce setup
test.before(async () => {
  await setupTestDb();
  // Migrasyonları çalıştır (tablolar yoksa oluşturur)
  try {
    await runMigrations();
  } catch (err) {
    console.warn('Warning: Migrations may have already been run:', err.message);
  }
  await cleanDatabase();
});

// Test bittikten sonra cleanup
test.after(async () => {
  await cleanDatabase();
  await teardownTestDb();
});

// Her testten önce veritabanını temizle
test.beforeEach(async () => {
  await cleanDatabase();
});

// ============================================================================
// POST /api/qrcode/scan ENDPOINT TESTS
// ============================================================================

test('POST /api/qrcode/scan -> should return 400 when code is missing', async () => {
  const app = getTestApp();
  const response = await request(app)
    .post('/api/qrcode/scan')
    .set(getAuthHeader({ id: 1, role_id: 3 }))
    .send({})
    .expect(400);

  assert.ok(response.body);
  assert.equal(response.body.error, 'VALIDATION_ERROR');
  assert.ok(response.body.message.includes('code alanı zorunludur'));
});

test('POST /api/qrcode/scan -> should return 400 when code is empty string', async () => {
  const app = getTestApp();
  const response = await request(app)
    .post('/api/qrcode/scan')
    .set(getAuthHeader({ id: 1, role_id: 3 }))
    .send({ code: '' })
    .expect(400);

  assert.ok(response.body);
  assert.equal(response.body.error, 'VALIDATION_ERROR');
});

test('POST /api/qrcode/scan -> should return 404 when inventory not found', async () => {
  const app = getTestApp();
  const response = await request(app)
    .post('/api/qrcode/scan')
    .set(getAuthHeader({ id: 1, role_id: 3 }))
    .send({ code: 'NONEXISTENT-CODE-123' })
    .expect(404);

  assert.ok(response.body);
  assert.equal(response.body.error, 'INVENTORY_NOT_FOUND');
  assert.ok(response.body.message.includes('eşleşen envanter bulunamadı'));
});

test('POST /api/qrcode/scan -> should return 200 and find inventory by asset_tag', async () => {
  const app = getTestApp();
  const db = getTestDb();

  // Önce gerekli bağımlı verileri oluştur (municipality, category, department, location)
  const [municipality] = await db('municipalities').insert({
    name: 'Test Belediyesi',
    email: 'test@belediye.gov.tr',
    status: 'active',
  }).returning('id');

  const [category] = await db('asset_categories').insert({
    code: 'TEST-CAT-001',
    name: 'Test Kategori',
    municipality_id: municipality.id,
  }).returning('id');

  const [department] = await db('departments').insert({
    name: 'Test Departmanı',
    municipality_id: municipality.id,
  }).returning('id');

  const [location] = await db('locations').insert({
    name: 'Test Lokasyon',
    municipality_id: municipality.id,
  }).returning('id');

  // Test için inventory_items kaydı oluştur
  // Not: Controller'da inventory_items tablosu kullanılıyor, asset_tag alanı aranıyor
  // Eğer inventory_items tablosu yoksa, assets tablosunu kullanıp asset_code'u asset_tag olarak ekleyebiliriz
  const assetTag = 'TEST-ASSET-TAG-001';
  const serialNumber = 'TEST-SN-001';
  
  // Önce inventory_items tablosunun varlığını kontrol et
  const inventoryItemsTableExists = await db.schema.hasTable('inventory_items');
  
  let inventoryItem;
  if (inventoryItemsTableExists) {
    // inventory_items tablosu varsa, oraya kayıt ekle
    // Önce gerekli alanları kontrol etmek için bir test sorgusu yapabiliriz
    [inventoryItem] = await db('inventory_items').insert({
      asset_tag: assetTag,
      serial_number: serialNumber,
      name: 'Test Envanter Öğesi',
      description: 'Entegrasyon testi için oluşturuldu',
      // Diğer gerekli alanlar varsa eklenebilir
    }).returning('*');
  } else {
    // inventory_items tablosu yoksa, assets tablosuna kayıt ekle
    // asset_code'u asset_tag olarak kullanabiliriz veya asset_tag alanı ekleyebiliriz
    [inventoryItem] = await db('assets').insert({
      asset_code: assetTag, // asset_code'u asset_tag olarak kullan
      name: 'Test Envanter Öğesi',
      description: 'Entegrasyon testi için oluşturuldu',
      category_id: category.id,
      department_id: department.id,
      location_id: location.id,
      serial_number: serialNumber,
      status: 'active',
      is_qr_tagged: true,
      municipality_id: municipality.id,
      quantity: 1,
      unit: 'Adet',
      asset_type: 'demirbas',
    }).returning('*');
    
    // Eğer assets tablosunda asset_tag alanı yoksa, asset_code'u asset_tag olarak kullanmak için
    // bir view veya alias oluşturulabilir, ya da direkt asset_code kullanılabilir
    // Şimdilik asset_code'u kullanıyoruz
  }

  // POST /api/qrcode/scan isteği gönder
  const response = await request(app)
    .post('/api/qrcode/scan')
    .set(getAuthHeader({ id: 1, role_id: 3, municipality_id: municipality.id }))
    .send({ code: assetTag })
    .expect(200);

  // Response'u doğrula
  assert.ok(response.body);
  assert.ok(response.body.inventory, 'Response should contain inventory object');
  assert.equal(response.status, 200, 'HTTP status should be 200');
  
  // asset_tag veya asset_code kontrolü (tablo yapısına göre)
  const returnedTag = response.body.inventory.asset_tag || response.body.inventory.asset_code;
  assert.equal(returnedTag, assetTag, 'Returned asset tag/code should match');
  assert.equal(response.body.inventory.name, 'Test Envanter Öğesi');
  assert.equal(response.body.inventory.serial_number || response.body.inventory.serialNumber, serialNumber);

  // Veritabanında kaydın hala var olduğunu doğrula
  // Not: Mevcut controller implementasyonunda güncelleme yapılmıyor, sadece okuma var
  // Eğer gelecekte scan işlemi sırasında bir güncelleme (örn. last_scanned_at) eklenecekse,
  // bu test o zaman güncellenebilir
  let dbRecord;
  if (inventoryItemsTableExists) {
    dbRecord = await db('inventory_items')
      .where({ id: inventoryItem.id })
      .first();
  } else {
    dbRecord = await db('assets')
      .where({ id: inventoryItem.id })
      .first();
  }
  
  assert.ok(dbRecord, 'Veritabanında kayıt bulunmalı');
  assert.equal(dbRecord.asset_tag || dbRecord.asset_code, assetTag);
  assert.equal(dbRecord.name, 'Test Envanter Öğesi');
  
  // Kaydın değişmediğini doğrula (güncelleme yapılmadığı için)
  // Eğer gelecekte güncelleme eklenecekse, burada güncellenen alanları kontrol edebiliriz
});

test('POST /api/qrcode/scan -> should return 200 and find inventory by serial_number', async () => {
  const app = getTestApp();
  const db = getTestDb();

  // Önce gerekli bağımlı verileri oluştur
  const [municipality] = await db('municipalities').insert({
    name: 'Test Belediyesi 2',
    email: 'test2@belediye.gov.tr',
    status: 'active',
  }).returning('id');

  const [category] = await db('asset_categories').insert({
    code: 'TEST-CAT-002',
    name: 'Test Kategori 2',
    municipality_id: municipality.id,
  }).returning('id');

  const [department] = await db('departments').insert({
    name: 'Test Departmanı 2',
    municipality_id: municipality.id,
  }).returning('id');

  const [location] = await db('locations').insert({
    name: 'Test Lokasyon 2',
    municipality_id: municipality.id,
  }).returning('id');

  const assetTag = 'TEST-ASSET-TAG-002';
  const serialNumber = 'TEST-SN-002';
  
  // assets tablosuna kayıt ekle
  const [inventoryItem] = await db('assets').insert({
    asset_code: assetTag,
    name: 'Test Envanter Öğesi 2',
    description: 'Serial number ile test',
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
    serial_number: serialNumber,
    status: 'active',
    is_qr_tagged: true,
    municipality_id: municipality.id,
    quantity: 1,
    unit: 'Adet',
    asset_type: 'demirbas',
  }).returning('*');

  // POST /api/qrcode/scan isteği gönder (serial_number ile)
  const response = await request(app)
    .post('/api/qrcode/scan')
    .set(getAuthHeader({ id: 1, role_id: 3, municipality_id: municipality.id }))
    .send({ code: serialNumber })
    .expect(200);

  // Response'u doğrula
  assert.ok(response.body);
  assert.ok(response.body.inventory);
  assert.equal(
    response.body.inventory.serial_number || response.body.inventory.serialNumber,
    serialNumber
  );
  assert.equal(response.body.inventory.name, 'Test Envanter Öğesi 2');

  // Veritabanında kaydın hala var olduğunu doğrula
  const dbRecord = await db('assets')
    .where({ id: inventoryItem.id })
    .first();
  
  assert.ok(dbRecord, 'Veritabanında kayıt bulunmalı');
  assert.equal(dbRecord.serial_number, serialNumber);
});

test('POST /api/qrcode/scan -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .post('/api/qrcode/scan')
    .send({ code: 'TEST-CODE' })
    .expect(401);

  assert.ok(response.body);
});

test('POST /api/qrcode/scan -> should return correct JSON format with all required fields', async () => {
  const app = getTestApp();
  const db = getTestDb();

  // Test verisi oluştur
  const [municipality] = await db('municipalities').insert({
    name: 'Test Belediyesi 3',
    email: 'test3@belediye.gov.tr',
    status: 'active',
  }).returning('id');

  const [category] = await db('asset_categories').insert({
    code: 'TEST-CAT-003',
    name: 'Test Kategori 3',
    municipality_id: municipality.id,
  }).returning('id');

  const [department] = await db('departments').insert({
    name: 'Test Departmanı 3',
    municipality_id: municipality.id,
  }).returning('id');

  const [location] = await db('locations').insert({
    name: 'Test Lokasyon 3',
    municipality_id: municipality.id,
  }).returning('id');

  const assetTag = 'TEST-ASSET-TAG-003';
  
  await db('assets').insert({
    asset_code: assetTag,
    name: 'Test Envanter Öğesi 3',
    description: 'JSON format testi',
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
    serial_number: 'TEST-SN-003',
    status: 'active',
    is_qr_tagged: true,
    municipality_id: municipality.id,
    quantity: 1,
    unit: 'Adet',
    asset_type: 'demirbas',
  });

  // POST /api/qrcode/scan isteği gönder
  const response = await request(app)
    .post('/api/qrcode/scan')
    .set(getAuthHeader({ id: 1, role_id: 3, municipality_id: municipality.id }))
    .send({ code: assetTag })
    .expect(200);

  // JSON formatını doğrula
  assert.ok(response.body);
  assert.ok(response.body.inventory, 'Response should have inventory field');
  assert.ok(typeof response.body.inventory === 'object', 'inventory should be an object');
  
  // Envanter objesinin temel alanlarını kontrol et
  assert.ok(response.body.inventory.id !== undefined, 'inventory should have id');
  assert.ok(response.body.inventory.name !== undefined, 'inventory should have name');
  
  // Response'un JSON formatında olduğunu doğrula
  assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
});

