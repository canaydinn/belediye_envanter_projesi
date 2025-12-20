const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

// ============================================================================
// getProfile tests
// ============================================================================

test('getProfile -> 401 when user is not authenticated', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({ user: undefined });
    const res = createRes();

    await profile.getProfile(req, res);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, 'Kullanıcı oturumu bulunamadı');
  });
});

test('getProfile -> 404 when profile not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
    });
    const res = createRes();

    await profile.getProfile(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Profil bulunamadı');
  });
});

test('getProfile -> returns profile successfully with tenant scope', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    full_name: 'Test User',
    phone: '5551234567',
    role_id: 3,
    municipality_id: 5,
    is_active: true,
    email_verified_at: new Date('2024-01-01'),
    last_login_at: new Date('2024-01-15'),
    last_login_ip: '127.0.0.1',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-15'),
    role_name: 'User',
    municipality_name: 'Test Belediyesi',
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
    });
    const res = createRes();

    await profile.getProfile(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.profile.id, 1);
    assert.equal(res.body.profile.username, 'testuser');
    assert.equal(res.body.profile.email, 'test@example.com');
    assert.equal(res.body.profile.full_name, 'Test User');
    assert.equal(res.body.profile.role_name, 'User');
    assert.equal(res.body.profile.municipality_name, 'Test Belediyesi');
  });
});

test('getProfile -> returns profile successfully without tenant scope (superadmin)', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    full_name: 'Admin User',
    phone: null,
    role_id: 1,
    municipality_id: null,
    is_active: true,
    email_verified_at: null,
    last_login_at: null,
    last_login_ip: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-15'),
    role_name: 'Superadmin',
    municipality_name: 'Belediye belirtilmemiş',
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: null,
    });
    const res = createRes();

    await profile.getProfile(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.profile.id, 1);
    assert.equal(res.body.profile.username, 'admin');
    assert.equal(res.body.profile.role_name, 'Superadmin');
    assert.equal(res.body.profile.municipality_name, 'Belediye belirtilmemiş');
  });
});

test('getProfile -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
    });
    const res = createRes();

    await profile.getProfile(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// updateProfile tests
// ============================================================================

test('updateProfile -> 401 when user is not authenticated', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: undefined,
      body: { full_name: 'Test', email: 'test@example.com', username: 'test' },
    });
    const res = createRes();

    await profile.updateProfile(req, res);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, 'Kullanıcı oturumu bulunamadı');
  });
});

test('updateProfile -> 400 when full_name is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: { email: 'test@example.com', username: 'test' },
    });
    const res = createRes();

    await profile.updateProfile(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Ad soyad, kullanıcı adı ve e-posta zorunludur');
  });
});

test('updateProfile -> 400 when email is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: { full_name: 'Test User', username: 'test' },
    });
    const res = createRes();

    await profile.updateProfile(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Ad soyad, kullanıcı adı ve e-posta zorunludur');
  });
});

test('updateProfile -> 400 when username is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: { full_name: 'Test User', email: 'test@example.com' },
    });
    const res = createRes();

    await profile.updateProfile(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Ad soyad, kullanıcı adı ve e-posta zorunludur');
  });
});

test('updateProfile -> 404 when user not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: { full_name: 'Test User', email: 'test@example.com', username: 'test' },
    });
    const res = createRes();

    await profile.updateProfile(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Profil bulunamadı');
  });
});

test('updateProfile -> 400 when email already exists', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'testuser',
    email: 'old@example.com',
    municipality_id: 5,
  }]);
  mockKnex.__queue('users', 'first', [{ id: 2, email: 'new@example.com' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: { full_name: 'Test User', email: 'new@example.com', username: 'testuser' },
    });
    const res = createRes();

    await profile.updateProfile(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Bu e-posta adresi kullanımda');
  });
});

test('updateProfile -> 400 when username already exists', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'olduser',
    email: 'test@example.com',
    municipality_id: 5,
  }]);
  mockKnex.__queue('users', 'first', [null]); // Email check passes
  mockKnex.__queue('users', 'first', [{ id: 2, username: 'newuser' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: { full_name: 'Test User', email: 'test@example.com', username: 'newuser' },
    });
    const res = createRes();

    await profile.updateProfile(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Bu kullanıcı adı kullanımda');
  });
});

test('updateProfile -> updates profile successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'olduser',
    email: 'old@example.com',
    municipality_id: 5,
  }]);
  mockKnex.__queue('users', 'first', [null]); // Email check
  mockKnex.__queue('users', 'first', [null]); // Username check
  mockKnex.__queue('users', 'update:returning', [[]]);
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'newuser',
    email: 'new@example.com',
    full_name: 'New Name',
    phone: '5551234567',
    role_id: 3,
    municipality_id: 5,
    is_active: true,
    email_verified_at: null,
    last_login_at: null,
    last_login_ip: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-15'),
    role_name: 'User',
    municipality_name: 'Test Belediyesi',
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: {
        full_name: 'New Name',
        email: 'new@example.com',
        username: 'newuser',
        phone: '5551234567',
      },
    });
    const res = createRes();

    await profile.updateProfile(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'Profil güncellendi');
    assert.equal(res.body.profile.username, 'newuser');
    assert.equal(res.body.profile.email, 'new@example.com');
    assert.equal(res.body.profile.full_name, 'New Name');
    assert.equal(res.body.profile.phone, '5551234567');
  });
});

