/**
 * Locations Routes Integration Tests
 * 
 * Bu dosya locations endpoint'lerinin gerçek veritabanı ve Express app ile
 * entegrasyon testlerini içerir.
 * 
 * Test Senaryoları:
 * - CRUD işlemleri (Create, Read, Update, Delete)
 * - Tenant scope kontrolü
 * - Validation hataları
 * - Duplicate kontrolü (code)
 * - Department validation
 * - Filtering ve pagination
 * - Stats ve type distribution
 * - Authorization kontrolleri
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupTestDb, teardownTestDb, cleanDatabase, getTestApp, getTestDb, runMigrations } = require('../helpers/testSetup');
const { getAuthHeader } = require('../helpers/authHelper');
const {
  createTestEnvironment,
  createTestLocation,
  createTestMunicipality,
  createTestDepartment,
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
// Not: --test-concurrency=1 ile seri çalıştırıldığı için deadlock riski azalır
test.beforeEach(async () => {
  await cleanDatabase();
});

// ============================================================================
// POST /api/locations - CREATE LOCATION TESTS
// ============================================================================

test('POST /api/locations -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .post('/api/locations')
    .send({
      code: 'TEST',
      name: 'Test Location',
    })
    .expect(401);

  assert.ok(response.body);
});

test('POST /api/locations -> should return 403 when user role is not admin', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .post('/api/locations')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .send({
      code: 'TEST',
      name: 'Test Location',
    })
    .expect(403);

  assert.ok(response.body);
});

test('POST /api/locations -> should return 400 when required fields are missing', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // code eksik
  const response1 = await request(app)
    .post('/api/locations')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      name: 'Test Location',
    })
    .expect(400);

  assert.ok(response1.body);
  assert.ok(response1.body.message.includes('zorunludur'));
  
  // name eksik
  const response2 = await request(app)
    .post('/api/locations')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: 'TEST',
    })
    .expect(400);

  assert.ok(response2.body);
  assert.ok(response2.body.message.includes('zorunludur'));
});

test('POST /api/locations -> should return 400 when department_id does not belong to municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // Başka bir belediye ve departman oluştur
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherDepartment = await createTestDepartment(db, otherMunicipality.id);
  
  const response = await request(app)
    .post('/api/locations')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: 'TEST',
      name: 'Test Location',
      department_id: otherDepartment.id,
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('belediyeye ait değil'));
});

test('POST /api/locations -> should return 400 when code already exists', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // İlk lokasyonu oluştur
  const location = await createTestLocation(db, municipality.id, {
    code: 'TEST',
    name: 'Test Location',
  });
  
  // Aynı code ile lokasyon oluşturmaya çalış
  const response = await request(app)
    .post('/api/locations')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: 'TEST',
      name: 'Different Name',
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('kayıt mevcut'));
});

test('POST /api/locations -> should return 201 and create location successfully', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  try {
    const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
    
    const locationData = {
      code: 'TEST-LOC',
      name: 'Test Location Integration',
      address: 'Test Address',
      // type, latitude, longitude kolonları migration'da olmayabilir, bu yüzden opsiyonel bırakıyoruz
      // type: 1, // Ofis
      // latitude: 41.0082,
      // longitude: 28.9784,
      is_active: true,
    };
    
    const response = await request(app)
      .post('/api/locations')
      .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
      .send(locationData);

    if (response.status !== 201) {
      console.error('\n=== POST /api/locations FAILED ===');
      console.error('Status:', response.status);
      console.error('Expected: 201');
      console.error('Response body:', JSON.stringify(response.body, null, 2));
      console.error('Request data:', JSON.stringify(locationData, null, 2));
      throw new Error(`Expected status 201, got ${response.status}. Response: ${JSON.stringify(response.body)}`);
    }

    if (!response.body || !response.body.id) {
      throw new Error('Response body or id is missing');
    }
    
    const location = response.body;
    
    if (location.code !== locationData.code) {
      throw new Error(`Code mismatch. Expected: ${locationData.code}, Got: ${location.code}`);
    }
    
    if (location.name !== locationData.name) {
      throw new Error(`Name mismatch. Expected: ${locationData.name}, Got: ${location.name}`);
    }
    
    if (Number(location.municipality_id) !== Number(municipality.id)) {
      throw new Error(`Municipality ID mismatch. Expected: ${municipality.id}, Got: ${location.municipality_id}`);
    }
    
    // Veritabanında kaydın oluşturulduğunu doğrula
    const dbLocation = await db('locations')
      .where({ id: location.id })
      .first();
    
    if (!dbLocation) {
      throw new Error(`Location not found in database with id: ${location.id}`);
    }
    
    if (dbLocation.code !== locationData.code) {
      throw new Error(`Database location code mismatch. Expected: ${locationData.code}, Got: ${dbLocation.code}`);
    }
    
    if (Number(dbLocation.municipality_id) !== Number(municipality.id)) {
      throw new Error(`Database municipality_id mismatch. Expected: ${municipality.id}, Got: ${dbLocation.municipality_id}`);
    }
  } catch (err) {
    console.error('\n=== TEST ERROR ===');
    console.error(err.message);
    console.error(err.stack);
    throw err;
  }
});

test('POST /api/locations -> should return 201 and create location with department_id', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser, department } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const locationData = {
    code: 'TEST-DEPT-LOC',
    name: 'Test Location with Department',
    department_id: department.id,
    is_active: true,
  };
  
  const response = await request(app)
    .post('/api/locations')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send(locationData)
    .expect(201);

  assert.ok(response.body);
  assert.equal(response.body.code, locationData.code);
  assert.equal(response.body.name, locationData.name);
  assert.equal(Number(response.body.department_id), Number(department.id));
  assert.equal(Number(response.body.municipality_id), Number(municipality.id));
});

// ============================================================================
// GET /api/locations - LIST LOCATIONS TESTS
// ============================================================================

test('GET /api/locations -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .get('/api/locations')
    .expect(401);

  assert.ok(response.body);
});

test('GET /api/locations -> should return 200 and list locations for municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Birkaç lokasyon oluştur
  const location1 = await createTestLocation(db, municipality.id, {
    code: 'LOC1',
    name: 'Location 1',
  });
  
  const location2 = await createTestLocation(db, municipality.id, {
    code: 'LOC2',
    name: 'Location 2',
  });
  
  // Başka bir belediye ve lokasyon oluştur (tenant scope testi için)
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  await createTestLocation(db, otherMunicipality.id, {
    code: 'OTHER',
    name: 'Other Location',
  });
  
  const response = await request(app)
    .get('/api/locations')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(response.body.data, 'Response should have data property');
  assert.ok(Array.isArray(response.body.data), 'Data should be an array');
  // createTestEnvironment bir lokasyon oluşturuyor + 2 lokasyon daha = 3 lokasyon
  assert.equal(response.body.data.length, 3, 'Should return only locations from user municipality');
  assert.equal(response.body.total, 3, 'Total should match data length');
  
  // Kategorilerin ID'lerini kontrol et
  const locationIds = response.body.data.map(l => Number(l.id));
  assert.ok(locationIds.includes(Number(location1.id)), 'Location 1 should be in the list');
  assert.ok(locationIds.includes(Number(location2.id)), 'Location 2 should be in the list');
});

test('GET /api/locations -> should return 200 with type filter', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Farklı type'larda lokasyonlar oluştur
  const officeLocation = await createTestLocation(db, municipality.id, {
    code: 'OFFICE',
    name: 'Office Location',
    type: 1, // Ofis
  });
  
  const warehouseLocation = await createTestLocation(db, municipality.id, {
    code: 'WAREHOUSE',
    name: 'Warehouse Location',
    type: 2, // Depo
  });
  
  const response = await request(app)
    .get('/api/locations?type=1')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(Array.isArray(response.body.data));
  // Sadece type=1 olanları görmeli
  response.body.data.forEach(loc => {
    assert.equal(Number(loc.type), 1, 'All locations should have type=1');
  });
});

test('GET /api/locations -> should return 200 with department_id filter', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user, department } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Departmana bağlı bir lokasyon oluştur
  const locationWithDept = await createTestLocation(db, municipality.id, {
    code: 'DEPT-LOC',
    name: 'Location with Department',
    department_id: department.id,
  });
  
  // Departmansız bir lokasyon oluştur
  await createTestLocation(db, municipality.id, {
    code: 'NO-DEPT',
    name: 'Location without Department',
  });
  
  const response = await request(app)
    .get(`/api/locations?department_id=${department.id}`)
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(Array.isArray(response.body.data));
  // Sadece belirtilen departmana bağlı lokasyonları görmeli
  response.body.data.forEach(loc => {
    if (loc.department_id) {
      assert.equal(Number(loc.department_id), Number(department.id), 'Location should belong to specified department');
    }
  });
});

// ============================================================================
// GET /api/locations/search - FILTERED LOCATIONS TESTS
// ============================================================================

test('GET /api/locations/search -> should return 200 with filtered locations', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Farklı isimlerde lokasyonlar oluştur
  const location1 = await createTestLocation(db, municipality.id, {
    code: 'MAIN',
    name: 'Main Building',
    type: 1,
  });
  
  const location2 = await createTestLocation(db, municipality.id, {
    code: 'WAREHOUSE',
    name: 'Warehouse Building',
    type: 2,
  });
  
  const response = await request(app)
    .get('/api/locations/search?name=Main')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(Array.isArray(response.body.data));
  assert.ok(typeof response.body.total === 'number');
  // "Main" içeren lokasyonları görmeli
  response.body.data.forEach(loc => {
    assert.ok(loc.name.toLowerCase().includes('main'), 'Location name should contain "Main"');
  });
});

test('GET /api/locations/search -> should return 200 with pagination', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Birkaç lokasyon oluştur
  for (let i = 1; i <= 5; i++) {
    await createTestLocation(db, municipality.id, {
      code: `LOC${i}`,
      name: `Location ${i}`,
    });
  }
  
  const response = await request(app)
    .get('/api/locations/search?limit=2&offset=0')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(Array.isArray(response.body.data));
  assert.equal(response.body.data.length, 2, 'Should return 2 locations');
  assert.equal(response.body.limit, 2, 'Limit should be 2');
  assert.equal(response.body.offset, 0, 'Offset should be 0');
  assert.ok(response.body.total >= 5, 'Total should be at least 5');
});

// ============================================================================
// GET /api/locations/:id - GET LOCATION BY ID TESTS
// ============================================================================

test('GET /api/locations/:id -> should return 404 when location not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .get('/api/locations/99999')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(404);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('bulunamadı'));
});

test('GET /api/locations/:id -> should return 400 when id is not a number', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .get('/api/locations/invalid')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('Geçersiz'));
});

test('GET /api/locations/:id -> should return 404 when location belongs to other municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Başka bir belediye ve lokasyon oluştur
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherLocation = await createTestLocation(db, otherMunicipality.id);
  
  // Başka belediyenin lokasyonuna erişmeye çalış
  const response = await request(app)
    .get(`/api/locations/${otherLocation.id}`)
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(404);

  assert.ok(response.body);
});

test('GET /api/locations/:id -> should return 200 and get location by id', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user, location } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .get(`/api/locations/${location.id}`)
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.equal(Number(response.body.id), Number(location.id));
  assert.equal(response.body.name, location.name);
  assert.equal(response.body.code, location.code);
  assert.equal(Number(response.body.municipality_id), Number(municipality.id));
});

// ============================================================================
// PUT /api/locations/:id - UPDATE LOCATION TESTS
// ============================================================================

test('PUT /api/locations/:id -> should return 404 when location not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const response = await request(app)
    .put('/api/locations/99999')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: 'UPDATED',
      name: 'Updated Location',
    })
    .expect(404);

  assert.ok(response.body);
});

test('PUT /api/locations/:id -> should return 400 when id is not a number', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const response = await request(app)
    .put('/api/locations/invalid')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: 'UPDATED',
      name: 'Updated Location',
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('Geçersiz'));
});

test('PUT /api/locations/:id -> should return 400 when no fields to update', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser, location } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const response = await request(app)
    .put(`/api/locations/${location.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({})
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('alan bulunamadı'));
});

test('PUT /api/locations/:id -> should return 400 when department_id does not belong to municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser, location } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // Başka bir belediye ve departman oluştur
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherDepartment = await createTestDepartment(db, otherMunicipality.id);
  
  const response = await request(app)
    .put(`/api/locations/${location.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      department_id: otherDepartment.id,
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('belediyeye ait değil'));
});

test('PUT /api/locations/:id -> should return 409 when code conflicts with another location', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser, location: location1 } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const location2 = await createTestLocation(db, municipality.id, {
    code: 'LOC2',
    name: 'Location 2',
  });
  
  // location1'i location2'nin code'u ile güncellemeye çalış
  const response = await request(app)
    .put(`/api/locations/${location1.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: 'LOC2',
      name: 'Updated Location 1',
    })
    .expect(409);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('kayıt mevcut'));
});

test('PUT /api/locations/:id -> should return 200 and update location successfully', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  try {
    const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
    
    const location = await createTestLocation(db, municipality.id, {
      code: 'ORIGINAL',
      name: 'Original Location',
    });
    
    const updateData = {
      code: 'UPDATED',
      name: 'Updated Location Name',
      address: 'Updated Address',
      type: 2, // Depo
      is_active: false,
    };
    
    const response = await request(app)
      .put(`/api/locations/${location.id}`)
      .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
      .send(updateData);

    if (response.status !== 200) {
      console.error('\n=== PUT /api/locations/:id FAILED ===');
      console.error('Status:', response.status);
      console.error('Expected: 200');
      console.error('Response body:', JSON.stringify(response.body, null, 2));
      console.error('Request data:', JSON.stringify(updateData, null, 2));
      throw new Error(`Expected status 200, got ${response.status}. Response: ${JSON.stringify(response.body)}`);
    }

    if (!response.body || !response.body.id) {
      throw new Error('Response body or id is missing');
    }
    
    const updatedLocation = response.body;
    
    if (updatedLocation.code !== updateData.code) {
      throw new Error(`Code mismatch. Expected: ${updateData.code}, Got: ${updatedLocation.code}`);
    }
    
    if (updatedLocation.name !== updateData.name) {
      throw new Error(`Name mismatch. Expected: ${updateData.name}, Got: ${updatedLocation.name}`);
    }
    
    if (updatedLocation.is_active !== updateData.is_active) {
      throw new Error(`is_active mismatch. Expected: ${updateData.is_active}, Got: ${updatedLocation.is_active}`);
    }
    
    // Veritabanında güncellendiğini doğrula
    const dbLocation = await db('locations')
      .where({ id: location.id })
      .first();
    
    if (!dbLocation) {
      throw new Error(`Location not found in database with id: ${location.id}`);
    }
    
    if (dbLocation.code !== updateData.code) {
      throw new Error(`Database location code mismatch. Expected: ${updateData.code}, Got: ${dbLocation.code}`);
    }
  } catch (err) {
    console.error('\n=== TEST ERROR ===');
    console.error(err.message);
    console.error(err.stack);
    throw err;
  }
});

// ============================================================================
// DELETE /api/locations/:id - DELETE LOCATION TESTS
// ============================================================================

test('DELETE /api/locations/:id -> should return 404 when location not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const response = await request(app)
    .delete('/api/locations/99999')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .expect(404);

  assert.ok(response.body);
});

test('DELETE /api/locations/:id -> should return 400 when id is not a number', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const response = await request(app)
    .delete('/api/locations/invalid')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('Geçersiz'));
});

test('DELETE /api/locations/:id -> should return 204 and delete location successfully', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // Silinecek bir lokasyon oluştur
  const location = await createTestLocation(db, municipality.id, {
    code: 'TO-DELETE',
    name: 'Location to Delete',
  });
  
  const response = await request(app)
    .delete(`/api/locations/${location.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .expect(204);

  // 204 No Content - body olmamalı veya boş olmalı
  // supertest 204 için boş obje {} döndürebilir
  if (response.body && Object.keys(response.body).length > 0) {
    throw new Error(`Response body should be empty for 204, got: ${JSON.stringify(response.body)}`);
  }
  
  // Veritabanında silindiğini doğrula
  const dbLocation = await db('locations')
    .where({ id: location.id })
    .first();
  
  assert.equal(dbLocation, undefined, 'Location should be deleted from database');
});

// ============================================================================
// GET /api/locations/stats - LOCATION STATS TESTS
// ============================================================================

test('GET /api/locations/stats -> should return location statistics', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Farklı type'larda lokasyonlar oluştur
  await createTestLocation(db, municipality.id, {
    code: 'OFFICE',
    name: 'Office Location',
    type: 1, // Ofis
    is_active: true,
  });
  
  await createTestLocation(db, municipality.id, {
    code: 'WAREHOUSE',
    name: 'Warehouse Location',
    type: 2, // Depo
    is_active: true,
  });
  
  const response = await request(app)
    .get('/api/locations/stats')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(response.body.totals);
  assert.ok(typeof response.body.totals.locations === 'number');
  assert.ok(typeof response.body.totals.active_locations === 'number');
  assert.ok(typeof response.body.totals.warehouses === 'number');
  assert.ok(response.body.totals.locations >= 2);
});

// ============================================================================
// GET /api/locations/type-distribution - TYPE DISTRIBUTION TESTS
// ============================================================================

test('GET /api/locations/type-distribution -> should return location type distribution', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Farklı type'larda lokasyonlar oluştur
  await createTestLocation(db, municipality.id, {
    code: 'OFFICE',
    name: 'Office Location',
    type: 1, // Ofis
  });
  
  await createTestLocation(db, municipality.id, {
    code: 'WAREHOUSE',
    name: 'Warehouse Location',
    type: 2, // Depo
  });
  
  const response = await request(app)
    .get('/api/locations/type-distribution')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(response.body.distribution);
  assert.ok(typeof response.body.distribution.office === 'number');
  assert.ok(typeof response.body.distribution.warehouse === 'number');
  assert.ok(typeof response.body.distribution.open_area === 'number');
  assert.ok(typeof response.body.distribution.building === 'number');
  assert.ok(typeof response.body.distribution.other === 'number');
  assert.ok(typeof response.body.total === 'number');
  assert.equal(Number(response.body.municipality_id), Number(municipality.id));
});

