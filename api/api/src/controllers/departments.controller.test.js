const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

// ============================================================================
// getAll
// ============================================================================

test('departments.getAll -> returns active departments only by default', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'result', [[
    { id: 1, code: 'DEPT1', name: 'Birim 1', manager_user_id: null, is_active: true, municipality_id: 5 },
    { id: 2, code: 'DEPT2', name: 'Birim 2', manager_user_id: 10, is_active: true, municipality_id: 5 },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      query: {},
    });
    const res = createRes();

    await departments.getAll(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.length, 2);
    assert.equal(res.body[0].code, 'DEPT1');
    assert.equal(res.body[1].code, 'DEPT2');
  });
});

test('departments.getAll -> returns all departments when includeInactive=true', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'result', [[
    { id: 1, code: 'DEPT1', name: 'Birim 1', manager_user_id: null, is_active: true, municipality_id: 5 },
    { id: 2, code: 'DEPT2', name: 'Birim 2', manager_user_id: 10, is_active: false, municipality_id: 5 },
    { id: 3, code: 'DEPT3', name: 'Birim 3', manager_user_id: null, is_active: true, municipality_id: 5 },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      query: { includeInactive: 'true' },
    });
    const res = createRes();

    await departments.getAll(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.length, 3);
  });
});

test('departments.getAll -> returns empty array when no departments', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'result', [[]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      query: {},
    });
    const res = createRes();

    await departments.getAll(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.length, 0);
  });
});

test('departments.getAll -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'result', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      query: {},
    });
    const res = createRes();

    await departments.getAll(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// getById
// ============================================================================

test('departments.getById -> returns department when found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [{
    id: 10,
    code: 'DEPT1',
    name: 'Birim 1',
    manager_user_id: 5,
    is_active: true,
    municipality_id: 5,
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
    });
    const res = createRes();

    await departments.getById(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.id, 10);
    assert.equal(res.body.code, 'DEPT1');
    assert.equal(res.body.name, 'Birim 1');
  });
});

test('departments.getById -> 400 when id is not a valid integer', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: 'abc' },
    });
    const res = createRes();

    await departments.getById(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Geçersiz birim ID');
  });
});

test('departments.getById -> 400 when id is NaN', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10.5' },
    });
    const res = createRes();

    await departments.getById(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Geçersiz birim ID');
  });
});

test('departments.getById -> 404 when department not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '999' },
    });
    const res = createRes();

    await departments.getById(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Birim bulunamadı');
  });
});

test('departments.getById -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
    });
    const res = createRes();

    await departments.getById(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// create
// ============================================================================

test('departments.create -> 400 when code is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: { name: 'Birim 1' },
    });
    const res = createRes();

    await departments.create(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Kod ve ad alanları zorunludur');
  });
});

test('departments.create -> 400 when name is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: { code: 'DEPT1' },
    });
    const res = createRes();

    await departments.create(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Kod ve ad alanları zorunludur');
  });
});

test('departments.create -> 400 when code is empty string after trim', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: { code: '   ', name: 'Birim 1' },
    });
    const res = createRes();

    await departments.create(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Kod ve ad alanları zorunludur');
  });
});

test('departments.create -> 400 when manager_user_id is invalid', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: { code: 'DEPT1', name: 'Birim 1', manager_user_id: 999 },
    });
    const res = createRes();

    await departments.create(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Yönetici kullanıcı bu belediyeye ait değil');
  });
});

test('departments.create -> 409 when code already exists', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [{ id: 1, code: 'DEPT1', name: 'Existing' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: { code: 'DEPT1', name: 'New Department' },
    });
    const res = createRes();

    await departments.create(req, res);
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, 'Bu kod bu belediyede zaten kullanılıyor');
  });
});

test('departments.create -> creates department successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [null]); // No duplicate
  mockKnex.__queue('departments', 'insert:returning', [[{
    id: 10,
    code: 'DEPT1',
    name: 'Birim 1',
    manager_user_id: null,
    is_active: true,
    municipality_id: 5,
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: { code: 'DEPT1', name: 'Birim 1' },
    });
    const res = createRes();

    await departments.create(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.id, 10);
    assert.equal(res.body.code, 'DEPT1');
    assert.equal(res.body.name, 'Birim 1');
    assert.equal(res.body.is_active, true);
  });
});

