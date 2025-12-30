/**
 * Users Routes Integration Tests
 * 
 * Bu dosya users endpoint'lerinin gerçek veritabanı ve Express app ile
 * entegrasyon testlerini içerir.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupTestDb, teardownTestDb, cleanDatabase, getTestApp, runMigrations } = require('../api/src/__tests__/helpers/testSetup');
const { getAuthHeader, getSuperadminToken, getUserToken } = require('../api/src/__tests__/helpers/authHelper');

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
// USERS LIST ENDPOINT TESTS
// ============================================================================

test('GET /api/users -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .get('/api/users')
    .expect(401);

  assert.ok(response.body);
});

test('GET /api/users -> should return 401 for invalid token', async () => {
  const app = getTestApp();
  const response = await request(app)
    .get('/api/users')
    .set('Authorization', 'Bearer invalid-token')
    .expect(401);

  assert.ok(response.body);
});

test('GET /api/users -> should return 200 with valid token', async () => {
  const app = getTestApp();
  
  // Test için gerekli verileri oluştur
  // Örnek: Belediye ve kullanıcı oluştur
  // Bu kısım veritabanı şemanıza göre düzenlenmelidir
  
  const token = getUserToken();
  const response = await request(app)
    .get('/api/users')
    .set(getAuthHeader({ id: 1, role_id: 3 }))
    .expect(200);

  assert.ok(response.body);
  // Response body'nin yapısına göre assertion'lar ekleyin
});

// ============================================================================
// USER STATS ENDPOINT TESTS
// ============================================================================

test('GET /api/users/stats -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .get('/api/users/stats')
    .expect(401);

  assert.ok(response.body);
});

// ============================================================================
// CREATE USER ENDPOINT TESTS
// ============================================================================

test('POST /api/users -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .post('/api/users')
    .send({
      email: 'newuser@example.com',
      password: 'password123',
      name: 'Test User',
    })
    .expect(401);

  assert.ok(response.body);
});

test('POST /api/users -> should return 400 when required fields are missing', async () => {
  const app = getTestApp();
  const token = getSuperadminToken();
  
  const response = await request(app)
    .post('/api/users')
    .set(getAuthHeader({ id: 1, role_id: 1 }))
    .send({
      email: 'newuser@example.com',
      // password eksik
    })
    .expect(400);

  assert.ok(response.body);
});

// Not: Gerçek veritabanı işlemleri için seed data veya test data factory'leri
// kullanmanız önerilir. Bu örnekler temel yapıyı gösterir.

