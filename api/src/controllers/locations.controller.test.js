const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

// ============================================================================
// createLocation
// ============================================================================

test('createLocation -> 400 when name is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: { code: 'LOC1' },
    });
    const res = createRes();

    await locations.createLocation(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'name ve code alanları zorunludur');
  });
});

test('createLocation -> 400 when code is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: { name: 'Lokasyon 1' },
    });
    const res = createRes();

    await locations.createLocation(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'name ve code alanları zorunludur');
  });
});

test('createLocation -> 400 when department_id is invalid', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: { name: 'Lokasyon 1', code: 'LOC1', department_id: 999 },
    });
    const res = createRes();

    await locations.createLocation(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Departman bu belediyeye ait değil');
  });
});

test('createLocation -> 400 when code already exists', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'result', [[{ id: 1, code: 'LOC1' }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: { name: 'Lokasyon 1', code: 'LOC1' },
    });
    const res = createRes();

    await locations.createLocation(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Bu kod ile kayıt mevcut');
  });
});

test('createLocation -> creates location successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'result', [[]]); // No duplicate
  mockKnex.__queue('locations', 'insert:returning', [[{
    id: 10,
    code: 'LOC1',
    name: 'Lokasyon 1',
    address: null,
    department_id: null,
    is_active: true,
    municipality_id: 5,
    type: null,
    latitude: null,
    longitude: null,
    created_at: new Date(),
    updated_at: new Date(),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: { name: 'Lokasyon 1', code: 'LOC1' },
    });
    const res = createRes();

    await locations.createLocation(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.id, 10);
    assert.equal(res.body.code, 'LOC1');
    assert.equal(res.body.name, 'Lokasyon 1');
    assert.equal(res.body.is_active, true);
  });
});

test('createLocation -> creates location with all fields', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [{ id: 20, municipality_id: 5 }]);
  mockKnex.__queue('locations', 'result', [[]]);
  mockKnex.__queue('locations', 'insert:returning', [[{
    id: 10,
    code: 'LOC1',
    name: 'Lokasyon 1',
    address: 'Test Adresi',
    department_id: 20,
    is_active: true,
    municipality_id: 5,
    type: 1,
    latitude: 41.0082,
    longitude: 28.9784,
    created_at: new Date(),
    updated_at: new Date(),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: {
        name: 'Lokasyon 1',
        code: 'LOC1',
        address: 'Test Adresi',
        department_id: 20,
        is_active: true,
        type: 1,
        latitude: 41.0082,
        longitude: 28.9784,
      },
    });
    const res = createRes();

    await locations.createLocation(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.department_id, 20);
    assert.equal(res.body.type, 1);
    assert.equal(res.body.latitude, 41.0082);
  });
});

test('createLocation -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'result', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      body: { name: 'Lokasyon 1', code: 'LOC1' },
    });
    const res = createRes();

    await locations.createLocation(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
  });
});

// ============================================================================
// listLocations
// ============================================================================

test('listLocations -> returns all locations for municipality', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'result', [[
    { id: 1, code: 'LOC1', name: 'Lokasyon 1', municipality_id: 5, is_active: true },
    { id: 2, code: 'LOC2', name: 'Lokasyon 2', municipality_id: 5, is_active: true },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      query: {},
    });
    const res = createRes();

    await locations.listLocations(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 2);
    assert.equal(res.body.total, 2);
  });
});

test('listLocations -> filters by type', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'result', [[
    { id: 1, code: 'LOC1', name: 'Lokasyon 1', type: 1, municipality_id: 5 },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      query: { type: '1' },
    });
    const res = createRes();

    await locations.listLocations(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 1);
  });
});

test('listLocations -> filters by department_id', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'result', [[
    { id: 1, code: 'LOC1', name: 'Lokasyon 1', department_id: 10, municipality_id: 5 },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      query: { department_id: '10' },
    });
    const res = createRes();

    await locations.listLocations(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 1);
  });
});

test('listLocations -> filters by is_active=true', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'result', [[
    { id: 1, code: 'LOC1', name: 'Lokasyon 1', is_active: true, municipality_id: 5 },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      query: { is_active: 'true' },
    });
    const res = createRes();

    await locations.listLocations(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 1);
  });
});

test('listLocations -> filters by is_active=false', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'result', [[
    { id: 1, code: 'LOC1', name: 'Lokasyon 1', is_active: false, municipality_id: 5 },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      query: { is_active: 'false' },
    });
    const res = createRes();

    await locations.listLocations(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 1);
  });
});

test('listLocations -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'result', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      query: {},
    });
    const res = createRes();

    await locations.listLocations(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
  });
});

// ============================================================================
// listLocationsFiltered
// ============================================================================