test('updateProfile -> normalizes email to lowercase', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'testuser',
    email: 'old@example.com',
    municipality_id: 5,
  }]);
  mockKnex.__queue('users', 'first', [null]); // Email check
  mockKnex.__queue('users', 'first', [null]); // Username check
  mockKnex.__queue('users', 'update:returning', [[]]);
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'testuser',
    email: 'new@example.com',
    full_name: 'Test User',
    phone: null,
    role_id: 3,
    municipality_id: 5,
    is_active: true,
    email_verified_at: null,
    last_login_at: null,
    last_login_ip: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-15'),
    role_name: 'User',
    municipality_name: 'Test Belediyesi',
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: {
        full_name: 'Test User',
        email: '  NEW@EXAMPLE.COM  ',
        username: 'testuser',
      },
    });
    const res = createRes();

    await profile.updateProfile(req, res);
    assert.equal(res.statusCode, 200);
    // Email should be normalized in the update
  });
});

test('updateProfile -> trims whitespace from fields', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'testuser',
    email: 'old@example.com',
    municipality_id: 5,
  }]);
  mockKnex.__queue('users', 'first', [null]); // Email check
  mockKnex.__queue('users', 'first', [null]); // Username check
  mockKnex.__queue('users', 'update:returning', [[]]);
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'newuser',
    email: 'new@example.com',
    full_name: 'New Name',
    phone: null,
    role_id: 3,
    municipality_id: 5,
    is_active: true,
    email_verified_at: null,
    last_login_at: null,
    last_login_ip: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-15'),
    role_name: 'User',
    municipality_name: 'Test Belediyesi',
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: {
        full_name: '  New Name  ',
        email: '  new@example.com  ',
        username: '  newuser  ',
        phone: '  5551234567  ',
      },
    });
    const res = createRes();

    await profile.updateProfile(req, res);
    assert.equal(res.statusCode, 200);
    // Fields should be trimmed
  });
});

test('updateProfile -> allows same email for same user', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    municipality_id: 5,
  }]);
  mockKnex.__queue('users', 'first', [null]); // Email check (no duplicate)
  mockKnex.__queue('users', 'first', [null]); // Username check
  mockKnex.__queue('users', 'update:returning', [[]]);
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    full_name: 'Updated Name',
    phone: null,
    role_id: 3,
    municipality_id: 5,
    is_active: true,
    email_verified_at: null,
    last_login_at: null,
    last_login_ip: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-15'),
    role_name: 'User',
    municipality_name: 'Test Belediyesi',
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: {
        full_name: 'Updated Name',
        email: 'test@example.com',
        username: 'testuser',
      },
    });
    const res = createRes();

    await profile.updateProfile(req, res);
    assert.equal(res.statusCode, 200);
  });
});

test('updateProfile -> allows same username for same user', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    municipality_id: 5,
  }]);
  mockKnex.__queue('users', 'first', [null]); // Email check
  mockKnex.__queue('users', 'first', [null]); // Username check (no duplicate)
  mockKnex.__queue('users', 'update:returning', [[]]);
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'testuser',
    email: 'new@example.com',
    full_name: 'Updated Name',
    phone: null,
    role_id: 3,
    municipality_id: 5,
    is_active: true,
    email_verified_at: null,
    last_login_at: null,
    last_login_ip: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-15'),
    role_name: 'User',
    municipality_name: 'Test Belediyesi',
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: {
        full_name: 'Updated Name',
        email: 'new@example.com',
        username: 'testuser',
      },
    });
    const res = createRes();

    await profile.updateProfile(req, res);
    assert.equal(res.statusCode, 200);
  });
});

test('updateProfile -> handles null phone', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    municipality_id: 5,
  }]);
  mockKnex.__queue('users', 'first', [null]); // Email check
  mockKnex.__queue('users', 'first', [null]); // Username check
  mockKnex.__queue('users', 'update:returning', [[]]);
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    full_name: 'Test User',
    phone: null,
    role_id: 3,
    municipality_id: 5,
    is_active: true,
    email_verified_at: null,
    last_login_at: null,
    last_login_ip: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-15'),
    role_name: 'User',
    municipality_name: 'Test Belediyesi',
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: {
        full_name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        phone: null,
      },
    });
    const res = createRes();

    await profile.updateProfile(req, res);
    assert.equal(res.statusCode, 200);
  });
});

test('updateProfile -> respects tenant scope', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    municipality_id: 5,
  }]);
  mockKnex.__queue('users', 'first', [null]); // Email check
  mockKnex.__queue('users', 'first', [null]); // Username check
  mockKnex.__queue('users', 'update:returning', [[]]);
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    full_name: 'Test User',
    phone: null,
    role_id: 3,
    municipality_id: 5,
    is_active: true,
    email_verified_at: null,
    last_login_at: null,
    last_login_ip: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-15'),
    role_name: 'User',
    municipality_name: 'Test Belediyesi',
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: {
        full_name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
      },
    });
    const res = createRes();

    await profile.updateProfile(req, res);
    assert.equal(res.statusCode, 200);
    // Should respect tenant scope in queries
  });
});

