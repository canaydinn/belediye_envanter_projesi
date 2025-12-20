const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

test('assets.controller.updateAsset -> 404 when asset not found in tenant scope', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assets.controller')];
    const assets = require('./assets.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 1 },
      params: { id: 10 },
      body: { name: 'X' },
    });
    const res = createRes();

    await assets.updateAsset(req, res);
    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: 'Varlık bulunamadı veya bu belediyeye ait değil' });
  });
});

test('assets.controller.updateAsset -> 400 when asset_code conflicts within tenant', async () => {
  const mockKnex = createMockKnex();
  // existing asset
  mockKnex.__queue('assets', 'first', [
    { id: 10, municipality_id: 1, asset_code: 'AS-1-25-000010', category_id: 1, department_id: 1, location_id: 1 },
    // conflict check result
    { id: 11 },
  ]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assets.controller')];
    const assets = require('./assets.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 1 },
      params: { id: 10 },
      body: { asset_code: 'AS-1-25-000011' },
    });
    const res = createRes();

    await assets.updateAsset(req, res);
    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: 'Bu asset_code bu belediyede zaten kullanılıyor' });
  });
});