test('listLocationsFiltered -> 400 when municipality_id is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      query: {},
    });
    const res = createRes();

    await locations.listLocationsFiltered(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Belediye bilgisi bulunamadı');
  });
});

test('listLocationsFiltered -> returns filtered locations', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [{ total: 2 }]);
  mockKnex.__queue('locations', 'result', [[
    {
      id: 1,
      code: 'LOC1',
      name: 'Lokasyon 1',
      type: 1,
      department_id: 10,
      department_name: 'Departman 1',
      address: 'Test',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      asset_count: 5,
    },
    {
      id: 2,
      code: 'LOC2',
      name: 'Lokasyon 2',
      type: 1,
      department_id: 10,
      department_name: 'Departman 1',
      address: 'Test',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      asset_count: 3,
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      query: { name: 'Lokasyon' },
    });
    const res = createRes();

    await locations.listLocationsFiltered(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 2);
    assert.equal(res.body.total, 2);
  });
});

test('listLocationsFiltered -> filters by name', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [{ total: 1 }]);
  mockKnex.__queue('locations', 'result', [[
    {
      id: 1,
      code: 'LOC1',
      name: 'Test Lokasyon',
      type: 1,
      department_id: null,
      department_name: null,
      address: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      asset_count: 0,
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      query: { name: 'Test' },
    });
    const res = createRes();

    await locations.listLocationsFiltered(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].name, 'Test Lokasyon');
  });
});

test('listLocationsFiltered -> respects limit and offset', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [{ total: 10 }]);
  mockKnex.__queue('locations', 'result', [[
    {
      id: 3,
      code: 'LOC3',
      name: 'Lokasyon 3',
      type: 1,
      department_id: null,
      department_name: null,
      address: null,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      asset_count: 0,
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      query: { limit: 1, offset: 2 },
    });
    const res = createRes();

    await locations.listLocationsFiltered(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.limit, 1);
    assert.equal(res.body.offset, 2);
    assert.equal(res.body.total, 10);
  });
});

test('listLocationsFiltered -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      query: {},
    });
    const res = createRes();

    await locations.listLocationsFiltered(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
  });
});

// ============================================================================
// getLocationStats
// ============================================================================

test('getLocationStats -> returns location statistics', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [{ total: 10 }]);
  mockKnex.__queue('locations', 'first', [{ total: 8 }]);
  mockKnex.__queue('locations', 'first', [{ total: 3 }]);
  mockKnex.__queue('locations', 'first', [{
    id: 1,
    name: 'En Yoğun Lokasyon',
    asset_count: 25,
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
    });
    const res = createRes();

    await locations.getLocationStats(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.totals.locations, 10);
    assert.equal(res.body.totals.active_locations, 8);
    assert.equal(res.body.totals.warehouses, 3);
    assert.equal(res.body.dense_location.name, 'En Yoğun Lokasyon');
    assert.equal(res.body.dense_location.asset_count, 25);
  });
});

test('getLocationStats -> returns null dense_location when no locations', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [{ total: 0 }]);
  mockKnex.__queue('locations', 'first', [{ total: 0 }]);
  mockKnex.__queue('locations', 'first', [{ total: 0 }]);
  mockKnex.__queue('locations', 'result', [[]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
    });
    const res = createRes();

    await locations.getLocationStats(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.dense_location, null);
  });
});

test('getLocationStats -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
    });
    const res = createRes();

    await locations.getLocationStats(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
  });
});

// ============================================================================
// getLocationTypeDistribution
// ============================================================================

test('getLocationTypeDistribution -> returns type distribution', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'result', [[
    { type: 1, count: 5 },
    { type: 2, count: 3 },
    { type: 3, count: 2 },
    { type: 4, count: 1 },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
    });
    const res = createRes();

    await locations.getLocationTypeDistribution(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.distribution.office, 5);
    assert.equal(res.body.distribution.warehouse, 3);
    assert.equal(res.body.distribution.open_area, 2);
    assert.equal(res.body.distribution.building, 1);
    assert.equal(res.body.total, 11);
  });
});

test('getLocationTypeDistribution -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'result', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
    });
    const res = createRes();

    await locations.getLocationTypeDistribution(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
  });
});

// ============================================================================
// getLocationTree
// ============================================================================

test('getLocationTree -> returns all locations', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'result', [[
    { id: 1, code: 'LOC1', name: 'Lokasyon 1', municipality_id: 5 },
    { id: 2, code: 'LOC2', name: 'Lokasyon 2', municipality_id: 5 },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
    });
    const res = createRes();

    await locations.getLocationTree(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 2);
  });
});

test('getLocationTree -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'result', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
    });
    const res = createRes();

    await locations.getLocationTree(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
  });
});

// ============================================================================
// getLocationById
// ============================================================================

