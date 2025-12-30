/**
 * Asset Categories Routes Integration Tests
 * 
 * Bu dosya asset_categories endpoint'lerinin gerçek veritabanı ve Express app ile
 * entegrasyon testlerini içerir.
 * 
 * Test Senaryoları:
 * - CRUD işlemleri (Create, Read, Update, Delete)
 * - Tenant scope kontrolü
 * - Validation hataları
 * - Duplicate kontrolü (code ve name)
 * - Category stats ve distribution
 * - Delete kontrolü (bağlı asset varsa silinemez)
 * - Authorization kontrolleri
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupTestDb, teardownTestDb, cleanDatabase, getTestApp, getTestDb, runMigrations } = require('../helpers/testSetup');
const { getAuthHeader } = require('../helpers/authHelper');
const {
  createTestEnvironment,
  createTestCategory,
  createTestMunicipality,
  createTestAsset,
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
// POST /api/asset-categories - CREATE CATEGORY TESTS
// ============================================================================

test('POST /api/asset-categories -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .post('/api/asset-categories')
    .send({
      code: 'TEST',
      name: 'Test Category',
    })
    .expect(401);

  assert.ok(response.body);
});

test('POST /api/asset-categories -> should return 403 when user role is not admin', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .post('/api/asset-categories')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .send({
      code: 'TEST',
      name: 'Test Category',
    })
    .expect(403);

  assert.ok(response.body);
});

test('POST /api/asset-categories -> should return 400 when required fields are missing', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // code eksik
  const response1 = await request(app)
    .post('/api/asset-categories')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      name: 'Test Category',
    })
    .expect(400);

  assert.ok(response1.body);
  assert.ok(response1.body.message.includes('zorunludur'));
  
  // name eksik
  const response2 = await request(app)
    .post('/api/asset-categories')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: 'TEST',
    })
    .expect(400);

  assert.ok(response2.body);
  assert.ok(response2.body.message.includes('zorunludur'));
});

test('POST /api/asset-categories -> should return 409 when code or name already exists', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // İlk kategoriyi oluştur
  const category = await createTestCategory(db, municipality.id, {
    code: 'TEST',
    name: 'Test Category',
  });
  
  // Aynı code ile kategori oluşturmaya çalış
  const response1 = await request(app)
    .post('/api/asset-categories')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: 'TEST',
      name: 'Different Name',
    })
    .expect(409);

  assert.ok(response1.body);
  assert.ok(response1.body.message.includes('zaten mevcut'));
  
  // Aynı name ile kategori oluşturmaya çalış
  const response2 = await request(app)
    .post('/api/asset-categories')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: 'DIFF',
      name: 'Test Category',
    })
    .expect(409);

  assert.ok(response2.body);
  assert.ok(response2.body.message.includes('zaten mevcut'));
});

test('POST /api/asset-categories -> should return 201 and create category successfully', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  try {
    const { municipality } = await createTestEnvironment(db, { userRoleId: 2 });
    
    const adminUser = await db('users')
      .where({ municipality_id: municipality.id, role_id: 2 })
      .first();
    
    const categoryData = {
      code: 'TEST-CAT',
      name: 'Test Category Integration',
      description: 'Integration test için oluşturuldu',
    };
    
    const response = await request(app)
      .post('/api/asset-categories')
      .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
      .send(categoryData);

    if (response.status !== 201) {
      console.error('\n=== POST /api/asset-categories FAILED ===');
      console.error('Status:', response.status);
      console.error('Expected: 201');
      console.error('Response body:', JSON.stringify(response.body, null, 2));
      console.error('Request data:', JSON.stringify(categoryData, null, 2));
      throw new Error(`Expected status 201, got ${response.status}. Response: ${JSON.stringify(response.body)}`);
    }

    if (!response.body || !response.body.category) {
      throw new Error('Response body or category is missing');
    }
    
    const category = response.body.category;
    
    if (category.code !== categoryData.code) {
      throw new Error(`Code mismatch. Expected: ${categoryData.code}, Got: ${category.code}`);
    }
    
    if (category.name !== categoryData.name) {
      throw new Error(`Name mismatch. Expected: ${categoryData.name}, Got: ${category.name}`);
    }
    
    if (category.description !== categoryData.description) {
      throw new Error(`Description mismatch. Expected: ${categoryData.description}, Got: ${category.description}`);
    }
    
    if (Number(category.municipality_id) !== Number(municipality.id)) {
      throw new Error(`Municipality ID mismatch. Expected: ${municipality.id}, Got: ${category.municipality_id}`);
    }
    
    // Veritabanında kaydın oluşturulduğunu doğrula
    const dbCategory = await db('asset_categories')
      .where({ id: category.id })
      .first();
    
    if (!dbCategory) {
      throw new Error(`Category not found in database with id: ${category.id}`);
    }
    
    if (dbCategory.code !== categoryData.code) {
      throw new Error(`Database category code mismatch. Expected: ${categoryData.code}, Got: ${dbCategory.code}`);
    }
    
    if (Number(dbCategory.municipality_id) !== Number(municipality.id)) {
      throw new Error(`Database municipality_id mismatch. Expected: ${municipality.id}, Got: ${dbCategory.municipality_id}`);
    }
  } catch (err) {
    console.error('\n=== TEST ERROR ===');
    console.error(err.message);
    console.error(err.stack);
    throw err;
  }
});

// ============================================================================
// GET /api/asset-categories - LIST CATEGORIES TESTS
// ============================================================================

test('GET /api/asset-categories -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .get('/api/asset-categories')
    .expect(401);

  assert.ok(response.body);
});

test('GET /api/asset-categories -> should return 200 and list categories for municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user, category: envCategory } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Birkaç kategori daha oluştur
  const category1 = await createTestCategory(db, municipality.id, {
    code: 'CAT1',
    name: 'Category 1',
  });
  
  const category2 = await createTestCategory(db, municipality.id, {
    code: 'CAT2',
    name: 'Category 2',
  });
  
  // Başka bir belediye ve kategori oluştur (tenant scope testi için)
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  await createTestCategory(db, otherMunicipality.id, {
    code: 'OTHER',
    name: 'Other Category',
  });
  
  const response = await request(app)
    .get('/api/asset-categories')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body), 'Response should be an array');
  // createTestEnvironment bir kategori oluşturuyor + 2 kategori daha = 3 kategori
  assert.equal(response.body.length, 3, 'Should return only categories from user municipality');
  
  // Kategorilerin ID'lerini kontrol et
  const categoryIds = response.body.map(c => Number(c.id));
  assert.ok(categoryIds.includes(Number(envCategory.id)), 'Environment category should be in the list');
  assert.ok(categoryIds.includes(Number(category1.id)), 'Category 1 should be in the list');
  assert.ok(categoryIds.includes(Number(category2.id)), 'Category 2 should be in the list');
});

test('GET /api/asset-categories -> should return categories created by createTestEnvironment', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user, category } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .get('/api/asset-categories')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body));
  // createTestEnvironment bir kategori oluşturuyor
  assert.equal(response.body.length, 1, 'Should return category created by createTestEnvironment');
  assert.equal(Number(response.body[0].id), Number(category.id), 'Should return the correct category');
});

// ============================================================================
// GET /api/asset-categories/:id - GET CATEGORY BY ID TESTS
// ============================================================================

test('GET /api/asset-categories/:id -> should return 404 when category not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .get('/api/asset-categories/99999')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(404);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('bulunamadı'));
});

test('GET /api/asset-categories/:id -> should return 404 when category belongs to other municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Başka bir belediye ve kategori oluştur
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherCategory = await createTestCategory(db, otherMunicipality.id);
  
  // Başka belediyenin kategorisine erişmeye çalış
  const response = await request(app)
    .get(`/api/asset-categories/${otherCategory.id}`)
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(404);

  assert.ok(response.body);
});

test('GET /api/asset-categories/:id -> should return 200 and get category by id with asset count', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user, category, department, location } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Kategoriye bağlı bir asset oluştur
  const asset = await createTestAsset(db, municipality.id, {
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  
  // Asset'in oluşturulduğunu doğrula
  const dbAsset = await db('assets').where({ id: asset.id }).first();
  assert.ok(dbAsset, 'Asset should be created in database');
  assert.equal(Number(dbAsset.category_id), Number(category.id), 'Asset should be linked to category');
  
  const response = await request(app)
    .get(`/api/asset-categories/${category.id}`)
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.equal(Number(response.body.id), Number(category.id));
  assert.equal(response.body.name, category.name);
  assert.equal(response.body.code, category.code);
  assert.ok(typeof response.body.asset_count === 'number', 'Asset count should be a number');
  assert.equal(response.body.asset_count, 1, 'Asset count should be 1');
});

// ============================================================================
// PUT /api/asset-categories/:id - UPDATE CATEGORY TESTS
// ============================================================================

test('PUT /api/asset-categories/:id -> should return 404 when category not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const adminUser = await db('users')
    .where({ municipality_id: municipality.id, role_id: 2 })
    .first();
  
  const response = await request(app)
    .put('/api/asset-categories/99999')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: 'UPDATED',
      name: 'Updated Category',
    })
    .expect(404);

  assert.ok(response.body);
});

test('PUT /api/asset-categories/:id -> should return 400 when required fields are missing', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, category, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // code eksik
  const response = await request(app)
    .put(`/api/asset-categories/${category.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      name: 'Updated Category',
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('zorunludur'));
});

test('PUT /api/asset-categories/:id -> should return 409 when code or name conflicts with another category', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, category: category1, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const category2 = await createTestCategory(db, municipality.id, {
    code: 'CAT2',
    name: 'Category 2',
  });
  
  // category1'i category2'nin code'u ile güncellemeye çalış
  const response = await request(app)
    .put(`/api/asset-categories/${category1.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      code: 'CAT2',
      name: 'Updated Category 1',
    })
    .expect(409);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('zaten mevcut'));
});

test('PUT /api/asset-categories/:id -> should return 200 and update category successfully', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  try {
    const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
    
    const category = await createTestCategory(db, municipality.id, {
      code: 'ORIGINAL',
      name: 'Original Category',
    });
    
    const updateData = {
      code: 'UPDATED',
      name: 'Updated Category Name',
      description: 'Updated description',
    };
    
    const response = await request(app)
      .put(`/api/asset-categories/${category.id}`)
      .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
      .send(updateData);

    if (response.status !== 200) {
      console.error('\n=== PUT /api/asset-categories/:id FAILED ===');
      console.error('Status:', response.status);
      console.error('Expected: 200');
      console.error('Response body:', JSON.stringify(response.body, null, 2));
      console.error('Request data:', JSON.stringify(updateData, null, 2));
      throw new Error(`Expected status 200, got ${response.status}. Response: ${JSON.stringify(response.body)}`);
    }

    if (!response.body || !response.body.category) {
      throw new Error('Response body or category is missing');
    }
    
    const updatedCategory = response.body.category;
    
    if (updatedCategory.code !== updateData.code) {
      throw new Error(`Code mismatch. Expected: ${updateData.code}, Got: ${updatedCategory.code}`);
    }
    
    if (updatedCategory.name !== updateData.name) {
      throw new Error(`Name mismatch. Expected: ${updateData.name}, Got: ${updatedCategory.name}`);
    }
    
    if (updatedCategory.description !== updateData.description) {
      throw new Error(`Description mismatch. Expected: ${updateData.description}, Got: ${updatedCategory.description}`);
    }
    
    // Veritabanında güncellendiğini doğrula
    const dbCategory = await db('asset_categories')
      .where({ id: category.id })
      .first();
    
    if (!dbCategory) {
      throw new Error(`Category not found in database with id: ${category.id}`);
    }
    
    if (dbCategory.code !== updateData.code) {
      throw new Error(`Database category code mismatch. Expected: ${updateData.code}, Got: ${dbCategory.code}`);
    }
  } catch (err) {
    console.error('\n=== TEST ERROR ===');
    console.error(err.message);
    console.error(err.stack);
    throw err;
  }
});

// ============================================================================
// DELETE /api/asset-categories/:id - DELETE CATEGORY TESTS
// ============================================================================

test('DELETE /api/asset-categories/:id -> should return 404 when category not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const adminUser = await db('users')
    .where({ municipality_id: municipality.id, role_id: 2 })
    .first();
  
  const response = await request(app)
    .delete('/api/asset-categories/99999')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .expect(404);

  assert.ok(response.body);
});

test('DELETE /api/asset-categories/:id -> should return 400 when category has linked assets', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, category, department, location, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // Kategoriye bağlı bir asset oluştur
  const asset = await createTestAsset(db, municipality.id, {
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  
  // Asset'in oluşturulduğunu doğrula
  const dbAsset = await db('assets').where({ id: asset.id }).first();
  assert.ok(dbAsset, 'Asset should be created in database');
  
  const response = await request(app)
    .delete(`/api/asset-categories/${category.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('bağlı varlıklar'));
});

test('DELETE /api/asset-categories/:id -> should return 200 and delete category successfully', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // Bağlı asset olmayan bir kategori oluştur
  const category = await createTestCategory(db, municipality.id, {
    code: 'TO-DELETE',
    name: 'Category to Delete',
  });
  
  const response = await request(app)
    .delete(`/api/asset-categories/${category.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('silindi'));
  
  // Veritabanında silindiğini doğrula
  const dbCategory = await db('asset_categories')
    .where({ id: category.id })
    .first();
  
  assert.equal(dbCategory, undefined, 'Category should be deleted from database');
});

// ============================================================================
// GET /api/asset-categories/stats - CATEGORY STATS TESTS
// ============================================================================

test('GET /api/asset-categories/stats -> should return category statistics', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user, category, department, location } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Kategoriye bağlı bir asset oluştur
  const asset = await createTestAsset(db, municipality.id, {
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
    status: 'active',
  });
  
  // Asset'in oluşturulduğunu doğrula
  const dbAsset = await db('assets').where({ id: asset.id }).first();
  assert.ok(dbAsset, 'Asset should be created in database');
  
  const response = await request(app)
    .get('/api/asset-categories/stats')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(typeof response.body.total_categories === 'number');
  assert.ok(typeof response.body.total_active_categories === 'number');
  assert.ok(typeof response.body.total_empty_categories === 'number');
  assert.ok(response.body.total_categories >= 1);
});

// ============================================================================
// GET /api/asset-categories/distribution - CATEGORY DISTRIBUTION TESTS
// ============================================================================

test('GET /api/asset-categories/distribution -> should return category distribution', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user, category, department, location } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Kategoriye bağlı bir asset oluştur
  const asset = await createTestAsset(db, municipality.id, {
    category_id: category.id,
    department_id: department.id,
    location_id: location.id,
  });
  
  // Asset'in oluşturulduğunu doğrula
  const dbAsset = await db('assets').where({ id: asset.id }).first();
  assert.ok(dbAsset, 'Asset should be created in database');
  
  const response = await request(app)
    .get('/api/asset-categories/distribution')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length >= 1);
  
  // Kategorinin asset_count'u olmalı
  const categoryWithAssets = response.body.find(c => Number(c.id) === Number(category.id));
  assert.ok(categoryWithAssets, 'Category should be in distribution');
  assert.equal(categoryWithAssets.asset_count, 1, 'Category should have 1 asset');
});