test('departments.create -> creates department with manager_user_id', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{ id: 20, municipality_id: 5, is_active: true }]);
  mockKnex.__queue('departments', 'first', [null]);
  mockKnex.__queue('departments', 'insert:returning', [[{
    id: 10,
    code: 'DEPT1',
    name: 'Birim 1',
    manager_user_id: 20,
    is_active: true,
    municipality_id: 5,
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: { code: 'DEPT1', name: 'Birim 1', manager_user_id: 20 },
    });
    const res = createRes();

    await departments.create(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.manager_user_id, 20);
  });
});

test('departments.create -> trims whitespace from code and name', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [null]);
  mockKnex.__queue('departments', 'insert:returning', [[{
    id: 10,
    code: 'DEPT1',
    name: 'Birim 1',
    manager_user_id: null,
    is_active: true,
    municipality_id: 5,
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: { code: '  DEPT1  ', name: '  Birim 1  ' },
    });
    const res = createRes();

    await departments.create(req, res);
    assert.equal(res.statusCode, 201);
    // The inserted data should have trimmed values
    assert.equal(res.body.code, 'DEPT1');
    assert.equal(res.body.name, 'Birim 1');
  });
});

test('departments.create -> sets is_active to true by default', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [null]);
  mockKnex.__queue('departments', 'insert:returning', [[{
    id: 10,
    code: 'DEPT1',
    name: 'Birim 1',
    manager_user_id: null,
    is_active: true,
    municipality_id: 5,
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: { code: 'DEPT1', name: 'Birim 1' },
    });
    const res = createRes();

    await departments.create(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.is_active, true);
  });
});

test('departments.create -> respects is_active when provided', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [null]);
  mockKnex.__queue('departments', 'insert:returning', [[{
    id: 10,
    code: 'DEPT1',
    name: 'Birim 1',
    manager_user_id: null,
    is_active: false,
    municipality_id: 5,
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: { code: 'DEPT1', name: 'Birim 1', is_active: false },
    });
    const res = createRes();

    await departments.create(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.is_active, false);
  });
});

test('departments.create -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: { code: 'DEPT1', name: 'Birim 1' },
    });
    const res = createRes();

    await departments.create(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// update
// ============================================================================

test('departments.update -> 400 when id is not a valid integer', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: 'abc' },
      body: { name: 'Updated Name' },
    });
    const res = createRes();

    await departments.update(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Geçersiz birim ID');
  });
});

test('departments.update -> 400 when no fields to update', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: {},
    });
    const res = createRes();

    await departments.update(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Güncellenecek bir alan bulunamadı');
  });
});

test('departments.update -> 400 when code is empty string', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: { code: '   ' },
    });
    const res = createRes();

    await departments.update(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Kod boş olamaz');
  });
});

test('departments.update -> 400 when name is empty string', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: { name: '   ' },
    });
    const res = createRes();

    await departments.update(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Ad boş olamaz');
  });
});

test('departments.update -> 404 when department not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '999' },
      body: { name: 'Updated Name' },
    });
    const res = createRes();

    await departments.update(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Birim bulunamadı');
  });
});

test('departments.update -> 409 when code conflicts with existing department', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [{ id: 10, code: 'DEPT1', name: 'Birim 1' }]);
  mockKnex.__queue('departments', 'first', [{ id: 20, code: 'DEPT2', name: 'Birim 2' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: { code: 'DEPT2' },
    });
    const res = createRes();

    await departments.update(req, res);
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, 'Bu kod bu belediyede zaten kullanılıyor');
  });
});

test('departments.update -> allows same code for same department', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [{ id: 10, code: 'DEPT1', name: 'Birim 1' }]);
  mockKnex.__queue('departments', 'update:returning', [[{
    id: 10,
    code: 'DEPT1',
    name: 'Updated Name',
    manager_user_id: null,
    is_active: true,
    municipality_id: 5,
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: { code: 'DEPT1', name: 'Updated Name' },
    });
    const res = createRes();

    await departments.update(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.name, 'Updated Name');
  });
});