test('getLocationById -> returns location when found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [{
    id: 10,
    code: 'LOC1',
    name: 'Lokasyon 1',
    address: 'Test Adresi',
    department_id: 5,
    is_active: true,
    municipality_id: 5,
    type: 1,
    latitude: 41.0082,
    longitude: 28.9784,
    created_at: new Date(),
    updated_at: new Date(),
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
    });
    const res = createRes();

    await locations.getLocationById(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.id, 10);
    assert.equal(res.body.code, 'LOC1');
    assert.equal(res.body.name, 'Lokasyon 1');
  });
});

test('getLocationById -> 400 when id is not a valid integer', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: 'abc' },
    });
    const res = createRes();

    await locations.getLocationById(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Geçersiz lokasyon ID');
  });
});

test('getLocationById -> 404 when location not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '999' },
    });
    const res = createRes();

    await locations.getLocationById(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Lokasyon bulunamadı');
  });
});

test('getLocationById -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
    });
    const res = createRes();

    await locations.getLocationById(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
  });
});

// ============================================================================
// updateLocation
// ============================================================================

test('updateLocation -> 400 when id is not a valid integer', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: 'abc' },
      body: { name: 'Updated Name' },
    });
    const res = createRes();

    await locations.updateLocation(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Geçersiz lokasyon ID');
  });
});

test('updateLocation -> 400 when no fields to update', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: {},
    });
    const res = createRes();

    await locations.updateLocation(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Güncellenecek alan bulunamadı');
  });
});

test('updateLocation -> 404 when location not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '999' },
      body: { name: 'Updated Name' },
    });
    const res = createRes();

    await locations.updateLocation(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Lokasyon bulunamadı.');
  });
});

test('updateLocation -> 400 when department_id is invalid', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [{ id: 10, code: 'LOC1', name: 'Lokasyon 1' }]);
  mockKnex.__queue('departments', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: { department_id: 999 },
    });
    const res = createRes();

    await locations.updateLocation(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Departman bu belediyeye ait değil');
  });
});

test('updateLocation -> 409 when code conflicts', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [{ id: 10, code: 'LOC1', name: 'Lokasyon 1' }]);
  mockKnex.__queue('locations', 'first', [{ id: 20, code: 'LOC2', name: 'Lokasyon 2' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: { code: 'LOC2' },
    });
    const res = createRes();

    await locations.updateLocation(req, res);
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, 'Bu kod ile kayıt mevcut');
  });
});

test('updateLocation -> updates location successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [{ id: 10, code: 'LOC1', name: 'Lokasyon 1' }]);
  mockKnex.__queue('locations', 'update:returning', [[{
    id: 10,
    code: 'LOC1',
    name: 'Updated Name',
    address: null,
    department_id: null,
    is_active: true,
    municipality_id: 5,
    type: null,
    latitude: null,
    longitude: null,
    created_at: new Date(),
    updated_at: new Date(),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: { name: 'Updated Name' },
    });
    const res = createRes();

    await locations.updateLocation(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.name, 'Updated Name');
  });
});

test('updateLocation -> allows same code for same location', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [{ id: 10, code: 'LOC1', name: 'Lokasyon 1' }]);
  mockKnex.__queue('locations', 'update:returning', [[{
    id: 10,
    code: 'LOC1',
    name: 'Updated Name',
    address: null,
    department_id: null,
    is_active: true,
    municipality_id: 5,
    type: null,
    latitude: null,
    longitude: null,
    created_at: new Date(),
    updated_at: new Date(),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: { code: 'LOC1', name: 'Updated Name' },
    });
    const res = createRes();

    await locations.updateLocation(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.code, 'LOC1');
  });
});

test('updateLocation -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
      body: { name: 'Updated Name' },
    });
    const res = createRes();

    await locations.updateLocation(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
  });
});

// ============================================================================
// deleteLocation
// ============================================================================

test('deleteLocation -> 400 when id is not a valid integer', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: 'abc' },
    });
    const res = createRes();

    await locations.deleteLocation(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Geçersiz lokasyon ID');
  });
});

test('deleteLocation -> 404 when location not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '999' },
    });
    const res = createRes();

    await locations.deleteLocation(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Lokasyon bulunamadı.');
  });
});

test('deleteLocation -> deletes location successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [{ id: 10, code: 'LOC1', name: 'Lokasyon 1' }]);
  mockKnex.__queue('locations', 'del', [1]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
    });
    const res = createRes();

    await locations.deleteLocation(req, res);
    assert.equal(res.statusCode, 204);
  });
});

test('deleteLocation -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('locations', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./locations.controller')];
    const locations = require('./locations.controller');

    const req = createReq({
      tenantMunicipalityId: 5,
      params: { id: '10' },
    });
    const res = createRes();

    await locations.deleteLocation(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
  });
});