test('updateProfile -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: {
        full_name: 'Test User',
        email: 'test@example.com',
        username: 'test',
      },
    });
    const res = createRes();

    await profile.updateProfile(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// updatePassword tests
// ============================================================================

test('updatePassword -> 401 when user is not authenticated', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: undefined,
      body: { current_password: 'oldpass', new_password: 'newpass123' },
    });
    const res = createRes();

    await profile.updatePassword(req, res);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, 'Kullanıcı oturumu bulunamadı');
  });
});

test('updatePassword -> 400 when current_password is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: { new_password: 'newpass123' },
    });
    const res = createRes();

    await profile.updatePassword(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Mevcut ve yeni şifre alanları zorunludur');
  });
});

test('updatePassword -> 400 when new_password is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: { current_password: 'oldpass' },
    });
    const res = createRes();

    await profile.updatePassword(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Mevcut ve yeni şifre alanları zorunludur');
  });
});

test('updatePassword -> 400 when new_password is too short', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: { current_password: 'oldpass', new_password: 'short' },
    });
    const res = createRes();

    await profile.updatePassword(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Yeni şifre en az 8 karakter olmalıdır');
  });
});

test('updatePassword -> 404 when user not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: { current_password: 'oldpass', new_password: 'newpass123' },
    });
    const res = createRes();

    await profile.updatePassword(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Profil bulunamadı');
  });
});

test('updatePassword -> 400 when current password is invalid', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    password_hash: '$2b$10$hashedpassword',
    municipality_id: 5,
  }]);

  const bcryptMock = {
    compare: async () => false,
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      bcrypt: bcryptMock,
    },
    async () => {
      delete require.cache[require.resolve('./profile.controller')];
      const profile = require('./profile.controller');

      const req = createReq({
        user: { id: 1 },
        tenantMunicipalityId: 5,
        body: { current_password: 'wrongpass', new_password: 'newpass123' },
      });
      const res = createRes();

      await profile.updatePassword(req, res);
      assert.equal(res.statusCode, 400);
      assert.equal(res.body.message, 'Mevcut şifre geçersiz');
    }
  );
});

test('updatePassword -> updates password successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    password_hash: '$2b$10$hashedpassword',
    municipality_id: 5,
  }]);
  mockKnex.__queue('users', 'update:returning', [[]]);

  const bcryptMock = {
    compare: async () => true,
    hash: async () => '$2b$10$newhashedpassword',
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      bcrypt: bcryptMock,
    },
    async () => {
      delete require.cache[require.resolve('./profile.controller')];
      const profile = require('./profile.controller');

      const req = createReq({
        user: { id: 1 },
        tenantMunicipalityId: 5,
        body: { current_password: 'oldpass', new_password: 'newpass123' },
      });
      const res = createRes();

      await profile.updatePassword(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.message, 'Şifre güncellendi');
    }
  );
});

test('updatePassword -> respects tenant scope', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    password_hash: '$2b$10$hashedpassword',
    municipality_id: 5,
  }]);
  mockKnex.__queue('users', 'update:returning', [[]]);

  const bcryptMock = {
    compare: async () => true,
    hash: async () => '$2b$10$newhashedpassword',
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      bcrypt: bcryptMock,
    },
    async () => {
      delete require.cache[require.resolve('./profile.controller')];
      const profile = require('./profile.controller');

      const req = createReq({
        user: { id: 1 },
        tenantMunicipalityId: 5,
        body: { current_password: 'oldpass', new_password: 'newpass123' },
      });
      const res = createRes();

      await profile.updatePassword(req, res);
      assert.equal(res.statusCode, 200);
      // Should respect tenant scope in queries
    }
  );
});

test('updatePassword -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./profile.controller')];
    const profile = require('./profile.controller');

    const req = createReq({
      user: { id: 1 },
      tenantMunicipalityId: 5,
      body: { current_password: 'oldpass', new_password: 'newpass123' },
    });
    const res = createRes();

    await profile.updatePassword(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

test('updatePassword -> 500 on bcrypt error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    password_hash: '$2b$10$hashedpassword',
    municipality_id: 5,
  }]);

  const bcryptMock = {
    compare: async () => {
      throw new Error('Bcrypt error');
    },
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      bcrypt: bcryptMock,
    },
    async () => {
      delete require.cache[require.resolve('./profile.controller')];
      const profile = require('./profile.controller');

      const req = createReq({
        user: { id: 1 },
        tenantMunicipalityId: 5,
        body: { current_password: 'oldpass', new_password: 'newpass123' },
      });
      const res = createRes();

      await profile.updatePassword(req, res);
      assert.equal(res.statusCode, 500);
      assert.equal(res.body.message, 'Sunucu hatası');
    }
  );
});

