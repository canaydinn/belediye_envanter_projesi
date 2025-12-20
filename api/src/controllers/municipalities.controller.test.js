const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

// ============================================================================
// getAll
// ============================================================================

test('municipalities.getAll -> returns all municipalities', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'result', [[
    {
      id: 1,
      code: 'MUN001',
      name: 'Belediye 1',
      province: 'İstanbul',
      district: 'Kadıköy',
      tax_number: '1234567890',
      address: 'Test Adres 1',
      contact_email: 'test1@example.com',
      contact_phone: '02121234567',
      contact_person: 'Ahmet Yılmaz',
      is_active: true,
      status: 'active',
      license_start_date: '2024-01-01',
      license_end_date: '2025-12-31',
      quota_end_date: '2025-12-31',
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-01'),
    },
    {
      id: 2,
      code: 'MUN002',
      name: 'Belediye 2',
      province: 'Ankara',
      district: 'Çankaya',
      tax_number: '0987654321',
      address: 'Test Adres 2',
      contact_email: 'test2@example.com',
      contact_phone: '03121234567',
      contact_person: 'Mehmet Demir',
      is_active: false,
      status: 'pending',
      license_start_date: null,
      license_end_date: null,
      quota_end_date: null,
      created_at: new Date('2024-01-02'),
      updated_at: new Date('2024-01-02'),
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({});
    const res = createRes();

    await municipalities.getAll(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(Array.isArray(res.body), true);
    assert.equal(res.body.length, 2);
    assert.equal(res.body[0].code, 'MUN001');
    assert.equal(res.body[1].code, 'MUN002');
  });
});

test('municipalities.getAll -> returns empty array when no municipalities', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'result', [[]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({});
    const res = createRes();

    await municipalities.getAll(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(Array.isArray(res.body), true);
    assert.equal(res.body.length, 0);
  });
});

test('municipalities.getAll -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'result', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({});
    const res = createRes();

    await municipalities.getAll(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// getById
// ============================================================================

test('municipalities.getById -> returns municipality when found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [{
    id: 1,
    code: 'MUN001',
    name: 'Belediye 1',
    province: 'İstanbul',
    district: 'Kadıköy',
    tax_number: '1234567890',
    address: 'Test Adres 1',
    contact_email: 'test1@example.com',
    contact_phone: '02121234567',
    contact_person: 'Ahmet Yılmaz',
    is_active: true,
    status: 'active',
    license_start_date: '2024-01-01',
    license_end_date: '2025-12-31',
    quota_end_date: '2025-12-31',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: '1' },
    });
    const res = createRes();

    await municipalities.getById(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.id, 1);
    assert.equal(res.body.code, 'MUN001');
    assert.equal(res.body.name, 'Belediye 1');
  });
});

test('municipalities.getById -> 404 when municipality not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: '999' },
    });
    const res = createRes();

    await municipalities.getById(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Belediye bulunamadı');
  });
});

test('municipalities.getById -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: '1' },
    });
    const res = createRes();

    await municipalities.getById(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// create
// ============================================================================

test('municipalities.create -> 400 when code is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      body: {
        name: 'Belediye 1',
        province: 'İstanbul',
        district: 'Kadıköy',
      },
    });
    const res = createRes();

    await municipalities.create(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'code, name, province ve district alanları zorunludur');
  });
});

test('municipalities.create -> 400 when name is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      body: {
        code: 'MUN001',
        province: 'İstanbul',
        district: 'Kadıköy',
      },
    });
    const res = createRes();

    await municipalities.create(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'code, name, province ve district alanları zorunludur');
  });
});

test('municipalities.create -> 400 when province is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      body: {
        code: 'MUN001',
        name: 'Belediye 1',
        district: 'Kadıköy',
      },
    });
    const res = createRes();

    await municipalities.create(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'code, name, province ve district alanları zorunludur');
  });
});

test('municipalities.create -> 400 when district is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      body: {
        code: 'MUN001',
        name: 'Belediye 1',
        province: 'İstanbul',
      },
    });
    const res = createRes();

    await municipalities.create(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'code, name, province ve district alanları zorunludur');
  });
});

test('municipalities.create -> 400 when code already exists', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [{ id: 1, code: 'MUN001' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      body: {
        code: 'MUN001',
        name: 'Belediye 1',
        province: 'İstanbul',
        district: 'Kadıköy',
      },
    });
    const res = createRes();

    await municipalities.create(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Bu municipality code zaten kullanılıyor');
  });
});

