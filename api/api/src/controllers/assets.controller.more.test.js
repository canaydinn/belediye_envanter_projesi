const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes, createNext } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

const CTRL_PATH = './assets.controller';
const KNEX_PATH = require.resolve('../config/knex');

function freshController() {
  delete require.cache[require.resolve(CTRL_PATH)];
  return require(CTRL_PATH);
}

test('assets.listAssets -> returns list (200)', async () => {
  const rows = [{ id: 1, name: 'A', municipality_id: 1 }];

  // ✅ thenable builder: await edildiğinde rows döner
  const knexStub = () => ({
    leftJoin() { return this; },
    where() { return this; },
    select() { return this; },
    orderBy() { return this; },
    then: (resolve) => Promise.resolve(rows).then(resolve),
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.listAssets(req, res);

    assert.deepEqual(res.body, rows);
  });
});

test('assets.listAssets -> 500 on error', async () => {
  const knexStub = () => ({
    leftJoin() { return this; },
    where() { return this; },
    select() { return this; },
    orderBy() { return this; },
    then: (_resolve, reject) => Promise.reject(new Error('boom')).catch(reject),
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.listAssets(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Sunucu hatası' });
  });
});

test('assets.getAssetById -> 404 when not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets as e', 'first', [null]);

  // knex.raw da çağrılıyor → stub
  mockKnex.raw = () => 'RAW_OK';

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1, params: { id: 99 } });
    const res = createRes();

    await ctrl.getAssetById(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: 'Varlık bulunamadı' });
  });
});

test('assets.getAssetById -> returns asset (200)', async () => {
  const mockKnex = createMockKnex();
  const asset = { id: 5, name: 'Laptop', municipality_id: 1 };

  mockKnex.__queue('assets as e', 'first', [asset]);
  mockKnex.raw = () => 'RAW_OK';

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1, params: { id: 5 } });
    const res = createRes();

    await ctrl.getAssetById(req, res);

    assert.deepEqual(res.body, asset);
  });
});

test('assets.getAssetById -> 500 on error', async () => {
  const knexStub = Object.assign(
    () => ({
      leftJoin() { return this; },
      where() { return this; },
      andWhere() { return this; },
      select() { return this; },
      first() { return Promise.reject(new Error('db fail')); }, // ✅ burada throw üret
    }),
    {
      raw: () => 'RAW_OK',
    }
  );

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1, params: { id: 1 } });
    const res = createRes();

    await ctrl.getAssetById(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Sunucu hatası' });
  });
});

test('assets.deleteAsset -> 404 when deletedCount=0', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'del', [0]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1, params: { id: 10 } });
    const res = createRes();

    await ctrl.deleteAsset(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: 'Varlık bulunamadı veya bu belediyeye ait değil' });
  });
});

test('assets.deleteAsset -> success (200) when deleted', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'del', [1]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1, params: { id: 10 } });
    const res = createRes();

    await ctrl.deleteAsset(req, res);

    assert.deepEqual(res.body, { message: 'Varlık silindi' });
  });
});

test('assets.deleteAsset -> 500 on error', async () => {
  const knexStub = () => ({
    where() { return this; },
    del() { return Promise.reject(new Error('del fail')); }, // ✅ throw
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1, params: { id: 10 } });
    const res = createRes();

    await ctrl.deleteAsset(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Sunucu hatası' });
  });
});


test('assets.getFilterOptions -> returns categories/departments/locations', async () => {
  const categories = [{ id: 1, name: 'Cat' }];
  const departments = [{ id: 1, name: 'Dept' }];
  const locations = [{ id: 1, name: 'Loc' }];

  const knexStub = (table) => ({
    where() { return this; },
    select() {
      if (table === 'asset_categories') return Promise.resolve(categories);
      if (table === 'departments') return Promise.resolve(departments);
      if (table === 'locations') return Promise.resolve(locations);
      return Promise.resolve([]);
    },
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getFilterOptions(req, res);

    assert.deepEqual(res.body, { categories, departments, locations });
  });
});


