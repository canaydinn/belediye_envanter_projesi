const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

// ============================================================================
// getAll
// ============================================================================

test('users.getAll -> returns all users when no municipality filter', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'result', [[
    {
      id: 1,
      username: 'user1',
      email: 'user1@example.com',
      full_name: 'User One',
      role_id: 3,
      municipality_id: 1,
      is_active: true,
      phone: '5551234567',
      email_verified_at: new Date('2024-01-01'),
    },
    {
      id: 2,
      username: 'user2',
      email: 'user2@example.com',
      full_name: 'User Two',
      role_id: 4,
      municipality_id: 2,
      is_active: false,
      phone: null,
      email_verified_at: null,
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({});
    const res = createRes();

    await users.getAll(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(Array.isArray(res.body), true);
    assert.equal(res.body.length, 2);
    assert.equal(res.body[0].username, 'user1');
    assert.equal(res.body[1].username, 'user2');
  });
});

test('users.getAll -> filters by tenantMunicipalityId', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'result', [[
    {
      id: 1,
      username: 'user1',
      email: 'user1@example.com',
      full_name: 'User One',
      role_id: 3,
      municipality_id: 1,
      is_active: true,
      phone: '5551234567',
      email_verified_at: new Date('2024-01-01'),
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await users.getAll(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].municipality_id, 1);
  });
});

test('users.getAll -> filters by user.municipality_id', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'result', [[
    {
      id: 2,
      username: 'user2',
      email: 'user2@example.com',
      full_name: 'User Two',
      role_id: 4,
      municipality_id: 2,
      is_active: true,
      phone: null,
      email_verified_at: null,
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({ user: { municipality_id: 2 } });
    const res = createRes();

    await users.getAll(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].municipality_id, 2);
  });
});

test('users.getAll -> returns empty array when no users', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'result', [[]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({});
    const res = createRes();

    await users.getAll(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(Array.isArray(res.body), true);
    assert.equal(res.body.length, 0);
  });
});

test('users.getAll -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'result', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({});
    const res = createRes();

    await users.getAll(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// getById
// ============================================================================

test('users.getById -> returns user when found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'user1',
    email: 'user1@example.com',
    full_name: 'User One',
    role_id: 3,
    municipality_id: 1,
    is_active: true,
    phone: '5551234567',
    email_verified_at: new Date('2024-01-01'),
    last_login_at: new Date('2024-01-15'),
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-15'),
    role_name: 'User',
    municipality_name: 'Test Belediye',
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({ params: { id: '1' } });
    const res = createRes();

    await users.getById(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.id, 1);
    assert.equal(res.body.username, 'user1');
    assert.equal(res.body.role_name, 'User');
    assert.equal(res.body.municipality_name, 'Test Belediye');
  });
});

test('users.getById -> 404 when user not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({ params: { id: '999' } });
    const res = createRes();

    await users.getById(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Kullanıcı bulunamadı');
  });
});

test('users.getById -> filters by municipality_id when provided', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]); // User not in municipality 2

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '1' },
      user: { municipality_id: 2 },
    });
    const res = createRes();

    await users.getById(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Kullanıcı bulunamadı');
  });
});

test('users.getById -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({ params: { id: '1' } });
    const res = createRes();

    await users.getById(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// getSummaryStats
// ============================================================================

test('users.getSummaryStats -> 400 when municipalityId not found', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({});
    const res = createRes();

    await users.getSummaryStats(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Belediye kapsamı bulunamadı');
  });
});