test('municipalities.create -> creates municipality successfully with required fields', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [null]); // No duplicate
  mockKnex.__queue('municipalities', 'insert:returning', [[{
    id: 1,
    code: 'MUN001',
    name: 'Belediye 1',
    province: 'İstanbul',
    district: 'Kadıköy',
    tax_number: null,
    address: null,
    contact_email: null,
    contact_phone: null,
    contact_person: null,
    is_active: false,
    status: 'pending',
    license_start_date: null,
    license_end_date: null,
    quota_end_date: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      body: {
        code: 'MUN001',
        name: 'Belediye 1',
        province: 'İstanbul',
        district: 'Kadıköy',
      },
    });
    const res = createRes();

    await municipalities.create(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.id, 1);
    assert.equal(res.body.code, 'MUN001');
    assert.equal(res.body.name, 'Belediye 1');
    assert.equal(res.body.is_active, false);
    assert.equal(res.body.status, 'pending');
  });
});

test('municipalities.create -> creates municipality with all fields', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [null]); // No duplicate
  mockKnex.__queue('municipalities', 'insert:returning', [[{
    id: 1,
    code: 'MUN001',
    name: 'Belediye 1',
    province: 'İstanbul',
    district: 'Kadıköy',
    tax_number: '1234567890',
    address: 'Test Adres 1',
    contact_email: 'test1@example.com',
    contact_phone: '02121234567',
    contact_person: 'Ahmet Yılmaz',
    is_active: false,
    status: 'pending',
    license_start_date: null,
    license_end_date: null,
    quota_end_date: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      body: {
        code: 'MUN001',
        name: 'Belediye 1',
        province: 'İstanbul',
        district: 'Kadıköy',
        tax_number: '1234567890',
        address: 'Test Adres 1',
        contact_email: 'test1@example.com',
        contact_phone: '02121234567',
        contact_person: 'Ahmet Yılmaz',
      },
    });
    const res = createRes();

    await municipalities.create(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.tax_number, '1234567890');
    assert.equal(res.body.contact_email, 'test1@example.com');
    assert.equal(res.body.contact_phone, '02121234567');
    assert.equal(res.body.contact_person, 'Ahmet Yılmaz');
  });
});

test('municipalities.create -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      body: {
        code: 'MUN001',
        name: 'Belediye 1',
        province: 'İstanbul',
        district: 'Kadıköy',
      },
    });
    const res = createRes();

    await municipalities.create(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// update
// ============================================================================

test('municipalities.update -> 400 when id is not a valid integer', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: 'abc' },
      body: { name: 'Updated Name' },
    });
    const res = createRes();

    await municipalities.update(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Geçersiz belediye ID');
  });
});

test('municipalities.update -> 404 when municipality not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: '999' },
      body: { name: 'Updated Name' },
    });
    const res = createRes();

    await municipalities.update(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Belediye bulunamadı');
  });
});

test('municipalities.update -> 400 when no fields to update', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [{ id: 1, code: 'MUN001' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: '1' },
      body: {},
    });
    const res = createRes();

    await municipalities.update(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Güncellenecek alan bulunamadı');
  });
});

test('municipalities.update -> 400 when code is empty', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [{ id: 1, code: 'MUN001' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: '1' },
      body: { code: '   ' },
    });
    const res = createRes();

    await municipalities.update(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'code boş olamaz');
  });
});

test('municipalities.update -> 400 when code already exists for another municipality', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [{ id: 1, code: 'MUN001' }]);
  mockKnex.__queue('municipalities', 'first', [{ id: 2, code: 'MUN002' }]); // Conflict

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: '1' },
      body: { code: 'MUN002' },
    });
    const res = createRes();

    await municipalities.update(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Bu municipality code zaten kullanılıyor');
  });
});

test('municipalities.update -> 400 when status is invalid', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [{ id: 1, code: 'MUN001' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: '1' },
      body: { status: 'invalid_status' },
    });
    const res = createRes();

    await municipalities.update(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Geçersiz status değeri');
  });
});

test('municipalities.update -> allows valid status values', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [{ id: 1, code: 'MUN001' }]);
  mockKnex.__queue('municipalities', 'update:returning', [[{
    id: 1,
    code: 'MUN001',
    name: 'Belediye 1',
    province: 'İstanbul',
    district: 'Kadıköy',
    tax_number: null,
    address: null,
    contact_email: null,
    contact_phone: null,
    contact_person: null,
    is_active: true,
    status: 'active',
    license_start_date: null,
    license_end_date: null,
    quota_end_date: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-02'),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: '1' },
      body: { status: 'active' },
    });
    const res = createRes();

    await municipalities.update(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'active');
  });
});

