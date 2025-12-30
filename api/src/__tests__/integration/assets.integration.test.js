/**
 * Assets Routes Integration Tests
 * 
 * Bu dosya assets endpoint'lerinin gerçek veritabanı ve Express app ile
 * entegrasyon testlerini içerir.
 * 
 * Test Senaryoları:
 * - CRUD işlemleri (Create, Read, Update, Delete)
 * - Tenant scope kontrolü
 * - Validation hataları
 * - Foreign key kontrolleri
 * - Authorization kontrolleri
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupTestDb, teardownTestDb, cleanDatabase, getTestApp, getTestDb, runMigrations } = require('../helpers/testSetup');
const { getAuthHeader, getMunicipalityAdminToken, getUserToken } = require('../helpers/authHelper');
const {
  createTestEnvironment,
  createTestAsset,
  createTestMunicipality,
  createTestCategory,
  createTestDepartment,
  createTestLocation,
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
  
  // purchase_price kolonunun decimal olduğundan emin ol
  const db = getTestDb();
  try {
    const columnInfo = await db.raw(`
      SELECT data_type, udt_name
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'assets' 
      AND column_name = 'purchase_price'
    `);
    
    if (columnInfo.rows && columnInfo.rows.length > 0) {
      const dataType = columnInfo.rows[0].data_type;
      const udtName = columnInfo.rows[0].udt_name;
      
      if (dataType === 'integer' || udtName === 'int4') {
        console.log('Fixing purchase_price column type from integer to decimal in test.before...');
        await db.raw(`
          ALTER TABLE assets 
          ALTER COLUMN purchase_price TYPE DECIMAL(14, 2) USING purchase_price::DECIMAL(14, 2)
        `);
        console.log('purchase_price column type fixed to DECIMAL(14, 2)');
      }
    }
  } catch (err) {
    console.warn('Warning: Could not check/fix purchase_price column type in test.before:', err.message);
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
// POST /api/assets - CREATE ASSET TESTS
// ============================================================================

test('POST /api/assets -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .post('/api/assets')
    .send({
      name: 'Test Asset',
      category_id: 1,
      department_id: 1,
      location_id: 1,
    })
    .expect(401);

  assert.ok(response.body);
});

test('POST /api/assets -> should return 403 when user role is not admin', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Test ortamı oluştur (USER role ile)
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // USER role ile istek gönder (MUNICIPALITY_ADMIN değil)
  // Auth middleware kullanıcıyı veritabanından çektiği için user.id ve user.role_id kullanılmalı
  const response = await request(app)
    .post('/api/assets')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .send({
      name: 'Test Asset',
      category_id: 1,
      department_id: 1,
      location_id: 1,
    })
    .expect(403);

  assert.ok(response.body);
});

test('POST /api/assets -> should return 400 when required fields are missing', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Municipality admin role ile test ortamı oluştur
  const { municipality, category, department, location } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // Municipality admin user'ı al
  const adminUser = await db('users')
    .where({ municipality_id: municipality.id, role_id: 2 })
    .first();
  
  // name eksik
  const response = await request(app)
    .post('/api/assets')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      category_id: category.id,
      department_id: department.id,
      location_id: location.id,
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('zorunludur'));
});

test('POST /api/assets -> should return 400 when category does not belong to municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Municipality admin role ile test ortamı oluştur
  const { municipality, department, location } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // Başka bir belediye oluştur
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherCategory = await createTestCategory(db, otherMunicipality.id);
  
  // Municipality admin user'ı al
  const adminUser = await db('users')
    .where({ municipality_id: municipality.id, role_id: 2 })
    .first();
  
  // Başka belediyenin category'sini kullanmaya çalış
  const response = await request(app)
    .post('/api/assets')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      name: 'Test Asset',
      category_id: otherCategory.id, // Başka belediyenin category'si
      department_id: department.id,
      location_id: location.id,
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('Kategori bu belediyeye ait değil'));
});

test('POST /api/assets -> should return 201 and create asset successfully', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  try {
    // Municipality admin role ile test ortamı oluştur
    const { municipality, category, department, location } = await createTestEnvironment(db, { userRoleId: 2 });
    
    // Municipality admin user'ı al
    const adminUser = await db('users')
      .where({ municipality_id: municipality.id, role_id: 2 })
      .first();
    
    const assetData = {
      name: 'Test Asset Integration',
      description: 'Integration test için oluşturuldu',
      category_id: category.id,
      department_id: department.id,
      location_id: location.id,
      purchase_price: 1000.50,
      purchase_date: '2024-01-15',
      serial_number: 'SN-TEST-001',
      status: 'active',
      quantity: 1,
      unit: 'Adet',
      asset_type: 'demirbas',
    };
    
    const response = await request(app)
      .post('/api/assets')
      .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
      .send(assetData);

    // Response status'ü kontrol et
    if (response.status !== 201) {
      console.error('\n=== POST /api/assets FAILED ===');
      console.error('Status:', response.status);
      console.error('Expected: 201');
      console.error('Response body:', JSON.stringify(response.body, null, 2));
      console.error('Request data:', JSON.stringify(assetData, null, 2));
      throw new Error(`Expected status 201, got ${response.status}. Response: ${JSON.stringify(response.body)}`);
    }

    // Response'u doğrula
    if (!response.body) {
      throw new Error('Response body is missing');
    }
    
    if (response.body.name !== assetData.name) {
      throw new Error(`Name mismatch. Expected: ${assetData.name}, Got: ${response.body.name}`);
    }
    
    if (response.body.description !== assetData.description) {
      throw new Error(`Description mismatch. Expected: ${assetData.description}, Got: ${response.body.description}`);
    }
    
    // ID'ler string/number karışıklığı olabilir
    if (Number(response.body.category_id) !== Number(category.id)) {
      throw new Error(`Category ID mismatch. Expected: ${category.id}, Got: ${response.body.category_id}`);
    }
    
    if (Number(response.body.department_id) !== Number(department.id)) {
      throw new Error(`Department ID mismatch. Expected: ${department.id}, Got: ${response.body.department_id}`);
    }
    
    if (Number(response.body.location_id) !== Number(location.id)) {
      throw new Error(`Location ID mismatch. Expected: ${location.id}, Got: ${response.body.location_id}`);
    }
    
    if (!response.body.asset_code) {
      throw new Error('Asset code is missing');
    }
    
    if (!response.body.asset_code.startsWith(`AS-${municipality.id}-`)) {
      throw new Error(`Asset code format is wrong. Expected to start with AS-${municipality.id}-, Got: ${response.body.asset_code}`);
    }
    
    // Veritabanında kaydın oluşturulduğunu doğrula
    const dbAsset = await db('assets')
      .where({ id: response.body.id })
      .first();
    
    if (!dbAsset) {
      throw new Error(`Asset not found in database with id: ${response.body.id}`);
    }
    
    if (dbAsset.name !== assetData.name) {
      throw new Error(`Database asset name mismatch. Expected: ${assetData.name}, Got: ${dbAsset.name}`);
    }
    
    // ID'ler string/number karışıklığı olabilir
    if (Number(dbAsset.municipality_id) !== Number(municipality.id)) {
      throw new Error(`Database municipality_id mismatch. Expected: ${municipality.id}, Got: ${dbAsset.municipality_id}`);
    }
    
    if (Number(dbAsset.created_by_user_id) !== Number(adminUser.id)) {
      throw new Error(`Database created_by_user_id mismatch. Expected: ${adminUser.id} (${typeof adminUser.id}), Got: ${dbAsset.created_by_user_id} (${typeof dbAsset.created_by_user_id})`);
    }
  } catch (err) {
    console.error('\n=== TEST ERROR ===');
    console.error(err.message);
    console.error(err.stack);
    throw err;
  }
});

// ============================================================================
// GET /api/assets - LIST ASSETS TESTS
// ============================================================================

test('GET /api/assets -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .get('/api/assets')
    .expect(401);

  assert.ok(response.body);
});

test('GET /api/assets -> should return 200 and list assets for municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user, category, department, location } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Birkaç asset oluştur
  const asset1 = await createTestAsset(db, municipality.id, {
    name: 'Asset 1',
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  
  const asset2 = await createTestAsset(db, municipality.id, {
    name: 'Asset 2',
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  
  // Başka bir belediye ve asset oluştur (tenant scope testi için)
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  await createTestAsset(db, otherMunicipality.id);
  
  // Assets listesini getir
  const response = await request(app)
    .get('/api/assets')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body), 'Response should be an array');
  assert.equal(response.body.length, 2, 'Should return only assets from user municipality');
  
  // Sadece kendi belediyesinin asset'lerini görmeli
  response.body.forEach(asset => {
    assert.equal(asset.municipality_id, municipality.id, 'Asset should belong to user municipality');
  });
  
  // Asset'lerin ID'lerini kontrol et
  const assetIds = response.body.map(a => a.id);
  assert.ok(assetIds.includes(asset1.id), 'Asset 1 should be in the list');
  assert.ok(assetIds.includes(asset2.id), 'Asset 2 should be in the list');
});

test('GET /api/assets -> should return empty array when no assets exist', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .get('/api/assets')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body));
  assert.equal(response.body.length, 0);
});

// ============================================================================
// GET /api/assets/:id - GET ASSET BY ID TESTS
// ============================================================================

test('GET /api/assets/:id -> should return 404 when asset not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .get('/api/assets/99999')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(404);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('bulunamadı'));
});

test('GET /api/assets/:id -> should return 404 when asset belongs to other municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Başka bir belediye ve asset oluştur
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherAsset = await createTestAsset(db, otherMunicipality.id);
  
  // Başka belediyenin asset'ine erişmeye çalış
  const response = await request(app)
    .get(`/api/assets/${otherAsset.id}`)
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(404);

  assert.ok(response.body);
});

test('GET /api/assets/:id -> should return 200 and get asset by id', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user, category, department, location } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const asset = await createTestAsset(db, municipality.id, {
    name: 'Test Asset Get',
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  
  const response = await request(app)
    .get(`/api/assets/${asset.id}`)
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.equal(response.body.id, asset.id);
  assert.equal(response.body.name, asset.name);
  assert.equal(response.body.municipality_id, municipality.id);
});

// ============================================================================
// PUT /api/assets/:id - UPDATE ASSET TESTS
// ============================================================================

test('PUT /api/assets/:id -> should return 404 when asset not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const adminUser = await db('users')
    .where({ municipality_id: municipality.id, role_id: 2 })
    .first();
  
  const response = await request(app)
    .put('/api/assets/99999')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({ name: 'Updated Name' })
    .expect(404);

  assert.ok(response.body);
});

test('PUT /api/assets/:id -> should return 200 and update asset successfully', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  try {
    const { municipality, category, department, location } = await createTestEnvironment(db, { userRoleId: 2 });
    
    const adminUser = await db('users')
      .where({ municipality_id: municipality.id, role_id: 2 })
      .first();
    
    const asset = await createTestAsset(db, municipality.id, {
      name: 'Original Name',
      category_id: category.id,
      department_id: department.id,
      location_id: location.id,
    });
    
    const updateData = {
      name: 'Updated Asset Name',
      description: 'Updated description',
      purchase_price: 2000.75,
    };
    
    const response = await request(app)
      .put(`/api/assets/${asset.id}`)
      .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
      .send(updateData);

    // Response status'ü kontrol et
    if (response.status !== 200) {
      console.error('\n=== PUT /api/assets/:id FAILED ===');
      console.error('Status:', response.status);
      console.error('Expected: 200');
      console.error('Response body:', JSON.stringify(response.body, null, 2));
      console.error('Request data:', JSON.stringify(updateData, null, 2));
      console.error('Asset ID:', asset.id);
      throw new Error(`Expected status 200, got ${response.status}. Response: ${JSON.stringify(response.body)}`);
    }

    if (!response.body) {
      throw new Error('Response body is missing');
    }
    
    if (response.body.name !== updateData.name) {
      throw new Error(`Name mismatch. Expected: ${updateData.name}, Got: ${response.body.name}`);
    }
    
    if (response.body.description !== updateData.description) {
      throw new Error(`Description mismatch. Expected: ${updateData.description}, Got: ${response.body.description}`);
    }
    
    // purchase_price decimal olduğu için float karşılaştırması yap
    const priceDiff = Math.abs(Number(response.body.purchase_price) - Number(updateData.purchase_price));
    if (priceDiff >= 0.01) {
      throw new Error(`Purchase price mismatch. Expected: ${updateData.purchase_price}, Got: ${response.body.purchase_price}, Diff: ${priceDiff}`);
    }
    
    // Veritabanında güncellendiğini doğrula
    const dbAsset = await db('assets')
      .where({ id: asset.id })
      .first();
    
    if (!dbAsset) {
      throw new Error(`Asset not found in database with id: ${asset.id}`);
    }
    
    if (dbAsset.name !== updateData.name) {
      throw new Error(`Database asset name mismatch. Expected: ${updateData.name}, Got: ${dbAsset.name}`);
    }
    
  // ID'ler string/number karışıklığı olabilir, bu yüzden Number() ile karşılaştır
  if (Number(dbAsset.updated_by_user_id) !== Number(adminUser.id)) {
    throw new Error(`Database updated_by_user_id mismatch. Expected: ${adminUser.id} (${typeof adminUser.id}), Got: ${dbAsset.updated_by_user_id} (${typeof dbAsset.updated_by_user_id})`);
  }
  } catch (err) {
    console.error('\n=== TEST ERROR ===');
    console.error(err.message);
    console.error(err.stack);
    throw err;
  }
});

// ============================================================================
// DELETE /api/assets/:id - DELETE ASSET TESTS
// ============================================================================

test('DELETE /api/assets/:id -> should return 404 when asset not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const adminUser = await db('users')
    .where({ municipality_id: municipality.id, role_id: 2 })
    .first();
  
  const response = await request(app)
    .delete('/api/assets/99999')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .expect(404);

  assert.ok(response.body);
});

test('DELETE /api/assets/:id -> should return 200 and delete asset successfully', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, category, department, location } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const adminUser = await db('users')
    .where({ municipality_id: municipality.id, role_id: 2 })
    .first();
  
  const asset = await createTestAsset(db, municipality.id, {
    name: 'Asset to Delete',
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  
  const response = await request(app)
    .delete(`/api/assets/${asset.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('silindi'));
  
  // Veritabanında silindiğini doğrula
  const dbAsset = await db('assets')
    .where({ id: asset.id })
    .first();
  
  assert.equal(dbAsset, undefined, 'Asset should be deleted from database');
});

// ============================================================================
// GET /api/assets/status-distribution - STATUS DISTRIBUTION TESTS
// ============================================================================

test('GET /api/assets/status-distribution -> should return status distribution', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user, category, department, location } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Farklı status'larda asset'ler oluştur
  await createTestAsset(db, municipality.id, {
    name: 'Active Asset',
    status: 'active',
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  
  await createTestAsset(db, municipality.id, {
    name: 'Maintenance Asset',
    status: 'in_maintenance',
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  
  const response = await request(app)
    .get('/api/assets/status-distribution')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(response.body.distribution);
  assert.equal(response.body.municipality_id, municipality.id);
  assert.ok(response.body.distribution.active >= 1);
  assert.ok(response.body.distribution.in_maintenance >= 1);
});

// ============================================================================
// GET /api/assets/filters - FILTER OPTIONS TESTS
// ============================================================================

test('GET /api/assets/filters -> should return filter options', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .get('/api/assets/filters')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(Array.isArray(response.body.categories));
  assert.ok(Array.isArray(response.body.departments));
  assert.ok(Array.isArray(response.body.locations));
});

// ============================================================================
// GET /api/assets/recent-assets - RECENT ASSETS TESTS
// ============================================================================

test('GET /api/assets/recent-assets -> should return recent assets', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user, category, department, location } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Birkaç asset oluştur
  await createTestAsset(db, municipality.id, {
    name: 'Recent Asset 1',
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  
  await createTestAsset(db, municipality.id, {
    name: 'Recent Asset 2',
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  
  const response = await request(app)
    .get('/api/assets/recent-assets')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length <= 5, 'Should return at most 5 recent assets');
});

// ============================================================================
// GET /api/assets/qr/:code - GET ASSET BY QR CODE TESTS
// ============================================================================

test('GET /api/assets/qr/:code -> should return 404 when asset not found by QR code', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .get('/api/assets/qr/NONEXISTENT-CODE')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(404);

  assert.ok(response.body);
});

test('GET /api/assets/qr/:code -> should return 200 and find asset by QR code', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user, category, department, location } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const asset = await createTestAsset(db, municipality.id, {
    name: 'QR Test Asset',
    qrcode: 'QR-TEST-001',
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  
  const response = await request(app)
    .get(`/api/assets/qr/${asset.qrcode}`)
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.equal(response.body.id, asset.id);
  assert.equal(response.body.qrcode, asset.qrcode);
});