test('users.getSummaryStats -> returns summary stats successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{ total: '10' }]); // totalUsersRow
  mockKnex.__queue('users', 'first', [{ total: '8' }]); // activeUsersRow
  mockKnex.__queue('users', 'first', [{ total: '3' }]); // todayLoginsRow
  mockKnex.__queue('users', 'first', [{ total: '2' }]); // adminRoleRow
  mockKnex.__queue('users', 'first', [{ total: '3' }]); // managerRoleRow
  mockKnex.__queue('users', 'first', [{ total: '5' }]); // userRoleRow

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await users.getSummaryStats(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.totals.users, 10);
    assert.equal(res.body.totals.activeUsers, 8);
    assert.equal(res.body.totals.todayLogins, 3);
    assert.equal(res.body.roles.admin, 2);
    assert.equal(res.body.roles.manager, 3);
    assert.equal(res.body.roles.user, 5);
  });
});

test('users.getSummaryStats -> handles zero counts', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{ total: '0' }]);
  mockKnex.__queue('users', 'first', [{ total: '0' }]);
  mockKnex.__queue('users', 'first', [{ total: '0' }]);
  mockKnex.__queue('users', 'first', [{ total: '0' }]);
  mockKnex.__queue('users', 'first', [{ total: '0' }]);
  mockKnex.__queue('users', 'first', [{ total: '0' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await users.getSummaryStats(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.totals.users, 0);
    assert.equal(res.body.totals.activeUsers, 0);
    assert.equal(res.body.totals.todayLogins, 0);
    assert.equal(res.body.roles.admin, 0);
    assert.equal(res.body.roles.manager, 0);
    assert.equal(res.body.roles.user, 0);
  });
});

test('users.getSummaryStats -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await users.getSummaryStats(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// getTodayLogins
// ============================================================================

test('users.getTodayLogins -> 400 when municipalityId not found', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({});
    const res = createRes();

    await users.getTodayLogins(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Belediye kapsamı bulunamadı');
  });
});

test('users.getTodayLogins -> returns today logins with default limit', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'result', [[
    {
      id: 1,
      full_name: 'User One',
      email: 'user1@example.com',
      role_id: 3,
      is_active: true,
      last_login_at: new Date('2024-01-15T10:00:00'),
      department_id: 1,
      department_name: 'IT Department',
    },
    {
      id: 2,
      full_name: 'User Two',
      email: 'user2@example.com',
      role_id: 4,
      is_active: true,
      last_login_at: new Date('2024-01-15T09:00:00'),
      department_id: null,
      department_name: null,
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await users.getTodayLogins(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.length, 2);
    assert.equal(res.body[0].full_name, 'User One');
    assert.equal(res.body[1].full_name, 'User Two');
  });
});

test('users.getTodayLogins -> respects limit query parameter', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'result', [[
    {
      id: 1,
      full_name: 'User One',
      email: 'user1@example.com',
      role_id: 3,
      is_active: true,
      last_login_at: new Date('2024-01-15T10:00:00'),
      department_id: 1,
      department_name: 'IT Department',
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { limit: '1' },
    });
    const res = createRes();

    await users.getTodayLogins(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.length, 1);
  });
});

test('users.getTodayLogins -> uses default limit when invalid', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'result', [[
    {
      id: 1,
      full_name: 'User One',
      email: 'user1@example.com',
      role_id: 3,
      is_active: true,
      last_login_at: new Date('2024-01-15T10:00:00'),
      department_id: null,
      department_name: null,
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { limit: '-1' },
    });
    const res = createRes();

    await users.getTodayLogins(req, res);
    assert.equal(res.statusCode, 200);
    // Should use default limit of 5
  });
});

test('users.getTodayLogins -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'result', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await users.getTodayLogins(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// getDetailedList
// ============================================================================

test('users.getDetailedList -> 400 when municipalityId not found', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({});
    const res = createRes();

    await users.getDetailedList(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Belediye kapsamı bulunamadı');
  });
});

