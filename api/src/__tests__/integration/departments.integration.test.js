/**
 * Departments Routes Integration Tests
 * 
 * Bu dosya departments endpoint'lerinin gerçek veritabanı ve Express app ile
 * entegrasyon testlerini içerir.
 * 
 * Test Senaryoları:
 * - CRUD işlemleri (Create, Read, Update, Delete)
 * - Tenant scope kontrolü
 * - Validation hataları
 * - Duplicate kontrolü (code)
 * - Manager user validation
 * - Authorization kontrolleri
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupTestDb, teardownTestDb, cleanDatabase, getTestApp, getTestDb, runMigrations } = require('../helpers/testSetup');
const { getAuthHeader } = require('../helpers/authHelper');
const {
  createTestEnvironment,
  createTestDepartment,
  createTestMunicipality,
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
// Not: --test-concurrency=1 ile seri çalıştırıldığı için deadlock riski azalır
test.beforeEach(async () => {
  await cleanDatabase();
});

// ============================================================================
// POST /api/departments - CREATE DEPARTMENT TESTS
// ============================================================================

test('POST /api/departments -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .post('/api/departments')
    .send({
      code: 'TEST',
      name: 'Test Department',
    })
    .expect(401);

  assert.ok(response.body);
});

test('POST /api/departments -> should return 403 when user role is not admin', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .post('/api/departments')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .send({
      code: 'TEST',
      name: 'Test Department',
    })
    .expect(403);

  assert.ok(response.body);
});

test('POST /api/departments -> should return 400 when required fields are missing', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // code eksik
  const response1 = await request(app)
    .post('/api/departments')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      name: 'Test Department',
    })
    .expect(400);

  assert.ok(response1.body);
  assert.ok(response1.body.message.includes('zorunludur'));
  
  // name eksik
  const response2 = await request(app)
    .post('/api/departments')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: 'TEST',
    })
    .expect(400);

  assert.ok(response2.body);
  assert.ok(response2.body.message.includes('zorunludur'));
});

test('POST /api/departments -> should return 400 when manager_user_id does not belong to municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // Başka bir belediye ve kullanıcı oluştur
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherUser = await createTestUser(db, otherMunicipality.id, 3);
  
  const response = await request(app)
    .post('/api/departments')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: 'TEST',
      name: 'Test Department',
      manager_user_id: otherUser.id,
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('belediyeye ait değil'));
});

test('POST /api/departments -> should return 409 when code already exists', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // İlk departmanı oluştur
  const department = await createTestDepartment(db, municipality.id, {
    code: 'TEST',
    name: 'Test Department',
  });
  
  // Aynı code ile departman oluşturmaya çalış
  const response = await request(app)
    .post('/api/departments')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: 'TEST',
      name: 'Different Name',
    })
    .expect(409);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('zaten kullanılıyor'));
});

test('POST /api/departments -> should return 201 and create department successfully', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  try {
    const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
    
    const departmentData = {
      code: 'TEST-DEPT',
      name: 'Test Department Integration',
      is_active: true,
    };
    
    const response = await request(app)
      .post('/api/departments')
      .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
      .send(departmentData);

    if (response.status !== 201) {
      console.error('\n=== POST /api/departments FAILED ===');
      console.error('Status:', response.status);
      console.error('Expected: 201');
      console.error('Response body:', JSON.stringify(response.body, null, 2));
      console.error('Request data:', JSON.stringify(departmentData, null, 2));
      throw new Error(`Expected status 201, got ${response.status}. Response: ${JSON.stringify(response.body)}`);
    }

    if (!response.body || !response.body.id) {
      throw new Error('Response body or id is missing');
    }
    
    const department = response.body;
    
    if (department.code !== departmentData.code) {
      throw new Error(`Code mismatch. Expected: ${departmentData.code}, Got: ${department.code}`);
    }
    
    if (department.name !== departmentData.name) {
      throw new Error(`Name mismatch. Expected: ${departmentData.name}, Got: ${department.name}`);
    }
    
    if (Number(department.municipality_id) !== Number(municipality.id)) {
      throw new Error(`Municipality ID mismatch. Expected: ${municipality.id}, Got: ${department.municipality_id}`);
    }
    
    // Veritabanında kaydın oluşturulduğunu doğrula
    const dbDepartment = await db('departments')
      .where({ id: department.id })
      .first();
    
    if (!dbDepartment) {
      throw new Error(`Department not found in database with id: ${department.id}`);
    }
    
    if (dbDepartment.code !== departmentData.code) {
      throw new Error(`Database department code mismatch. Expected: ${departmentData.code}, Got: ${dbDepartment.code}`);
    }
    
    if (Number(dbDepartment.municipality_id) !== Number(municipality.id)) {
      throw new Error(`Database municipality_id mismatch. Expected: ${municipality.id}, Got: ${dbDepartment.municipality_id}`);
    }
  } catch (err) {
    console.error('\n=== TEST ERROR ===');
    console.error(err.message);
    console.error(err.stack);
    throw err;
  }
});

test('POST /api/departments -> should return 201 and create department with manager_user_id', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser, user: managerUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // Manager olarak kullanılacak bir user oluştur
  const manager = await createTestUser(db, municipality.id, 3);
  
  const departmentData = {
    code: 'TEST-MGR',
    name: 'Test Department with Manager',
    manager_user_id: manager.id,
    is_active: true,
  };
  
  const response = await request(app)
    .post('/api/departments')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send(departmentData)
    .expect(201);

  assert.ok(response.body);
  assert.equal(response.body.code, departmentData.code);
  assert.equal(response.body.name, departmentData.name);
  assert.equal(Number(response.body.manager_user_id), Number(manager.id));
  assert.equal(Number(response.body.municipality_id), Number(municipality.id));
});

// ============================================================================
// GET /api/departments - LIST DEPARTMENTS TESTS
// ============================================================================

test('GET /api/departments -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .get('/api/departments')
    .expect(401);

  assert.ok(response.body);
});

test('GET /api/departments -> should return 200 and list departments for municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Birkaç departman oluştur
  const department1 = await createTestDepartment(db, municipality.id, {
    code: 'DEPT1',
    name: 'Department 1',
  });
  
  const department2 = await createTestDepartment(db, municipality.id, {
    code: 'DEPT2',
    name: 'Department 2',
  });
  
  // Başka bir belediye ve departman oluştur (tenant scope testi için)
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  await createTestDepartment(db, otherMunicipality.id, {
    code: 'OTHER',
    name: 'Other Department',
  });
  
  const response = await request(app)
    .get('/api/departments')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body), 'Response should be an array');
  // createTestEnvironment bir departman oluşturuyor + 2 departman daha = 3 departman
  assert.equal(response.body.length, 3, 'Should return only departments from user municipality');
  
  // Sadece aktif departmanları görmeli (default)
  const activeDepartments = response.body.filter(d => d.is_active === true);
  assert.ok(activeDepartments.length >= 2, 'Should return active departments');
  
  // Kategorilerin ID'lerini kontrol et
  const departmentIds = response.body.map(d => Number(d.id));
  assert.ok(departmentIds.includes(Number(department1.id)), 'Department 1 should be in the list');
  assert.ok(departmentIds.includes(Number(department2.id)), 'Department 2 should be in the list');
});

test('GET /api/departments -> should return 200 with includeInactive query param', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Aktif bir departman oluştur
  const activeDept = await createTestDepartment(db, municipality.id, {
    code: 'ACTIVE',
    name: 'Active Department',
    is_active: true,
  });
  
  // Pasif bir departman oluştur
  const inactiveDept = await createTestDepartment(db, municipality.id, {
    code: 'INACTIVE',
    name: 'Inactive Department',
    is_active: false,
  });
  
  // includeInactive=true ile istek gönder
  const response = await request(app)
    .get('/api/departments?includeInactive=true')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body));
  // createTestEnvironment bir departman oluşturuyor + 2 departman = en az 3
  assert.ok(response.body.length >= 3, 'Should return all departments including inactive');
  
  // Hem aktif hem pasif departmanları görmeli
  const departmentIds = response.body.map(d => Number(d.id));
  assert.ok(departmentIds.includes(Number(activeDept.id)), 'Active department should be in the list');
  assert.ok(departmentIds.includes(Number(inactiveDept.id)), 'Inactive department should be in the list');
});

// ============================================================================
// GET /api/departments/:id - GET DEPARTMENT BY ID TESTS
// ============================================================================

test('GET /api/departments/:id -> should return 404 when department not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .get('/api/departments/99999')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(404);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('bulunamadı'));
});

test('GET /api/departments/:id -> should return 404 when department belongs to other municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Başka bir belediye ve departman oluştur
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherDepartment = await createTestDepartment(db, otherMunicipality.id);
  
  // Başka belediyenin departmanına erişmeye çalış
  const response = await request(app)
    .get(`/api/departments/${otherDepartment.id}`)
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(404);

  assert.ok(response.body);
});

test('GET /api/departments/:id -> should return 200 and get department by id', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user, department } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .get(`/api/departments/${department.id}`)
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.equal(Number(response.body.id), Number(department.id));
  assert.equal(response.body.name, department.name);
  assert.equal(response.body.code, department.code);
  assert.equal(Number(response.body.municipality_id), Number(municipality.id));
});

// ============================================================================
// PUT /api/departments/:id - UPDATE DEPARTMENT TESTS
// ============================================================================

test('PUT /api/departments/:id -> should return 404 when department not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const response = await request(app)
    .put('/api/departments/99999')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: 'UPDATED',
      name: 'Updated Department',
    })
    .expect(404);

  assert.ok(response.body);
});

test('PUT /api/departments/:id -> should return 400 when no fields to update', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser, department } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const response = await request(app)
    .put(`/api/departments/${department.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({})
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('alan bulunamadı'));
});

test('PUT /api/departments/:id -> should return 400 when code or name is empty', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser, department } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // code boş
  const response1 = await request(app)
    .put(`/api/departments/${department.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: '',
      name: 'Updated Department',
    })
    .expect(400);

  assert.ok(response1.body);
  assert.ok(response1.body.message.includes('boş olamaz'));
  
  // name boş
  const response2 = await request(app)
    .put(`/api/departments/${department.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: 'UPDATED',
      name: '',
    })
    .expect(400);

  assert.ok(response2.body);
  assert.ok(response2.body.message.includes('boş olamaz'));
});

test('PUT /api/departments/:id -> should return 400 when manager_user_id does not belong to municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser, department } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // Başka bir belediye ve kullanıcı oluştur
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherUser = await createTestUser(db, otherMunicipality.id, 3);
  
  const response = await request(app)
    .put(`/api/departments/${department.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      manager_user_id: otherUser.id,
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('belediyeye ait değil'));
});

test('PUT /api/departments/:id -> should return 409 when code conflicts with another department', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser, department: department1 } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const department2 = await createTestDepartment(db, municipality.id, {
    code: 'DEPT2',
    name: 'Department 2',
  });
  
  // department1'i department2'nin code'u ile güncellemeye çalış
  const response = await request(app)
    .put(`/api/departments/${department1.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: 'DEPT2',
      name: 'Updated Department 1',
    })
    .expect(409);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('zaten kullanılıyor'));
});

test('PUT /api/departments/:id -> should return 200 and update department successfully', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  try {
    const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
    
    const department = await createTestDepartment(db, municipality.id, {
      code: 'ORIGINAL',
      name: 'Original Department',
    });
    
    const updateData = {
      code: 'UPDATED',
      name: 'Updated Department Name',
      is_active: false,
    };
    
    const response = await request(app)
      .put(`/api/departments/${department.id}`)
      .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
      .send(updateData);

    if (response.status !== 200) {
      console.error('\n=== PUT /api/departments/:id FAILED ===');
      console.error('Status:', response.status);
      console.error('Expected: 200');
      console.error('Response body:', JSON.stringify(response.body, null, 2));
      console.error('Request data:', JSON.stringify(updateData, null, 2));
      throw new Error(`Expected status 200, got ${response.status}. Response: ${JSON.stringify(response.body)}`);
    }

    if (!response.body || !response.body.id) {
      throw new Error('Response body or id is missing');
    }
    
    const updatedDepartment = response.body;
    
    if (updatedDepartment.code !== updateData.code) {
      throw new Error(`Code mismatch. Expected: ${updateData.code}, Got: ${updatedDepartment.code}`);
    }
    
    if (updatedDepartment.name !== updateData.name) {
      throw new Error(`Name mismatch. Expected: ${updateData.name}, Got: ${updatedDepartment.name}`);
    }
    
    if (updatedDepartment.is_active !== updateData.is_active) {
      throw new Error(`is_active mismatch. Expected: ${updateData.is_active}, Got: ${updatedDepartment.is_active}`);
    }
    
    // Veritabanında güncellendiğini doğrula
    const dbDepartment = await db('departments')
      .where({ id: department.id })
      .first();
    
    if (!dbDepartment) {
      throw new Error(`Department not found in database with id: ${department.id}`);
    }
    
    if (dbDepartment.code !== updateData.code) {
      throw new Error(`Database department code mismatch. Expected: ${updateData.code}, Got: ${dbDepartment.code}`);
    }
  } catch (err) {
    console.error('\n=== TEST ERROR ===');
    console.error(err.message);
    console.error(err.stack);
    throw err;
  }
});

// ============================================================================
// DELETE /api/departments/:id - DELETE DEPARTMENT TESTS
// ============================================================================

test('DELETE /api/departments/:id -> should return 404 when department not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const response = await request(app)
    .delete('/api/departments/99999')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .expect(404);

  assert.ok(response.body);
});

test('DELETE /api/departments/:id -> should return 200 and delete department successfully', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // Silinecek bir departman oluştur
  const department = await createTestDepartment(db, municipality.id, {
    code: 'TO-DELETE',
    name: 'Department to Delete',
  });
  
  const response = await request(app)
    .delete(`/api/departments/${department.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('silindi'));
  
  // Veritabanında silindiğini doğrula
  const dbDepartment = await db('departments')
    .where({ id: department.id })
    .first();
  
  assert.equal(dbDepartment, undefined, 'Department should be deleted from database');
});