test('assets.getFilterOptions -> 500 when query fails', async () => {
  const knexStub = (table) => {
    if (table === 'asset_categories') {
      return {
        where() { return this; },
        select() { throw new Error('fail'); },   // ✅ garanti catch'e düşür
      };
    }

    return {
      where() { return this; },
      select() { return Promise.resolve([]); },
    };
  };

  await withMockedModules(
    {
      [KNEX_PATH]: knexStub,          // absolute id
      '../config/knex': knexStub,     // literal id (kritik)
    },
    async () => {
      const ctrl = freshController();
      const req = createReq({ tenantMunicipalityId: 1 });
      const res = createRes();

      await ctrl.getFilterOptions(req, res);

      assert.equal(res.statusCode, 500);
      assert.deepEqual(res.body, { message: 'Filtre verileri alınamadı' });
    }
  );
});

test('assets.getRecentAssets -> returns last 5', async () => {
  const rows = [{ id: 1, name: 'X' }];

  const knexStub = () => ({
    leftJoin() { return this; },
    where() { return this; },
    select() { return this; },
    orderBy() { return this; },
    limit() { return Promise.resolve(rows); }, // ✅ burada resolve
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getRecentAssets(req, res);

    assert.deepEqual(res.body, rows);
  });
});

test('assets.getRecentAssets -> 500 on error', async () => {
  const knexStub = () => ({
    leftJoin() { return this; },
    where() { return this; },
    select() { return this; },
    orderBy() { return this; },
    limit() { return Promise.reject(new Error('fail')); }, // ✅ throw
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getRecentAssets(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Sunucu hatası' });
  });
});

/**
 * validateAssetRefs içindeki assigned_user_id branch’ini kapatmak için:
 * createAsset üzerinden assigned_user_id gönderip "user yok/pasif" dalını tetikliyoruz.
 */
test('assets.createAsset -> 400 when assigned_user_id not in tenant or inactive', async () => {
  const mockKnex = createMockKnex();

  // validateAssetRefs: cat/dept/loc first() -> hepsi var
  mockKnex.__queue('asset_categories', 'first', [{ id: 1 }]);
  mockKnex.__queue('departments', 'first', [{ id: 1 }]);
  mockKnex.__queue('locations', 'first', [{ id: 1 }]);

  // assigned_user_id var → users.first() null dönsün
  mockKnex.__queue('users', 'first', [null]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 7 },
      body: {
        name: 'A',
        category_id: 1,
        department_id: 1,
        location_id: 1,
        assigned_user_id: 999,
      },
    });
    const res = createRes();

    await ctrl.createAsset(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: 'Sorumlu kişi bu belediyeye ait değil veya pasif' });
  });
});

test('assets.createAsset -> 500 returns err.message/code/detail on exception', async () => {
  const err = new Error('INSERT_FAIL');
  err.code = '23505';
  err.detail = 'duplicate key';

  // validateAssetRefs ilk Promise.all içinde asset_categories.first() çağrılıyor
  const knexStub = (table) => {
    if (table === 'asset_categories') {
      return { where() { return this; }, first() { return Promise.reject(err); } }; // ✅ throw
    }
    // diğer tablolara düşmemesi ideal; düşerse de dummy:
    return { where() { return this; }, first() { return Promise.resolve({ id: 1 }); } };
  };

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 7 },
      body: { name: 'A', category_id: 1, department_id: 1, location_id: 1 },
    });
    const res = createRes();

    await ctrl.createAsset(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, {
      message: 'INSERT_FAIL',
      code: '23505',
      detail: 'duplicate key',
    });
  });
});

test('assets.updateAsset -> 400 when refCheck fails (cross-tenant FK)', async () => {
  const mockKnex = createMockKnex();

  // existing asset var
  mockKnex.__queue('assets', 'first', [
    { id: 1, municipality_id: 1, asset_code: 'A', category_id: 1, department_id: 1, location_id: 1 },
  ]);

  // validateAssetRefs: cat yok → fail
  mockKnex.__queue('asset_categories', 'first', [null]);
  mockKnex.__queue('departments', 'first', [{ id: 1 }]);
  mockKnex.__queue('locations', 'first', [{ id: 1 }]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 7 },
      params: { id: 1 },
      body: { category_id: 999 }, // nextCategoryId=999 olacak
    });
    const res = createRes();

    await ctrl.updateAsset(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: 'Kategori bu belediyeye ait değil' });
  });
});