test('users.getDetailedList -> returns detailed user list', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'result', [[
    {
      id: 1,
      full_name: 'User One',
      email: 'user1@example.com',
      role_id: 3,
      is_active: true,
      last_login_at: new Date('2024-01-15'),
      created_at: new Date('2024-01-01'),
      role_name: 'User',
      department_id: 1,
      department_name: 'IT Department',
    },
    {
      id: 2,
      full_name: 'User Two',
      email: 'user2@example.com',
      role_id: 4,
      is_active: false,
      last_login_at: null,
      created_at: new Date('2024-01-02'),
      role_name: 'Manager',
      department_id: null,
      department_name: null,
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await users.getDetailedList(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.length, 2);
    assert.equal(res.body[0].full_name, 'User One');
    assert.equal(res.body[0].role_name, 'User');
    assert.equal(res.body[1].full_name, 'User Two');
    assert.equal(res.body[1].role_name, 'Manager');
  });
});

test('users.getDetailedList -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'result', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await users.getDetailedList(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// create
// ============================================================================

test('users.create -> 400 when username missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      body: {
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        role_id: 3,
      },
    });
    const res = createRes();

    await users.create(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /zorunludur/);
  });
});

test('users.create -> 400 when email missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      body: {
        username: 'testuser',
        password: 'password123',
        full_name: 'Test User',
        role_id: 3,
      },
    });
    const res = createRes();

    await users.create(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /zorunludur/);
  });
});

test('users.create -> 400 when password missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      body: {
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        role_id: 3,
      },
    });
    const res = createRes();

    await users.create(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /zorunludur/);
  });
});

test('users.create -> 400 when password too short', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'short',
        full_name: 'Test User',
        role_id: 3,
      },
    });
    const res = createRes();

    await users.create(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /en az 8 karakter/);
  });
});

test('users.create -> 400 when password is not string', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 12345678,
        full_name: 'Test User',
        role_id: 3,
      },
    });
    const res = createRes();

    await users.create(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /en az 8 karakter/);
  });
});

test('users.create -> 403 when trying to create user for different municipality', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      user: { municipality_id: 1, id: 10 },
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        role_id: 3,
        municipality_id: 2, // Different municipality
      },
    });
    const res = createRes();

    await users.create(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Farklı bir belediye için/);
  });
});

test('users.create -> creates user successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]); // No existing user
  mockKnex.__queue('users', 'insert:returning', [[
    {
      id: 10,
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User',
      role_id: 3,
      municipality_id: 1,
      is_active: true,
      phone: null,
      email_verified_at: null,
    },
  ]]);

  const bcryptMock = {
    hash: async () => 'hashed_password',
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      bcryptjs: bcryptMock,
    },
    async () => {
      delete require.cache[require.resolve('./users.controller')];
      const users = require('./users.controller');

      const req = createReq({
        user: { id: 5, municipality_id: 1 },
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          full_name: 'Test User',
          role_id: 3,
        },
      });
      const res = createRes();

      await users.create(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.id, 10);
      assert.equal(res.body.username, 'testuser');
      assert.equal(res.body.email, 'test@example.com');
      assert.equal(res.body.municipality_id, 1);
    }
  );
});

test('users.create -> sets email_verified_at when email_verified is true', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]);
  mockKnex.__queue('users', 'insert:returning', [[
    {
      id: 10,
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User',
      role_id: 3,
      municipality_id: 1,
      is_active: true,
      phone: null,
      email_verified_at: new Date('2024-01-01').toISOString(),
    },
  ]]);

  const bcryptMock = {
    hash: async () => 'hashed_password',
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      bcryptjs: bcryptMock,
    },
    async () => {
      delete require.cache[require.resolve('./users.controller')];
      const users = require('./users.controller');

      const req = createReq({
        user: { id: 5, municipality_id: 1 },
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          full_name: 'Test User',
          role_id: 3,
          email_verified: true,
        },
      });
      const res = createRes();

      await users.create(req, res);
      assert.equal(res.statusCode, 201);
      assert.ok(res.body.email_verified_at);
    }
  );
});

