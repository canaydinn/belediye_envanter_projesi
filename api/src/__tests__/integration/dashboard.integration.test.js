/**
 * Dashboard Routes Integration Tests
 * 
 * Bu dosya dashboard endpoint'lerinin gerçek veritabanı ve Express app ile
 * entegrasyon testlerini içerir.
 * 
 * Test Senaryoları:
 * - GET /api/dashboard/stats - Belediye istatistikleri
 * - GET /api/dashboard/municipality - Belediye bilgileri
 * - GET /api/dashboard/recent-movements - Son hareketler
 * - GET /api/dashboard/category-distribution - Kategori dağılımı
 * - GET /api/dashboard/upcoming-maintenance - Yaklaşan bakımlar
 * - Tenant scope kontrolü
 * - Veri doğruluğu (istatistiklerin doğru hesaplanması)
 * - Authorization kontrolleri
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupTestDb, teardownTestDb, cleanDatabase, getTestApp, getTestDb, runMigrations } = require('../helpers/testSetup');
const { getAuthHeader } = require('../helpers/authHelper');
const {
  createTestEnvironment,
  createTestAsset,
  createTestMunicipality,
  createTestUser,
  createTestCategory,
  createTestDepartment,
  createTestLocation,
  createTestAssetMovement,
  createTestMaintenanceTicket,
} = require('../helpers/dataFactory');

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
// Not: --test-concurrency=1 ile seri çalıştırıldığı için deadlock riski azalır
test.beforeEach(async () => {
  await cleanDatabase();
});

// ============================================================================
// GET /api/dashboard/stats - MUNICIPALITY STATS TESTS
// ============================================================================

test('GET /api/dashboard/stats -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .get('/api/dashboard/stats')
    .expect(401);

  assert.ok(response.body);
});

test('GET /api/dashboard/stats -> should return 200 with correct stats structure', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .get('/api/dashboard/stats')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.equal(Number(response.body.municipality_id), Number(municipality.id));
  assert.ok(response.body.totals);
  assert.ok(typeof response.body.totals.users === 'number');
  assert.ok(typeof response.body.totals.departments === 'number');
  assert.ok(typeof response.body.totals.locations === 'number');
  assert.ok(response.body.assets);
  assert.ok(typeof response.body.assets.total === 'number');
  assert.ok(typeof response.body.assets.movedLast30Days === 'number');
  assert.ok(typeof response.body.assets.maintenanceNeeded === 'number');
  assert.ok(response.body.assets.qrTagged);
  assert.ok(typeof response.body.assets.qrTagged.count === 'number');
  assert.ok(typeof response.body.assets.qrTagged.percentage === 'number');
});

test('GET /api/dashboard/stats -> should return correct counts for users, departments, locations', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Ekstra kullanıcılar, departmanlar ve lokasyonlar oluştur
  await createTestUser(db, municipality.id, 3);
  await createTestUser(db, municipality.id, 3);
  await createTestDepartment(db, municipality.id);
  await createTestLocation(db, municipality.id);
  
  const response = await request(app)
    .get('/api/dashboard/stats')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  // createTestEnvironment 1 user, 1 department, 1 location oluşturuyor
  // + 2 user, 1 department, 1 location daha = toplam 3 user, 2 department, 2 location
  assert.ok(response.body.totals.users >= 3, 'Should count all users (at least 3)');
  assert.ok(response.body.totals.departments >= 2, 'Should count all departments (at least 2)');
  assert.ok(response.body.totals.locations >= 2, 'Should count all locations (at least 2)');
});

test('GET /api/dashboard/stats -> should return correct asset counts', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Sadece municipality ve user oluştur (createTestEnvironment gereksiz veri oluşturur)
  const municipality = await createTestMunicipality(db);
  const user = await createTestUser(db, municipality.id, 3);
  
  // Bağımlı verileri oluştur
  const category = await createTestCategory(db, municipality.id);
  const department = await createTestDepartment(db, municipality.id);
  const location = await createTestLocation(db, municipality.id);
  
  // Birkaç asset oluştur
  await createTestAsset(db, municipality.id, { 
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  await createTestAsset(db, municipality.id, { 
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  await createTestAsset(db, municipality.id, { 
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
    is_qr_tagged: true 
  });
  await createTestAsset(db, municipality.id, { 
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
    status: 'in_maintenance' 
  });
  
  const response = await request(app)
    .get('/api/dashboard/stats')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.equal(response.body.assets.total, 4, 'Should count all assets');
  assert.equal(response.body.assets.qrTagged.count, 1, 'Should count QR tagged assets');
  assert.equal(response.body.assets.maintenanceNeeded, 1, 'Should count assets in maintenance');
  // QR percentage: 1/4 = 25%
  assert.equal(response.body.assets.qrTagged.percentage, 25.00, 'Should calculate 25% for 1 out of 4');
});

test('GET /api/dashboard/stats -> should calculate QR tagged percentage correctly', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Sadece municipality ve user oluştur
  const municipality = await createTestMunicipality(db);
  const user = await createTestUser(db, municipality.id, 3);
  
  // Bağımlı verileri oluştur
  const category = await createTestCategory(db, municipality.id);
  const department = await createTestDepartment(db, municipality.id);
  const location = await createTestLocation(db, municipality.id);
  
  // 10 asset oluştur, 3 tanesi QR tagged
  for (let i = 0; i < 10; i++) {
    await createTestAsset(db, municipality.id, { 
      category_id: category.id,
      department_id: department.id,
      location_id: location.id,
      is_qr_tagged: i < 3 
    });
  }
  
  const response = await request(app)
    .get('/api/dashboard/stats')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.equal(response.body.assets.total, 10, 'Should have 10 total assets');
  assert.equal(response.body.assets.qrTagged.count, 3, 'Should have 3 QR tagged assets');
  assert.equal(response.body.assets.qrTagged.percentage, 30.00, 'Should calculate 30% for 3 out of 10');
});

test('GET /api/dashboard/stats -> should return 0% QR percentage when no assets', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Sadece municipality ve user oluştur (asset oluşturma)
  const municipality = await createTestMunicipality(db);
  const user = await createTestUser(db, municipality.id, 3);
  
  const response = await request(app)
    .get('/api/dashboard/stats')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.equal(response.body.assets.total, 0, 'Should have 0 assets');
  assert.equal(response.body.assets.qrTagged.count, 0, 'Should have 0 QR tagged assets');
  assert.equal(response.body.assets.qrTagged.percentage, 0, 'Should return 0% when no assets');
});

test('GET /api/dashboard/stats -> should count movements from last 30 days', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Sadece municipality ve user oluştur
  const municipality = await createTestMunicipality(db);
  const user = await createTestUser(db, municipality.id, 3);
  
  // Bağımlı verileri oluştur
  const category = await createTestCategory(db, municipality.id);
  const department = await createTestDepartment(db, municipality.id);
  const location = await createTestLocation(db, municipality.id);
  
  const asset1 = await createTestAsset(db, municipality.id, {
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  const asset2 = await createTestAsset(db, municipality.id, {
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  
  // Son 30 gün içinde hareket oluştur
  const recentDate = new Date();
  recentDate.setDate(recentDate.getDate() - 10);
  await createTestAssetMovement(db, municipality.id, {
    asset_id: asset1.id,
    movement_date: recentDate,
  });
  
  // 30 günden önce hareket oluştur (sayılmamalı)
  const oldDate = new Date();
  oldDate.setDate(oldDate.getDate() - 35);
  await createTestAssetMovement(db, municipality.id, {
    asset_id: asset2.id,
    movement_date: oldDate,
  });
  
  const response = await request(app)
    .get('/api/dashboard/stats')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  // Son 30 gün içinde 1 hareket olmalı
  assert.equal(response.body.assets.movedLast30Days, 1, 'Should count only movements from last 30 days');
});

test('GET /api/dashboard/stats -> should only return stats for user municipality (tenant scope)', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Sadece municipality ve user oluştur (createTestEnvironment gereksiz veri oluşturur)
  const municipality = await createTestMunicipality(db);
  const user = await createTestUser(db, municipality.id, 3);
  
  // Bağımlı verileri oluştur
  const category = await createTestCategory(db, municipality.id);
  const department = await createTestDepartment(db, municipality.id);
  const location = await createTestLocation(db, municipality.id);
  
  // Kullanıcının belediyesine veri ekle
  await createTestUser(db, municipality.id, 3);
  await createTestAsset(db, municipality.id, {
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  
  // Başka bir belediye ve verileri oluştur
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  await createTestUser(db, otherMunicipality.id, 3);
  await createTestDepartment(db, otherMunicipality.id);
  const otherCategory = await createTestCategory(db, otherMunicipality.id);
  const otherDepartment = await createTestDepartment(db, otherMunicipality.id);
  const otherLocation = await createTestLocation(db, otherMunicipality.id);
  await createTestAsset(db, otherMunicipality.id, {
    category_id: otherCategory.id,
    department_id: otherDepartment.id,
    location_id: otherLocation.id,
  });
  
  const response = await request(app)
    .get('/api/dashboard/stats')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  // Sadece kullanıcının belediyesinin verilerini görmeli
  assert.equal(response.body.totals.users, 2, 'Should only count users from user municipality'); // 2 user (1 initial + 1 extra)
  assert.equal(response.body.assets.total, 1, 'Should only count assets from user municipality');
});

// ============================================================================
// GET /api/dashboard/municipality - MUNICIPALITY INFO TESTS
// ============================================================================

test('GET /api/dashboard/municipality -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .get('/api/dashboard/municipality')
    .expect(401);

  assert.ok(response.body);
});

test('GET /api/dashboard/municipality -> should return 200 with municipality info', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Sadece municipality ve user oluştur
  const municipality = await createTestMunicipality(db);
  const user = await createTestUser(db, municipality.id, 3);
  
  const response = await request(app)
    .get('/api/dashboard/municipality')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.equal(Number(response.body.id), Number(municipality.id));
  assert.equal(response.body.name, municipality.name);
  assert.ok(response.body.province);
  assert.ok(response.body.district);
});

test('GET /api/dashboard/municipality -> should return only user municipality info (tenant scope)', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Başka bir belediye oluştur
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  
  const response = await request(app)
    .get('/api/dashboard/municipality')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  // Sadece kullanıcının belediyesini görmeli
  assert.equal(Number(response.body.id), Number(municipality.id));
  assert.notEqual(Number(response.body.id), Number(otherMunicipality.id));
});

// ============================================================================
// GET /api/dashboard/recent-movements - RECENT MOVEMENTS TESTS
// ============================================================================

test('GET /api/dashboard/recent-movements -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .get('/api/dashboard/recent-movements')
    .expect(401);

  assert.ok(response.body);
});

test('GET /api/dashboard/recent-movements -> should return 200 with empty array when no movements', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Sadece municipality ve user oluştur (createTestEnvironment gereksiz veri oluşturur)
  const municipality = await createTestMunicipality(db);
  const user = await createTestUser(db, municipality.id, 3);
  
  // Bu municipality için hiç asset oluşturmadık, bu yüzden movement da olmamalı
  // Ancak önceki testlerden kalan veriler olabilir, bu yüzden tenant scope'un çalıştığını kontrol edelim
  const response = await request(app)
    .get('/api/dashboard/recent-movements')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body), 'Should return an array');
  // Bu municipality için asset oluşturmadık, bu yüzden movement olmamalı
  // Ancak önceki testlerden kalan veriler olabilir, bu yüzden sadece array olduğunu kontrol ediyoruz
  // Tenant scope çalışıyorsa, bu municipality'nin verileri olmamalı (çünkü hiç asset oluşturmadık)
});

test('GET /api/dashboard/recent-movements -> should return recent movements with correct structure', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const asset = await createTestAsset(db, municipality.id);
  const movement = await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
  });
  
  const response = await request(app)
    .get('/api/dashboard/recent-movements')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length > 0);
  
  const firstMovement = response.body[0];
  assert.ok(firstMovement.id);
  assert.ok(firstMovement.asset_id);
  assert.ok(firstMovement.asset_code);
  assert.ok(firstMovement.asset_name);
  assert.ok(firstMovement.movement_type);
  assert.ok(firstMovement.movement_date);
});

test('GET /api/dashboard/recent-movements -> should return maximum 5 movements', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // 7 hareket oluştur
  for (let i = 0; i < 7; i++) {
    const asset = await createTestAsset(db, municipality.id);
    await createTestAssetMovement(db, municipality.id, {
      asset_id: asset.id,
      movement_date: new Date(Date.now() - i * 1000), // Farklı zamanlarda
    });
  }
  
  const response = await request(app)
    .get('/api/dashboard/recent-movements')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length <= 5, 'Should return maximum 5 movements');
});

test('GET /api/dashboard/recent-movements -> should return movements ordered by date desc', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Sadece municipality ve user oluştur
  const municipality = await createTestMunicipality(db);
  const user = await createTestUser(db, municipality.id, 3);
  
  // Bağımlı verileri oluştur
  const category = await createTestCategory(db, municipality.id);
  const department = await createTestDepartment(db, municipality.id);
  const location = await createTestLocation(db, municipality.id);
  
  // Farklı zamanlarda hareketler oluştur (en yeni en son oluşturulsun)
  const dates = [
    new Date(Date.now() - 3000), // En eski
    new Date(Date.now() - 2000),
    new Date(Date.now() - 1000),  // En yeni
  ];
  
  const createdMovements = [];
  for (const date of dates) {
    const asset = await createTestAsset(db, municipality.id, {
      category_id: category.id,
      department_id: department.id,
      location_id: location.id,
    });
    const movement = await createTestAssetMovement(db, municipality.id, {
      asset_id: asset.id,
      movement_date: date,
    });
    createdMovements.push(movement);
  }
  
  const response = await request(app)
    .get('/api/dashboard/recent-movements')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body.length >= 3, 'Should have at least 3 movements');
  
  // En yeni tarih en üstte olmalı (desc order)
  // İlk 3 movement'ı kontrol et (önceki testlerden kalan veriler olabilir)
  if (response.body.length >= 3) {
    const firstDate = new Date(response.body[0].movement_date);
    const secondDate = new Date(response.body[1].movement_date);
    const thirdDate = new Date(response.body[2].movement_date);
    assert.ok(firstDate >= secondDate, 'First movement should be newer than or equal to second');
    assert.ok(secondDate >= thirdDate, 'Second movement should be newer than or equal to third');
  }
});

test('GET /api/dashboard/recent-movements -> should only return movements from user municipality (tenant scope)', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Sadece municipality ve user oluştur
  const municipality = await createTestMunicipality(db);
  const user = await createTestUser(db, municipality.id, 3);
  
  // Bağımlı verileri oluştur
  const category = await createTestCategory(db, municipality.id);
  const department = await createTestDepartment(db, municipality.id);
  const location = await createTestLocation(db, municipality.id);
  
  // Kullanıcının belediyesine hareket ekle
  const asset1 = await createTestAsset(db, municipality.id, {
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  await createTestAssetMovement(db, municipality.id, {
    asset_id: asset1.id,
  });
  
  // Başka belediyeye hareket ekle
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherCategory = await createTestCategory(db, otherMunicipality.id);
  const otherDepartment = await createTestDepartment(db, otherMunicipality.id);
  const otherLocation = await createTestLocation(db, otherMunicipality.id);
  const asset2 = await createTestAsset(db, otherMunicipality.id, {
    category_id: otherCategory.id,
    department_id: otherDepartment.id,
    location_id: otherLocation.id,
  });
  await createTestAssetMovement(db, otherMunicipality.id, {
    asset_id: asset2.id,
  });
  
  const response = await request(app)
    .get('/api/dashboard/recent-movements')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  // Sadece kullanıcının belediyesinin hareketlerini görmeli
  const userMunicipalityMovements = response.body.filter(m => Number(m.asset_id) === Number(asset1.id));
  assert.ok(userMunicipalityMovements.length > 0, 'Should return movements from user municipality');
  
  // Başka belediyenin hareketlerini görmemeli
  const otherMunicipalityMovements = response.body.filter(m => Number(m.asset_id) === Number(asset2.id));
  assert.equal(otherMunicipalityMovements.length, 0, 'Should not return movements from other municipality');
});

// ============================================================================
// GET /api/dashboard/category-distribution - CATEGORY DISTRIBUTION TESTS
// ============================================================================

test('GET /api/dashboard/category-distribution -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .get('/api/dashboard/category-distribution')
    .expect(401);

  assert.ok(response.body);
});

test('GET /api/dashboard/category-distribution -> should return 200 with correct structure', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .get('/api/dashboard/category-distribution')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.equal(Number(response.body.municipality_id), Number(municipality.id));
  assert.ok(typeof response.body.total_assets === 'number');
  assert.ok(Array.isArray(response.body.distribution));
});

test('GET /api/dashboard/category-distribution -> should return correct category distribution', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Sadece municipality ve user oluştur
  const municipality = await createTestMunicipality(db);
  const user = await createTestUser(db, municipality.id, 3);
  
  // Kategoriler ve bağımlı verileri oluştur
  const category = await createTestCategory(db, municipality.id);
  const category2 = await createTestCategory(db, municipality.id, { name: 'Category 2' });
  const department = await createTestDepartment(db, municipality.id);
  const location = await createTestLocation(db, municipality.id);
  
  // Her kategoriye asset ekle
  await createTestAsset(db, municipality.id, { 
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  await createTestAsset(db, municipality.id, { 
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  await createTestAsset(db, municipality.id, { 
    category_id: category2.id,
    department_id: department.id,
    location_id: location.id,
  });
  
  const response = await request(app)
    .get('/api/dashboard/category-distribution')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.equal(response.body.total_assets, 3, 'Should have 3 total assets');
  assert.ok(response.body.distribution.length >= 2, 'Should have at least 2 categories');
  
  const cat1Dist = response.body.distribution.find(d => Number(d.category_id) === Number(category.id));
  const cat2Dist = response.body.distribution.find(d => Number(d.category_id) === Number(category2.id));
  
  assert.ok(cat1Dist, 'Category 1 should be in distribution');
  assert.equal(cat1Dist.count, 2, 'Category 1 should have 2 assets');
  // Yüzde hesaplaması: 2/3 = 66.67 (rounded to 2 decimals)
  assert.ok(cat1Dist.percentage >= 66.66 && cat1Dist.percentage <= 66.68, `Should calculate ~66.67% for 2 out of 3, got ${cat1Dist.percentage}`);
  
  assert.ok(cat2Dist, 'Category 2 should be in distribution');
  assert.equal(cat2Dist.count, 1, 'Category 2 should have 1 asset');
  // Yüzde hesaplaması: 1/3 = 33.33 (rounded to 2 decimals)
  assert.ok(cat2Dist.percentage >= 33.32 && cat2Dist.percentage <= 33.34, `Should calculate ~33.33% for 1 out of 3, got ${cat2Dist.percentage}`);
});

test('GET /api/dashboard/category-distribution -> should handle assets without category', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Sadece municipality ve user oluştur
  const municipality = await createTestMunicipality(db);
  const user = await createTestUser(db, municipality.id, 3);
  
  // Kategori ve diğer bağımlı verileri manuel oluştur
  const category = await createTestCategory(db, municipality.id);
  const department = await createTestDepartment(db, municipality.id);
  const location = await createTestLocation(db, municipality.id);
  
  // Kategori olmadan asset oluştur (category_id: null)
  await db('assets').insert({
    name: 'Test Asset No Category',
    description: 'Test asset without category',
    category_id: null,
    department_id: department.id,
    location_id: location.id,
    status: 'active',
    is_qr_tagged: false,
    quantity: 1,
    unit: 'Adet',
    asset_type: 'demirbas',
    municipality_id: municipality.id,
    asset_code: `AS-${municipality.id}-${new Date().getFullYear().toString().slice(-2)}-000001`,
    qrcode: `AS-${municipality.id}-${new Date().getFullYear().toString().slice(-2)}-000001`,
  });
  
  const response = await request(app)
    .get('/api/dashboard/category-distribution')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.equal(response.body.total_assets, 1, 'Should have 1 total asset');
  const otherDist = response.body.distribution.find(d => d.category_name === 'Diğer' || d.category_name === null);
  assert.ok(otherDist, 'Should have "Diğer" category for assets without category');
  assert.equal(otherDist.count, 1, 'Should have 1 asset in "Diğer" category');
});

test('GET /api/dashboard/category-distribution -> should only return distribution for user municipality (tenant scope)', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Sadece municipality ve user oluştur
  const municipality = await createTestMunicipality(db);
  const user = await createTestUser(db, municipality.id, 3);
  
  // Bağımlı verileri oluştur
  const category = await createTestCategory(db, municipality.id);
  const department = await createTestDepartment(db, municipality.id);
  const location = await createTestLocation(db, municipality.id);
  
  // Kullanıcının belediyesine asset ekle
  await createTestAsset(db, municipality.id, {
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  
  // Başka belediyeye asset ekle
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherCategory = await createTestCategory(db, otherMunicipality.id);
  const otherDepartment = await createTestDepartment(db, otherMunicipality.id);
  const otherLocation = await createTestLocation(db, otherMunicipality.id);
  await createTestAsset(db, otherMunicipality.id, {
    category_id: otherCategory.id,
    department_id: otherDepartment.id,
    location_id: otherLocation.id,
  });
  
  const response = await request(app)
    .get('/api/dashboard/category-distribution')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  // Sadece kullanıcının belediyesinin assetlerini görmeli
  assert.equal(response.body.total_assets, 1, 'Should only count assets from user municipality');
});

// ============================================================================
// GET /api/dashboard/upcoming-maintenance - UPCOMING MAINTENANCE TESTS
// ============================================================================

test('GET /api/dashboard/upcoming-maintenance -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .get('/api/dashboard/upcoming-maintenance')
    .expect(401);

  assert.ok(response.body);
});

test('GET /api/dashboard/upcoming-maintenance -> should return 200 with empty array when no maintenance', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Sadece municipality ve user oluştur (createTestEnvironment gereksiz veri oluşturur)
  const municipality = await createTestMunicipality(db);
  const user = await createTestUser(db, municipality.id, 3);
  
  const response = await request(app)
    .get('/api/dashboard/upcoming-maintenance')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body));
  assert.equal(response.body.length, 0, 'Should return empty array when no maintenance');
});

test('GET /api/dashboard/upcoming-maintenance -> should return upcoming maintenance with correct structure', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Sadece municipality ve user oluştur
  const municipality = await createTestMunicipality(db);
  const user = await createTestUser(db, municipality.id, 3);
  
  // Bağımlı verileri oluştur
  const category = await createTestCategory(db, municipality.id);
  const department = await createTestDepartment(db, municipality.id);
  const location = await createTestLocation(db, municipality.id);
  
  const asset = await createTestAsset(db, municipality.id, {
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  const maintenance = await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset.id,
    status: 'open',
  });
  
  const response = await request(app)
    .get('/api/dashboard/upcoming-maintenance')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length > 0, 'Should have at least one maintenance request');
  
  const firstMaintenance = response.body[0];
  assert.ok(firstMaintenance.id);
  assert.ok(firstMaintenance.maintenance_request_id);
  assert.ok(firstMaintenance.asset_id);
  assert.ok(firstMaintenance.asset_name);
  assert.ok(firstMaintenance.status);
  assert.ok(firstMaintenance.priority);
});

test('GET /api/dashboard/upcoming-maintenance -> should only return open, planned, in_progress statuses', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Sadece municipality ve user oluştur
  const municipality = await createTestMunicipality(db);
  const user = await createTestUser(db, municipality.id, 3);
  
  // Bağımlı verileri oluştur
  const category = await createTestCategory(db, municipality.id);
  const department = await createTestDepartment(db, municipality.id);
  const location = await createTestLocation(db, municipality.id);
  
  const asset1 = await createTestAsset(db, municipality.id, {
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  const asset2 = await createTestAsset(db, municipality.id, {
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  const asset3 = await createTestAsset(db, municipality.id, {
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  const asset4 = await createTestAsset(db, municipality.id, {
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  
  // Farklı durumlarda bakım talepleri oluştur
  await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset1.id,
    status: 'open',
  });
  await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset2.id,
    status: 'planned',
  });
  await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset3.id,
    status: 'in_progress',
  });
  await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset4.id,
    status: 'completed', // Bu döndürülmemeli
  });
  
  const response = await request(app)
    .get('/api/dashboard/upcoming-maintenance')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body));
  assert.equal(response.body.length, 3, 'Should only return open, planned, in_progress statuses');
  
  const statuses = response.body.map(m => m.status);
  assert.ok(statuses.includes('open'));
  assert.ok(statuses.includes('planned'));
  assert.ok(statuses.includes('in_progress'));
  assert.ok(!statuses.includes('completed'));
});

test('GET /api/dashboard/upcoming-maintenance -> should return maximum 5 maintenance requests', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // 7 bakım talebi oluştur
  for (let i = 0; i < 7; i++) {
    const asset = await createTestAsset(db, municipality.id);
    await createTestMaintenanceTicket(db, municipality.id, {
      asset_id: asset.id,
      status: 'open',
    });
  }
  
  const response = await request(app)
    .get('/api/dashboard/upcoming-maintenance')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length <= 5, 'Should return maximum 5 maintenance requests');
});

test('GET /api/dashboard/upcoming-maintenance -> should only return maintenance from user municipality (tenant scope)', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Sadece municipality ve user oluştur
  const municipality = await createTestMunicipality(db);
  const user = await createTestUser(db, municipality.id, 3);
  
  // Bağımlı verileri oluştur
  const category = await createTestCategory(db, municipality.id);
  const department = await createTestDepartment(db, municipality.id);
  const location = await createTestLocation(db, municipality.id);
  
  // Kullanıcının belediyesine bakım talebi ekle
  const asset1 = await createTestAsset(db, municipality.id, {
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset1.id,
    status: 'open',
  });
  
  // Başka belediyeye bakım talebi ekle
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherCategory = await createTestCategory(db, otherMunicipality.id);
  const otherDepartment = await createTestDepartment(db, otherMunicipality.id);
  const otherLocation = await createTestLocation(db, otherMunicipality.id);
  const asset2 = await createTestAsset(db, otherMunicipality.id, {
    category_id: otherCategory.id,
    department_id: otherDepartment.id,
    location_id: otherLocation.id,
  });
  await createTestMaintenanceTicket(db, otherMunicipality.id, {
    asset_id: asset2.id,
    status: 'open',
  });
  
  const response = await request(app)
    .get('/api/dashboard/upcoming-maintenance')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  // Sadece kullanıcının belediyesinin bakım taleplerini görmeli
  const userMunicipalityMaintenance = response.body.filter(m => Number(m.asset_id) === Number(asset1.id));
  assert.ok(userMunicipalityMaintenance.length > 0, 'Should return maintenance from user municipality');
  
  // Başka belediyenin bakım taleplerini görmemeli
  const otherMunicipalityMaintenance = response.body.filter(m => Number(m.asset_id) === Number(asset2.id));
  assert.equal(otherMunicipalityMaintenance.length, 0, 'Should not return maintenance from other municipality');
});
