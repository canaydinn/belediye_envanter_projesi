const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

async function loadControllerWithKnex(mockKnex) {
  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    // bust module cache to ensure it picks up mocked knex
    delete require.cache[require.resolve('./assets.controller')];
  });
}

test('assets.controller.createAsset -> 400 when required fields missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assets.controller')];
    const assets = require('./assets.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: { name: 'X' },
    });
    const res = createRes();

    await assets.createAsset(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /zorunludur/);
  });
});

test('assets.controller.createAsset -> 400 when FK refs are not in tenant scope', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [null]);
  mockKnex.__queue('departments', 'first', [{ id: 1 }]);
  mockKnex.__queue('locations', 'first', [{ id: 1 }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assets.controller')];
    const assets = require('./assets.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: { name: 'X', category_id: 1, department_id: 1, location_id: 1 },
    });
    const res = createRes();

    await assets.createAsset(req, res);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: 'Kategori bu belediyeye ait değil' });
  });
});

test('assets.controller.createAsset -> inserts, generates asset_code, returns 201', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [{ id: 1 }]);
  mockKnex.__queue('departments', 'first', [{ id: 1 }]);
  mockKnex.__queue('locations', 'first', [{ id: 1 }]);
  mockKnex.__queue('assets', 'insert:returning', [[{ id: 12, municipality_id: 7 }]]);
  mockKnex.__queue('assets', 'update:returning', [[{ id: 12, asset_code: 'AS-7-25-000012' }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assets.controller')];
    const assets = require('./assets.controller');

    const req = createReq({
      tenantMunicipalityId: 7,
      user: { id: 99 },
      body: {
        name: 'Test',
        category_id: 1,
        department_id: 1,
        location_id: 1,
        purchase_date: '2025-04-10',
      },
    });
    const res = createRes();

    await assets.createAsset(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.id, 12);
    assert.equal(res.body.asset_code, 'AS-7-25-000012');
  });
});

test('assets.controller.getStatusDistribution -> maps counts into normalized distribution', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'result', [[
    { status: 'active', count: '3' },
    { status: 'disposed', count: '1' },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assets.controller')];
    const assets = require('./assets.controller');

    const req = createReq({ tenantMunicipalityId: 5 });
    const res = createRes();

    await assets.getStatusDistribution(req, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      municipality_id: 5,
      distribution: {
        active: 3,
        in_maintenance: 0,
        disposed: 1,
        lost: 0,
      },
      total: 4,
    });
  });
});