test('users.create -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      body: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        full_name: 'Test User',
        role_id: 3,
      },
    });
    const res = createRes();

    await users.create(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// update
// ============================================================================

test('users.update -> 403 when trying to update user for different municipality', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '1' },
      user: { municipality_id: 1, id: 10 },
      body: {
        email: 'updated@example.com',
        full_name: 'Updated User',
        role_id: 3,
        municipality_id: 2, // Different municipality
      },
    });
    const res = createRes();

    await users.update(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Farklı bir belediye için/);
  });
});

test('users.update -> 404 when user not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'update:returning', [[]]); // Empty array = no rows updated

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '999' },
      user: { municipality_id: 1, id: 10 },
      body: {
        email: 'updated@example.com',
        full_name: 'Updated User',
        role_id: 3,
      },
    });
    const res = createRes();

    await users.update(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Kullanıcı bulunamadı');
  });
});

test('users.update -> updates user successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'update:returning', [[
    {
      id: 1,
      username: 'testuser',
      email: 'updated@example.com',
      full_name: 'Updated User',
      role_id: 4,
      municipality_id: 1,
      is_active: true,
      phone: '5559876543',
      email_verified_at: new Date('2024-01-01').toISOString(),
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '1' },
      user: { municipality_id: 1, id: 10 },
      body: {
        email: 'updated@example.com',
        full_name: 'Updated User',
        role_id: 4,
        is_active: true,
        phone: '5559876543',
      },
    });
    const res = createRes();

    await users.update(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.email, 'updated@example.com');
    assert.equal(res.body.full_name, 'Updated User');
    assert.equal(res.body.role_id, 4);
  });
});

test('users.update -> sets email_verified_at when email_verified is true', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'update:returning', [[
    {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User',
      role_id: 3,
      municipality_id: 1,
      is_active: true,
      phone: null,
      email_verified_at: new Date('2024-01-01').toISOString(),
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '1' },
      user: { municipality_id: 1, id: 10 },
      body: {
        email_verified: true,
      },
    });
    const res = createRes();

    await users.update(req, res);
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.email_verified_at);
  });
});

test('users.update -> clears email_verified_at when email_verified is false', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'update:returning', [[
    {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User',
      role_id: 3,
      municipality_id: 1,
      is_active: true,
      phone: null,
      email_verified_at: null,
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '1' },
      user: { municipality_id: 1, id: 10 },
      body: {
        email_verified: false,
      },
    });
    const res = createRes();

    await users.update(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.email_verified_at, null);
  });
});

test('users.update -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'update:returning', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '1' },
      user: { municipality_id: 1, id: 10 },
      body: {
        email: 'updated@example.com',
      },
    });
    const res = createRes();

    await users.update(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// remove
// ============================================================================

test('users.remove -> 404 when user not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'update', [0]); // No rows affected

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '999' },
      user: { municipality_id: 1, id: 10 },
    });
    const res = createRes();

    await users.remove(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Kullanıcı bulunamadı');
  });
});

test('users.remove -> soft deletes user successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'update', [1]); // 1 row affected

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '1' },
      user: { municipality_id: 1, id: 10 },
    });
    const res = createRes();

    await users.remove(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'Kullanıcı silindi');
  });
});

test('users.remove -> filters by municipality_id', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'update', [0]); // No rows affected (user not in municipality)

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '1' },
      user: { municipality_id: 2, id: 10 },
    });
    const res = createRes();

    await users.remove(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Kullanıcı bulunamadı');
  });
});

test('users.remove -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'update', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '1' },
      user: { municipality_id: 1, id: 10 },
    });
    const res = createRes();

    await users.remove(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// resetPassword
// ============================================================================

test('users.resetPassword -> 400 when password missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '1' },
      body: {},
    });
    const res = createRes();

    await users.resetPassword(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /en az 8 karakter/);
  });
});

test('users.resetPassword -> 400 when password too short', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '1' },
      body: { password: 'short' },
    });
    const res = createRes();

    await users.resetPassword(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /en az 8 karakter/);
  });
});

