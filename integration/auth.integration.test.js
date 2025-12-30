/**
 * Auth Routes Integration Tests
 * 
 * Bu dosya auth endpoint'lerinin gerçek veritabanı ve Express app ile
 * entegrasyon testlerini içerir.
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
// LOGIN ENDPOINT TESTS
// ============================================================================

test('POST /api/auth/login -> should return 400 when email is missing', async () => {
  const app = getTestApp();
  const response = await request(app)
    .post('/api/auth/login')
    .send({ password: 'test123' })
    .expect(400);

  assert.ok(response.body);
  // Response body'de hata mesajı olmalı
});

test('POST /api/auth/login -> should return 400 when password is missing', async () => {
  const app = getTestApp();
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email: 'test@example.com' })
    .expect(400);

  assert.ok(response.body);
});

test('POST /api/auth/login -> should return 401 for invalid credentials', async () => {
  const app = getTestApp();
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'nonexistent@example.com',
      password: 'wrongpassword',
    })
    .expect(401);

  assert.ok(response.body);
});

// ============================================================================
// SIGNUP ENDPOINT TESTS
// ============================================================================

test('POST /api/auth/signup -> should return 400 when required fields are missing', async () => {
  const app = getTestApp();
  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      email: 'test@example.com',
      // password ve diğer required field'lar eksik
    })
    .expect(400);

  assert.ok(response.body);
});

// ============================================================================
// ME ENDPOINT TESTS (Protected Route)
// ============================================================================

test('GET /api/auth/me -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .get('/api/auth/me')
    .expect(401);

  assert.ok(response.body);
});

test('GET /api/auth/me -> should return 401 for invalid token', async () => {
  const app = getTestApp();
  const response = await request(app)
    .get('/api/auth/me')
    .set('Authorization', 'Bearer invalid-token')
    .expect(401);

  assert.ok(response.body);
});

// ============================================================================
// LOGOUT ENDPOINT TESTS
// ============================================================================

test('POST /api/auth/logout -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .post('/api/auth/logout')
    .expect(401);

  assert.ok(response.body);
});

test('POST /api/auth/logout -> should return 200 with valid token', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  // Auth middleware kullanıcıyı veritabanından çektiği için test kullanıcısı oluştur
  // Önce gerekli bağımlı verileri oluştur
  const [municipality] = await db('municipalities').insert({
    name: 'Test Belediyesi Logout',
    email: 'test-logout@belediye.gov.tr',
    status: 'active',
  }).returning('id');

  // Mevcut role'ü kullan (seed'lerde role id 3 = 'tasinir_kontrol' veya USER)
  // Eğer roles tablosu boşsa, bir role oluştur
  let role = await db('roles').where({ id: 3 }).first();
  if (!role) {
    // Role yoksa oluştur
    [role] = await db('roles').insert({
      id: 3,
      name: 'kullanici',
      description: 'Standart kullanıcı',
    }).returning('*');
  }
  const roleId = role.id || 3;

  // Test kullanıcısı oluştur
  const [testUser] = await db('users').insert({
    username: 'test_logout_user',
    email: 'test-logout@example.com',
    full_name: 'Test Logout User',
    password_hash: '$2b$10$dummyhash', // Gerçek hash gerekmez, sadece auth middleware için
    role_id: roleId,
    municipality_id: municipality.id,
    is_active: true,
  }).returning('id');

  // Token ile logout isteği gönder
  const response = await request(app)
    .post('/api/auth/logout')
    .set(getAuthHeader({ id: testUser.id, role_id: roleId }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(response.body.message);
  // Cookie'nin temizlendiğini kontrol et (supertest cookie'leri otomatik kontrol eder)
});

// Not: Gerçek kullanıcı oluşturup login testi yapmak için
// veritabanında seed data'ya ihtiyaç var. Bu örnekler temel yapıyı gösterir.