test('municipalities.update -> updates municipality successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [{ id: 1, code: 'MUN001' }]);
  mockKnex.__queue('municipalities', 'update:returning', [[{
    id: 1,
    code: 'MUN001',
    name: 'Updated Name',
    province: 'Ankara',
    district: 'Çankaya',
    tax_number: '1234567890',
    address: 'Updated Address',
    contact_email: 'updated@example.com',
    contact_phone: '03121234567',
    contact_person: 'Updated Person',
    is_active: true,
    status: 'active',
    license_start_date: '2024-01-01',
    license_end_date: '2025-12-31',
    quota_end_date: '2025-12-31',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-02'),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: '1' },
      body: {
        name: 'Updated Name',
        province: 'Ankara',
        district: 'Çankaya',
        tax_number: '1234567890',
        address: 'Updated Address',
        contact_email: 'updated@example.com',
        contact_phone: '03121234567',
        contact_person: 'Updated Person',
        is_active: true,
        status: 'active',
        license_start_date: '2024-01-01',
        license_end_date: '2025-12-31',
        quota_end_date: '2025-12-31',
      },
    });
    const res = createRes();

    await municipalities.update(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.name, 'Updated Name');
    assert.equal(res.body.province, 'Ankara');
    assert.equal(res.body.is_active, true);
    assert.equal(res.body.status, 'active');
  });
});

test('municipalities.update -> allows same code for same municipality', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [{ id: 1, code: 'MUN001' }]);
  mockKnex.__queue('municipalities', 'update:returning', [[{
    id: 1,
    code: 'MUN001',
    name: 'Updated Name',
    province: 'İstanbul',
    district: 'Kadıköy',
    tax_number: null,
    address: null,
    contact_email: null,
    contact_phone: null,
    contact_person: null,
    is_active: true,
    status: 'active',
    license_start_date: null,
    license_end_date: null,
    quota_end_date: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-02'),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: '1' },
      body: { code: 'MUN001', name: 'Updated Name' },
    });
    const res = createRes();

    await municipalities.update(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.code, 'MUN001');
    assert.equal(res.body.name, 'Updated Name');
  });
});

test('municipalities.update -> converts is_active to boolean', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [{ id: 1, code: 'MUN001' }]);
  mockKnex.__queue('municipalities', 'update:returning', [[{
    id: 1,
    code: 'MUN001',
    name: 'Belediye 1',
    province: 'İstanbul',
    district: 'Kadıköy',
    tax_number: null,
    address: null,
    contact_email: null,
    contact_phone: null,
    contact_person: null,
    is_active: true,
    status: 'pending',
    license_start_date: null,
    license_end_date: null,
    quota_end_date: null,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-02'),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: '1' },
      body: { is_active: 1 }, // Truthy value
    });
    const res = createRes();

    await municipalities.update(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.is_active, true);
  });
});

test('municipalities.update -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: '1' },
      body: { name: 'Updated Name' },
    });
    const res = createRes();

    await municipalities.update(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// deactivate
// ============================================================================

test('municipalities.deactivate -> 400 when id is not a valid integer', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: 'abc' },
    });
    const res = createRes();

    await municipalities.deactivate(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Geçersiz belediye ID');
  });
});

test('municipalities.deactivate -> 404 when municipality not found', async () => {
  const mockKnex = createMockKnex();
  // When no rows are updated, Knex returns an empty array, which when destructured [updated] = [] gives updated = undefined
  mockKnex.__queue('municipalities', 'update:returning', [[]]); // Empty array means no rows updated

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: '999' },
    });
    const res = createRes();

    await municipalities.deactivate(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Belediye bulunamadı');
  });
});

test('municipalities.deactivate -> deactivates municipality successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'update:returning', [[{
    id: 1,
    code: 'MUN001',
    name: 'Belediye 1',
    is_active: false,
    status: 'suspended',
    updated_at: new Date('2024-01-02'),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: '1' },
    });
    const res = createRes();

    await municipalities.deactivate(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'Belediye pasif hale getirildi');
    assert.equal(res.body.municipality.is_active, false);
    assert.equal(res.body.municipality.status, 'suspended');
  });
});

test('municipalities.deactivate -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'update:returning', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./municipalities.controller')];
    const municipalities = require('./municipalities.controller');

    const req = createReq({
      params: { id: '1' },
    });
    const res = createRes();

    await municipalities.deactivate(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