test('users.resetPassword -> 404 when user not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '999' },
      user: { municipality_id: 1, id: 10 },
      body: { password: 'newpassword123' },
    });
    const res = createRes();

    await users.resetPassword(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Kullanıcı bulunamadı');
  });
});

test('users.resetPassword -> resets password successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{ id: 1, username: 'testuser' }]);
  mockKnex.__queue('users', 'update:returning', [[
    {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User',
    },
  ]]);

  const bcryptMock = {
    hash: async () => 'hashed_new_password',
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      bcryptjs: bcryptMock,
    },
    async () => {
      delete require.cache[require.resolve('./users.controller')];
      const users = require('./users.controller');

      const req = createReq({
        params: { id: '1' },
        user: { municipality_id: 1, id: 10 },
        body: { password: 'newpassword123' },
      });
      const res = createRes();

      await users.resetPassword(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.message, 'Şifre başarıyla sıfırlandı');
      assert.equal(res.body.user.id, 1);
      assert.equal(res.body.user.username, 'testuser');
    }
  );
});

test('users.resetPassword -> filters by municipality_id', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]); // User not in municipality 2

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '1' },
      user: { municipality_id: 2, id: 10 },
      body: { password: 'newpassword123' },
    });
    const res = createRes();

    await users.resetPassword(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Kullanıcı bulunamadı');
  });
});

test('users.resetPassword -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '1' },
      user: { municipality_id: 1, id: 10 },
      body: { password: 'newpassword123' },
    });
    const res = createRes();

    await users.resetPassword(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// toggleStatus
// ============================================================================

test('users.toggleStatus -> 404 when user not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '999' },
      user: { municipality_id: 1, id: 10 },
    });
    const res = createRes();

    await users.toggleStatus(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Kullanıcı bulunamadı');
  });
});

test('users.toggleStatus -> toggles from active to inactive', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    full_name: 'Test User',
    role_id: 3,
    municipality_id: 1,
    is_active: true,
    phone: null,
    role_name: 'User',
    municipality_name: 'Test Belediye',
  }]);
  mockKnex.__queue('users', 'update:returning', [[
    {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User',
      role_id: 3,
      municipality_id: 1,
      is_active: false,
      phone: null,
      email_verified_at: null,
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '1' },
      user: { municipality_id: 1, id: 10 },
    });
    const res = createRes();

    await users.toggleStatus(req, res);
    assert.equal(res.statusCode, 200);
    assert.match(res.body.message, /pasif hale getirildi/);
    assert.equal(res.body.user.is_active, false);
  });
});

test('users.toggleStatus -> toggles from inactive to active', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    full_name: 'Test User',
    role_id: 3,
    municipality_id: 1,
    is_active: false,
    phone: null,
    role_name: 'User',
    municipality_name: 'Test Belediye',
  }]);
  mockKnex.__queue('users', 'update:returning', [[
    {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      full_name: 'Test User',
      role_id: 3,
      municipality_id: 1,
      is_active: true,
      phone: null,
      email_verified_at: null,
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '1' },
      user: { municipality_id: 1, id: 10 },
    });
    const res = createRes();

    await users.toggleStatus(req, res);
    assert.equal(res.statusCode, 200);
    assert.match(res.body.message, /aktif hale getirildi/);
    assert.equal(res.body.user.is_active, true);
  });
});

test('users.toggleStatus -> filters by municipality_id', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]); // User not in municipality 2

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '1' },
      user: { municipality_id: 2, id: 10 },
    });
    const res = createRes();

    await users.toggleStatus(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Kullanıcı bulunamadı');
  });
});

test('users.toggleStatus -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./users.controller')];
    const users = require('./users.controller');

    const req = createReq({
      params: { id: '1' },
      user: { municipality_id: 1, id: 10 },
    });
    const res = createRes();

    await users.toggleStatus(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

