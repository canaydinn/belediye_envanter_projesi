/**
 * Asset Movements Routes Integration Tests
 * 
 * Bu dosya asset movements endpoint'lerinin gerçek veritabanı ve Express app ile
 * entegrasyon testlerini içerir.
 * 
 * Test Senaryoları:
 * - CRUD işlemleri (Create, Read)
 * - Tenant scope kontrolü
 * - Validation hataları
 * - Movement type kontrolleri
 * - Asset, department, location validation
 * - Filtering ve stats
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
  createTestAssetMovement,
  createTestMunicipality,
  createTestDepartment,
  createTestLocation,
  createTestUser,
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
// POST /api/asset-movements - CREATE MOVEMENT TESTS
// ============================================================================

test('POST /api/asset-movements -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .post('/api/asset-movements')
    .send({
      asset_id: 1,
      movement_type: 'transfer',
    })
    .expect(401);

  assert.ok(response.body);
});

test('POST /api/asset-movements -> should return 403 when user role is not admin', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  
  const response = await request(app)
    .post('/api/asset-movements')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .send({
      asset_id: asset.id,
      movement_type: 'transfer',
    })
    .expect(403);

  assert.ok(response.body);
});

test('POST /api/asset-movements -> should return 400 when asset_id is missing', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const response = await request(app)
    .post('/api/asset-movements')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      movement_type: 'transfer',
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('zorunludur'));
});

test('POST /api/asset-movements -> should return 400 when movement_type is invalid', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  const asset = await createTestAsset(db, municipality.id);
  
  const response = await request(app)
    .post('/api/asset-movements')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      asset_id: asset.id,
      movement_type: 'invalid_type',
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('geçerli hareket türü'));
});

test('POST /api/asset-movements -> should return 404 when asset not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const response = await request(app)
    .post('/api/asset-movements')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      asset_id: 99999,
      movement_type: 'transfer',
    })
    .expect(404);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('bulunamadı'));
});

test('POST /api/asset-movements -> should return 404 when asset belongs to other municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // Başka bir belediye ve asset oluştur
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherAsset = await createTestAsset(db, otherMunicipality.id);
  
  const response = await request(app)
    .post('/api/asset-movements')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      asset_id: otherAsset.id,
      movement_type: 'transfer',
    })
    .expect(404);

  assert.ok(response.body);
});

test('POST /api/asset-movements -> should return 201 and create movement successfully', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  try {
    const { municipality, user: adminUser, department, location } = await createTestEnvironment(db, { userRoleId: 2 });
    const asset = await createTestAsset(db, municipality.id, {
      department_id: department.id,
      location_id: location.id,
    });
    
    const toDepartment = await createTestDepartment(db, municipality.id, { name: 'To Department' });
    const toLocation = await createTestLocation(db, municipality.id, { name: 'To Location' });
    
    const movementData = {
      asset_id: asset.id,
      movement_type: 'transfer',
      from_department_id: department.id,
      to_department_id: toDepartment.id,
      from_location_id: location.id,
      to_location_id: toLocation.id,
      notes: 'Test movement',
    };
    
    const response = await request(app)
      .post('/api/asset-movements')
      .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
      .send(movementData);

    if (response.status !== 201) {
      console.error('\n=== POST /api/asset-movements FAILED ===');
      console.error('Status:', response.status);
      console.error('Expected: 201');
      console.error('Response body:', JSON.stringify(response.body, null, 2));
      console.error('Request data:', JSON.stringify(movementData, null, 2));
      throw new Error(`Expected status 201, got ${response.status}. Response: ${JSON.stringify(response.body)}`);
    }

    if (!response.body || !response.body.id) {
      throw new Error('Response body or id is missing');
    }
    
    const movement = response.body;
    
    if (Number(movement.asset_id) !== Number(asset.id)) {
      throw new Error(`Asset ID mismatch. Expected: ${asset.id}, Got: ${movement.asset_id}`);
    }
    
    if (movement.movement_type !== 'transfer') {
      throw new Error(`Movement type mismatch. Expected: transfer, Got: ${movement.movement_type}`);
    }
    
    if (Number(movement.municipality_id) !== Number(municipality.id)) {
      throw new Error(`Municipality ID mismatch. Expected: ${municipality.id}, Got: ${movement.municipality_id}`);
    }
    
    // Veritabanında kaydın oluşturulduğunu doğrula
    const dbMovement = await db('asset_movements')
      .where({ id: movement.id })
      .first();
    
    if (!dbMovement) {
      throw new Error(`Movement not found in database with id: ${movement.id}`);
    }
    
    if (Number(dbMovement.asset_id) !== Number(asset.id)) {
      throw new Error(`Database asset_id mismatch. Expected: ${asset.id}, Got: ${dbMovement.asset_id}`);
    }
  } catch (err) {
    console.error('\n=== TEST ERROR ===');
    console.error(err.message);
    console.error(err.stack);
    throw err;
  }
});

test('POST /api/asset-movements -> should return 201 and create assign movement with to_user_id', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  const asset = await createTestAsset(db, municipality.id);
  const toUser = await createTestUser(db, municipality.id, 3);
  
  const movementData = {
    asset_id: asset.id,
    movement_type: 'assign',
    to_user_id: toUser.id,
    notes: 'Zimmet verildi',
  };
  
  const response = await request(app)
    .post('/api/asset-movements')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send(movementData)
    .expect(201);

  assert.ok(response.body);
  assert.equal(Number(response.body.asset_id), Number(asset.id));
  assert.equal(response.body.movement_type, 'assign');
  assert.equal(Number(response.body.to_user_id), Number(toUser.id));
  assert.equal(Number(response.body.municipality_id), Number(municipality.id));
});

// ============================================================================
// GET /api/asset-movements - LIST MOVEMENTS TESTS
// ============================================================================

test('GET /api/asset-movements -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .get('/api/asset-movements')
    .expect(401);

  assert.ok(response.body);
});

test('GET /api/asset-movements -> should return 200 and list movements for municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  
  // Birkaç movement oluştur
  const movement1 = await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'transfer',
  });
  
  const movement2 = await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'assign',
  });
  
  // Başka bir belediye ve movement oluştur (tenant scope testi için)
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherAsset = await createTestAsset(db, otherMunicipality.id);
  await createTestAssetMovement(db, otherMunicipality.id, {
    asset_id: otherAsset.id,
    movement_type: 'transfer',
  });
  
  const response = await request(app)
    .get('/api/asset-movements')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body), 'Response should be an array');
  assert.equal(response.body.length, 2, 'Should return only movements from user municipality');
  
  // Movement ID'lerini kontrol et
  const movementIds = response.body.map(m => Number(m.id));
  assert.ok(movementIds.includes(Number(movement1.id)), 'Movement 1 should be in the list');
  assert.ok(movementIds.includes(Number(movement2.id)), 'Movement 2 should be in the list');
});

test('GET /api/asset-movements -> should return 200 with movement_type filter', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  
  // Farklı type'larda movement'lar oluştur
  const transferMovement = await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'transfer',
  });
  
  const assignMovement = await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'assign',
  });
  
  const response = await request(app)
    .get('/api/asset-movements?movement_type=transfer')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body));
  // Sadece transfer type'ındaki movement'ları görmeli
  response.body.forEach(movement => {
    assert.equal(movement.movement_type, 'transfer', 'All movements should have type=transfer');
  });
});

test('GET /api/asset-movements -> should return 200 with date range filter', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  // Bugün için movement
  const todayMovement = await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'transfer',
    movement_date: today,
  });
  
  // Dün için movement
  await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'transfer',
    movement_date: yesterday,
  });
  
  const startDate = today.toISOString().split('T')[0];
  const endDate = tomorrow.toISOString().split('T')[0];
  
  const response = await request(app)
    .get(`/api/asset-movements?start_date=${startDate}&end_date=${endDate}`)
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body));
  // Bugünkü movement'ı görmeli
  const movementIds = response.body.map(m => Number(m.id));
  assert.ok(movementIds.includes(Number(todayMovement.id)), 'Today movement should be in the list');
});

// ============================================================================
// GET /api/asset-movements/stats - MOVEMENT STATS TESTS
// ============================================================================

test('GET /api/asset-movements/stats -> should return movement statistics', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  
  // Bugün için movement
  await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'transfer',
    movement_date: new Date(),
  });
  
  // Maintenance movement
  await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'maintenance',
  });
  
  const response = await request(app)
    .get('/api/asset-movements/stats')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(typeof response.body.last30DaysTotal === 'number');
  assert.ok(typeof response.body.todayTotal === 'number');
  assert.ok(typeof response.body.maintenanceTotal === 'number');
  assert.ok(typeof response.body.assignmentTransferTotal === 'number');
  assert.ok(response.body.maintenanceTotal >= 1);
});

// ============================================================================
// GET /api/asset-movements/movement-type-distribution - TYPE DISTRIBUTION TESTS
// ============================================================================

test('GET /api/asset-movements/movement-type-distribution -> should return movement type distribution', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  
  // Farklı type'larda movement'lar oluştur
  await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'transfer',
  });
  
  await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'assign',
  });
  
  await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'maintenance',
  });
  
  const response = await request(app)
    .get('/api/asset-movements/movement-type-distribution')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(typeof response.body.totalMovements === 'number');
  assert.ok(Array.isArray(response.body.distribution));
  assert.ok(response.body.totalMovements >= 3);
  
  // Distribution'da transfer, assign, maintenance olmalı
  const types = response.body.distribution.map(d => d.movement_type);
  assert.ok(types.includes('transfer'), 'Distribution should include transfer');
  assert.ok(types.includes('assign'), 'Distribution should include assign');
  assert.ok(types.includes('maintenance'), 'Distribution should include maintenance');
});

// ============================================================================
// GET /api/asset-movements/recent - RECENT MOVEMENTS TESTS
// ============================================================================

test('GET /api/asset-movements/recent -> should return recent movements', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  
  // Birkaç movement oluştur
  const movement1 = await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'transfer',
    movement_date: new Date(),
  });
  
  const movement2 = await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'assign',
    movement_date: new Date(Date.now() - 1000), // 1 saniye önce
  });
  
  const response = await request(app)
    .get('/api/asset-movements/recent')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length <= 5, 'Should return at most 5 recent movements');
  
  // En yeni movement ilk sırada olmalı
  if (response.body.length > 0) {
    const movementIds = response.body.map(m => Number(m.id));
    assert.ok(movementIds.includes(Number(movement1.id)), 'Recent movement 1 should be in the list');
  }
});

// ============================================================================
// GET /api/asset-movements/filter - FILTER MOVEMENTS TESTS
// ============================================================================

test('GET /api/asset-movements/filter -> should return filtered movements', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  
  // Movement oluştur
  const movement = await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'transfer',
  });
  
  const response = await request(app)
    .get(`/api/asset-movements/filter?movementType=transfer`)
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(Array.isArray(response.body.data));
  // Transfer type'ındaki movement'ları görmeli
  response.body.data.forEach(m => {
    assert.equal(m.movement_type, 'transfer', 'All movements should have type=transfer');
  });
});

// ============================================================================
// GET /api/asset-movements/stats/last-30-days - LAST 30 DAYS TESTS
// ============================================================================

test('GET /api/asset-movements/stats/last-30-days -> should return last 30 days total', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  
  // Son 30 gün içinde movement oluştur
  await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'transfer',
    movement_date: new Date(),
  });
  
  const response = await request(app)
    .get('/api/asset-movements/stats/last-30-days')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(typeof response.body.total === 'number');
  assert.ok(response.body.total >= 1);
});

// ============================================================================
// GET /api/asset-movements/stats/today - TODAY TESTS
// ============================================================================

test('GET /api/asset-movements/stats/today -> should return today total', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  
  // Bugün için movement oluştur
  await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'transfer',
    movement_date: new Date(),
  });
  
  const response = await request(app)
    .get('/api/asset-movements/stats/today')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(typeof response.body.total === 'number');
  assert.ok(response.body.total >= 1);
});

// ============================================================================
// GET /api/asset-movements/stats/maintenance - MAINTENANCE TESTS
// ============================================================================

test('GET /api/asset-movements/stats/maintenance -> should return maintenance total', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  
  // Maintenance movement oluştur
  await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'maintenance',
  });
  
  const response = await request(app)
    .get('/api/asset-movements/stats/maintenance')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(typeof response.body.total === 'number');
  assert.ok(response.body.total >= 1);
});

// ============================================================================
// GET /api/asset-movements/stats/zimmet - ZIMMET TESTS
// ============================================================================

test('GET /api/asset-movements/stats/zimmet -> should return zimmet (assign) total', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  
  // Assign movement oluştur
  await createTestAssetMovement(db, municipality.id, {
    asset_id: asset.id,
    movement_type: 'assign',
  });
  
  const response = await request(app)
    .get('/api/asset-movements/stats/zimmet')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(typeof response.body.total === 'number');
  assert.ok(response.body.total >= 1);
});