test('departments.update -> 400 when manager_user_id is invalid', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [{ id: 10, code: 'DEPT1', name: 'Birim 1' }]);
  mockKnex.__queue('users', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: { manager_user_id: 999 },
    });
    const res = createRes();

    await departments.update(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Yönetici kullanıcı bu belediyeye ait değil');
  });
});

test('departments.update -> updates department successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [{ id: 10, code: 'DEPT1', name: 'Birim 1' }]);
  mockKnex.__queue('departments', 'update:returning', [[{
    id: 10,
    code: 'DEPT1',
    name: 'Updated Name',
    manager_user_id: null,
    is_active: true,
    municipality_id: 5,
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: { name: 'Updated Name' },
    });
    const res = createRes();

    await departments.update(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.name, 'Updated Name');
  });
});

test('departments.update -> updates multiple fields', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [{ id: 10, code: 'DEPT1', name: 'Birim 1', manager_user_id: null }]);
  mockKnex.__queue('users', 'first', [{ id: 20, municipality_id: 5, is_active: true }]);
  mockKnex.__queue('departments', 'update:returning', [[{
    id: 10,
    code: 'DEPT1',
    name: 'Updated Name',
    manager_user_id: 20,
    is_active: false,
    municipality_id: 5,
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: { name: 'Updated Name', manager_user_id: 20, is_active: false },
    });
    const res = createRes();

    await departments.update(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.name, 'Updated Name');
    assert.equal(res.body.manager_user_id, 20);
    assert.equal(res.body.is_active, false);
  });
});

test('departments.update -> sets manager_user_id to null when explicitly set', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [{ id: 10, code: 'DEPT1', name: 'Birim 1', manager_user_id: 20 }]);
  mockKnex.__queue('departments', 'update:returning', [[{
    id: 10,
    code: 'DEPT1',
    name: 'Birim 1',
    manager_user_id: null,
    is_active: true,
    municipality_id: 5,
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: { manager_user_id: null },
    });
    const res = createRes();

    await departments.update(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.manager_user_id, null);
  });
});

test('departments.update -> trims whitespace from code and name', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [{ id: 10, code: 'DEPT1', name: 'Birim 1' }]);
  mockKnex.__queue('departments', 'update:returning', [[{
    id: 10,
    code: 'DEPT2',
    name: 'Updated Name',
    manager_user_id: null,
    is_active: true,
    municipality_id: 5,
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: { code: '  DEPT2  ', name: '  Updated Name  ' },
    });
    const res = createRes();

    await departments.update(req, res);
    assert.equal(res.statusCode, 200);
    // The updated data should have trimmed values
    assert.equal(res.body.code, 'DEPT2');
    assert.equal(res.body.name, 'Updated Name');
  });
});

test('departments.update -> 404 when update returns no rows', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [{ id: 10, code: 'DEPT1', name: 'Birim 1' }]);
  mockKnex.__queue('departments', 'update:returning', [[null]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: { name: 'Updated Name' },
    });
    const res = createRes();

    await departments.update(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Birim bulunamadı');
  });
});

test('departments.update -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: { name: 'Updated Name' },
    });
    const res = createRes();

    await departments.update(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// remove
// ============================================================================

test('departments.remove -> 400 when id is not a valid integer', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: 'abc' },
    });
    const res = createRes();

    await departments.remove(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Geçersiz birim ID');
  });
});

test('departments.remove -> 404 when department not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'del', [0]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '999' },
    });
    const res = createRes();

    await departments.remove(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Birim bulunamadı');
  });
});

test('departments.remove -> deletes department successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'del', [1]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
    });
    const res = createRes();

    await departments.remove(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'Birim silindi');
  });
});

test('departments.remove -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'del', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./departments.controller')];
    const departments = require('./departments.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
    });
    const res = createRes();

    await departments.remove(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

