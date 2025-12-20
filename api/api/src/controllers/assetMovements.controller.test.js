const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

const CTRL_PATH = './assetMovements.controller';
const KNEX_PATH = require.resolve('../config/knex');

function freshController() {
  delete require.cache[require.resolve(CTRL_PATH)];
  return require(CTRL_PATH);
}

// ============================================================================
// listAssetMovements tests
// ============================================================================

test('assetMovements.listAssetMovements -> returns list (200)', async () => {
  const movements = [
    {
      id: 1,
      asset_id: 10,
      asset_code: 'AS-1-001',
      asset_name: 'Laptop',
      movement_type: 'assign',
      from_department_id: null,
      to_department_id: 5,
      performer_name: 'John Doe',
    },
  ];

  const knexStub = () => ({
    leftJoin() { return this; },
    where() { return this; },
    andWhere() { return this; },
    select() { return this; },
    orderBy() { return this; },
    then: (resolve) => Promise.resolve(movements).then(resolve),
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.listAssetMovements(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, movements);
  });
});

test('assetMovements.listAssetMovements -> filters by asset_code', async () => {
  const movements = [{ id: 1, asset_code: 'AS-1-001', asset_name: 'Laptop' }];

  const knexStub = () => ({
    leftJoin() { return this; },
    where() { return this; },
    andWhere() { return this; },
    select() { return this; },
    orderBy() { return this; },
    then: (resolve) => Promise.resolve(movements).then(resolve),
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      query: { asset_code: 'AS-1' },
    });
    const res = createRes();

    await ctrl.listAssetMovements(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, movements);
  });
});

test('assetMovements.listAssetMovements -> filters by movement_type', async () => {
  const movements = [{ id: 1, movement_type: 'assign' }];

  const knexStub = () => ({
    leftJoin() { return this; },
    where() { return this; },
    andWhere() { return this; },
    select() { return this; },
    orderBy() { return this; },
    then: (resolve) => Promise.resolve(movements).then(resolve),
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      query: { movement_type: 'assign' },
    });
    const res = createRes();

    await ctrl.listAssetMovements(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, movements);
  });
});

test('assetMovements.listAssetMovements -> filters by date range', async () => {
  const movements = [{ id: 1, movement_date: '2025-01-15' }];

  const knexStub = () => ({
    leftJoin() { return this; },
    where() { return this; },
    andWhere() { return this; },
    andWhereBetween() { return this; },
    select() { return this; },
    orderBy() { return this; },
    then: (resolve) => Promise.resolve(movements).then(resolve),
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      query: { start_date: '2025-01-01', end_date: '2025-01-31' },
    });
    const res = createRes();

    await ctrl.listAssetMovements(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, movements);
  });
});

test('assetMovements.listAssetMovements -> 500 on error', async () => {
  const knexStub = () => ({
    leftJoin() { return this; },
    where() { return this; },
    select() { return this; },
    orderBy() { return this; },
    then: (_resolve, reject) => Promise.reject(new Error('db fail')).catch(reject),
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.listAssetMovements(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Sunucu hatası' });
  });
});

// ============================================================================
// getMovementStats tests
// ============================================================================

test('assetMovements.getMovementStats -> returns stats (200)', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_movements', 'result', [
    [{ count: '15' }], // last30Days
    [{ count: '3' }],  // today
    [{ count: '5' }],  // maintenance
    [{ count: '8' }],  // assignmentTransfer
  ]);

  // Add whereIn support to mockKnex builder
  const originalKnex = mockKnex;
  const makeBuilderWithWhereIn = (table) => {
    const builder = originalKnex(table);
    builder.whereIn = () => builder;
    return builder;
  };
  const knexWithWhereIn = (table) => makeBuilderWithWhereIn(table);
  Object.assign(knexWithWhereIn, originalKnex);

  await withMockedModules({ [KNEX_PATH]: knexWithWhereIn }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getMovementStats(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.last30DaysTotal, 15);
    assert.equal(res.body.todayTotal, 3);
    assert.equal(res.body.maintenanceTotal, 5);
    assert.equal(res.body.assignmentTransferTotal, 8);
  });
});

test('assetMovements.getMovementStats -> handles zero counts', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_movements', 'result', [
    [{ count: '0' }],
    [{ count: '0' }],
    [{ count: '0' }],
    [{ count: '0' }],
  ]);

  // Add whereIn support to mockKnex builder
  const originalKnex = mockKnex;
  const makeBuilderWithWhereIn = (table) => {
    const builder = originalKnex(table);
    builder.whereIn = () => builder;
    return builder;
  };
  const knexWithWhereIn = (table) => makeBuilderWithWhereIn(table);
  Object.assign(knexWithWhereIn, originalKnex);

  await withMockedModules({ [KNEX_PATH]: knexWithWhereIn }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getMovementStats(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.last30DaysTotal, 0);
    assert.equal(res.body.todayTotal, 0);
    assert.equal(res.body.maintenanceTotal, 0);
    assert.equal(res.body.assignmentTransferTotal, 0);
  });
});

test('assetMovements.getMovementStats -> 500 on error', async () => {
  const knexStub = (table) => {
    if (table === 'asset_movements') {
      return {
        where() { return this; },
        andWhere() { return this; },
        count() { return Promise.reject(new Error('db fail')); },
      };
    }
    return {};
  };

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getMovementStats(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Sunucu hatası' });
  });
});

// ============================================================================
// getMovementTypeDistribution tests
// ============================================================================

test('assetMovements.getMovementTypeDistribution -> returns distribution (200)', async () => {
  const movementCounts = [
    { movement_type: 'assign', count: '10' },
    { movement_type: 'transfer', count: '5' },
    { movement_type: 'maintenance', count: '3' },
  ];

  const knexStub = () => ({
    where() { return this; },
    groupBy() { return this; },
    select() { return this; },
    count() { return this; },
    then: (resolve) => Promise.resolve(movementCounts).then(resolve),
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getMovementTypeDistribution(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.totalMovements, 18);
    assert.equal(res.body.distribution.length, 3);
    assert.equal(res.body.distribution[0].movement_type, 'assign');
    assert.equal(res.body.distribution[0].count, 10);
    assert.equal(res.body.distribution[0].percentage, 55.56);
  });
});

test('assetMovements.getMovementTypeDistribution -> handles empty results', async () => {
  const knexStub = () => ({
    where() { return this; },
    groupBy() { return this; },
    select() { return this; },
    count() { return this; },
    then: (resolve) => Promise.resolve([]).then(resolve),
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getMovementTypeDistribution(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.totalMovements, 0);
    assert.deepEqual(res.body.distribution, []);
  });
});

test('assetMovements.getMovementTypeDistribution -> handles null movement_type', async () => {
  const movementCounts = [
    { movement_type: null, count: '2' },
    { movement_type: 'assign', count: '5' },
  ];

  const knexStub = () => ({
    where() { return this; },
    groupBy() { return this; },
    select() { return this; },
    count() { return this; },
    then: (resolve) => Promise.resolve(movementCounts).then(resolve),
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getMovementTypeDistribution(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.totalMovements, 7);
    const unknownType = res.body.distribution.find((d) => d.movement_type === 'Bilinmiyor');
    assert.ok(unknownType);
    assert.equal(unknownType.count, 2);
  });
});

test('assetMovements.getMovementTypeDistribution -> 500 on error', async () => {
  const knexStub = () => ({
    where() { return this; },
    groupBy() { return this; },
    select() { return this; },
    count() { return this; },
    then: (_resolve, reject) => Promise.reject(new Error('db fail')).catch(reject),
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getMovementTypeDistribution(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Sunucu hatası' });
  });
});

// ============================================================================
// getRecentAssetMovements tests
// ============================================================================

test('assetMovements.getRecentAssetMovements -> returns last 5 (200)', async () => {
  const movements = [
    { id: 1, asset_code: 'AS-1-001', asset_name: 'Laptop', movement_type: 'assign' },
    { id: 2, asset_code: 'AS-1-002', asset_name: 'Desktop', movement_type: 'transfer' },
  ];

  const knexStub = () => ({
    join() { return this; },
    leftJoin() { return this; },
    where() { return this; },
    select() { return this; },
    orderBy() { return this; },
    limit() { return Promise.resolve(movements); },
  });
  knexStub.raw = () => ({ __raw: 'COALESCE(u.full_name, u.username) as performed_by_name' });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getRecentAssetMovements(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, movements);
  });
});

test('assetMovements.getRecentAssetMovements -> 500 on error', async () => {
  const knexStub = () => ({
    join() { return this; },
    leftJoin() { return this; },
    where() { return this; },
    select() { return this; },
    orderBy() { return this; },
    limit() { return Promise.reject(new Error('db fail')); },
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getRecentAssetMovements(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Sunucu hatası' });
  });
});

// ============================================================================
// createAssetMovement tests
// ============================================================================

test('assetMovements.createAssetMovement -> 401 when user not authenticated', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      user: null,
      body: { asset_id: 1, movement_type: 'assign' },
    });
    const res = createRes();

    await ctrl.createAssetMovement(req, res);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: 'Kullanıcı bilgisi bulunamadı' });
  });
});

test('assetMovements.createAssetMovement -> 401 when municipalityId missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: null,
      user: { id: 10 },
      body: { asset_id: 1, movement_type: 'assign' },
    });
    const res = createRes();

    await ctrl.createAssetMovement(req, res);

    assert.equal(res.statusCode, 401);
    assert.deepEqual(res.body, { message: 'Kullanıcı bilgisi bulunamadı' });
  });
});

test('assetMovements.createAssetMovement -> 400 when asset_id missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: { movement_type: 'assign' },
    });
    const res = createRes();

    await ctrl.createAssetMovement(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: 'Varlık ve geçerli hareket türü zorunludur' });
  });
});

test('assetMovements.createAssetMovement -> 400 when movement_type invalid', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: { asset_id: 1, movement_type: 'invalid_type' },
    });
    const res = createRes();

    await ctrl.createAssetMovement(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: 'Varlık ve geçerli hareket türü zorunludur' });
  });
});

test('assetMovements.createAssetMovement -> 404 when asset not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'first', [null]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: { asset_id: 999, movement_type: 'assign' },
    });
    const res = createRes();

    await ctrl.createAssetMovement(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: 'Varlık bulunamadı' });
  });
});

test('assetMovements.createAssetMovement -> creates movement (201)', async () => {
  const mockKnex = createMockKnex();
  const asset = { id: 1, municipality_id: 1, department_id: 5, location_id: 10 };
  const createdMovement = {
    id: 100,
    asset_id: 1,
    movement_type: 'assign',
    from_department_id: 5,
    to_department_id: null,
    from_location_id: 10,
    to_location_id: null,
    performed_by_user_id: 10,
    municipality_id: 1,
    movement_date: new Date(),
    notes: 'Test note',
    created_at: new Date(),
    updated_at: new Date(),
  };

  mockKnex.__queue('assets', 'first', [asset]);
  mockKnex.__queue('asset_movements', 'insert:returning', [[createdMovement]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        asset_id: 1,
        movement_type: 'assign',
        notes: 'Test note',
      },
    });
    const res = createRes();

    await ctrl.createAssetMovement(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.id, 100);
    assert.equal(res.body.asset_id, 1);
    assert.equal(res.body.movement_type, 'assign');
  });
});

test('assetMovements.createAssetMovement -> normalizes movement_type', async () => {
  const mockKnex = createMockKnex();
  const asset = { id: 1, municipality_id: 1 };
  const createdMovement = {
    id: 100,
    asset_id: 1,
    movement_type: 'transfer',
    municipality_id: 1,
  };

  mockKnex.__queue('assets', 'first', [asset]);
  mockKnex.__queue('asset_movements', 'insert:returning', [[createdMovement]]);

  // Track insert data
  let insertData = null;
  const originalInsert = mockKnex('asset_movements').insert;
  const trackingKnex = (table) => {
    const builder = mockKnex(table);
    if (table === 'asset_movements') {
      const originalInsertMethod = builder.insert;
      builder.insert = function(payload) {
        insertData = payload;
        return originalInsertMethod.call(this, payload);
      };
    }
    return builder;
  };
  Object.assign(trackingKnex, mockKnex);

  await withMockedModules({ [KNEX_PATH]: trackingKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        asset_id: 1,
        movement_type: 'department', // should normalize to 'transfer'
      },
    });
    const res = createRes();

    await ctrl.createAssetMovement(req, res);

    assert.equal(res.statusCode, 201);
    // Verify that the movement was created with normalized type
    assert.ok(insertData);
    assert.equal(insertData.movement_type, 'transfer');
  });
});

test('assetMovements.createAssetMovement -> uses asset defaults for from_department/location', async () => {
  const mockKnex = createMockKnex();
  const asset = { id: 1, municipality_id: 1, department_id: 5, location_id: 10 };
  const createdMovement = {
    id: 100,
    asset_id: 1,
    movement_type: 'assign',
    from_department_id: 5,
    from_location_id: 10,
    municipality_id: 1,
  };

  mockKnex.__queue('assets', 'first', [asset]);
  mockKnex.__queue('asset_movements', 'insert:returning', [[createdMovement]]);

  // Track insert data
  let insertData = null;
  const trackingKnex = (table) => {
    const builder = mockKnex(table);
    if (table === 'asset_movements') {
      const originalInsertMethod = builder.insert;
      builder.insert = function(payload) {
        insertData = payload;
        return originalInsertMethod.call(this, payload);
      };
    }
    return builder;
  };
  Object.assign(trackingKnex, mockKnex);

  await withMockedModules({ [KNEX_PATH]: trackingKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        asset_id: 1,
        movement_type: 'assign',
      },
    });
    const res = createRes();

    await ctrl.createAssetMovement(req, res);

    assert.equal(res.statusCode, 201);
    assert.ok(insertData);
    assert.equal(insertData.from_department_id, 5);
    assert.equal(insertData.from_location_id, 10);
  });
});

test('assetMovements.createAssetMovement -> 500 on error', async () => {
  const mockKnex = createMockKnex();
  const asset = { id: 1, municipality_id: 1 };
  mockKnex.__queue('assets', 'first', [asset]);
  mockKnex.__queue('asset_movements', 'insert:returning', [Promise.reject(new Error('insert fail'))]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        asset_id: 1,
        movement_type: 'assign',
      },
    });
    const res = createRes();

    await ctrl.createAssetMovement(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Sunucu hatası' });
  });
});

// ============================================================================
// getLastThirtyDaysMovementsTotal tests
// ============================================================================

test('assetMovements.getLastThirtyDaysMovementsTotal -> returns total (200)', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_movements', 'result', [[{ count: '25' }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getLastThirtyDaysMovementsTotal(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.total, 25);
  });
});

test('assetMovements.getLastThirtyDaysMovementsTotal -> handles zero count', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_movements', 'result', [[{ count: '0' }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getLastThirtyDaysMovementsTotal(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.total, 0);
  });
});

test('assetMovements.getLastThirtyDaysMovementsTotal -> 500 on error', async () => {
  const knexStub = () => ({
    where() { return this; },
    andWhere() { return this; },
    count() { return Promise.reject(new Error('db fail')); },
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getLastThirtyDaysMovementsTotal(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Sunucu hatası' });
  });
});

// ============================================================================
// getTodayMovementsTotal tests
// ============================================================================

test('assetMovements.getTodayMovementsTotal -> returns total (200)', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_movements', 'result', [[{ count: '5' }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getTodayMovementsTotal(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.total, 5);
  });
});

test('assetMovements.getTodayMovementsTotal -> 500 on error', async () => {
  const knexStub = () => ({
    where() { return this; },
    andWhere() { return this; },
    count() { return Promise.reject(new Error('db fail')); },
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getTodayMovementsTotal(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Sunucu hatası' });
  });
});

// ============================================================================
// getMaintenanceMovementsTotal tests
// ============================================================================

test('assetMovements.getMaintenanceMovementsTotal -> returns total (200)', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_movements', 'result', [[{ count: '12' }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getMaintenanceMovementsTotal(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.total, 12);
  });
});

test('assetMovements.getMaintenanceMovementsTotal -> 500 on error', async () => {
  const knexStub = () => ({
    where() { return this; },
    count() { return Promise.reject(new Error('db fail')); },
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getMaintenanceMovementsTotal(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Sunucu hatası' });
  });
});

// ============================================================================
// getZimmetMovementsTotal tests
// ============================================================================

test('assetMovements.getZimmetMovementsTotal -> returns total (200)', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_movements', 'result', [[{ count: '8' }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getZimmetMovementsTotal(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.total, 8);
  });
});

test('assetMovements.getZimmetMovementsTotal -> 500 on error', async () => {
  const knexStub = () => ({
    where() { return this; },
    count() { return Promise.reject(new Error('db fail')); },
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.getZimmetMovementsTotal(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Sunucu hatası' });
  });
});

// ============================================================================
// filterMovements tests
// ============================================================================

test('assetMovements.filterMovements -> returns filtered results (200)', async () => {
  const movements = [
    { id: 1, asset_code: 'AS-1-001', asset_name: 'Laptop', movement_type: 'assign' },
  ];

  const knexStub = () => ({
    leftJoin() { return this; },
    where() { return this; },
    andWhere() { return this; },
    select() { return this; },
    orderBy() { return this; },
    limit() { return this; },
    then: (resolve) => Promise.resolve(movements).then(resolve),
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      query: { assetSearch: 'Laptop', movementType: 'assign' },
    });
    const res = createRes();

    await ctrl.filterMovements(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.data, movements);
  });
});

test('assetMovements.filterMovements -> limits to 100 when no filters', async () => {
  const movements = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));

  const knexStub = () => ({
    leftJoin() { return this; },
    where() { return this; },
    select() { return this; },
    orderBy() { return this; },
    limit() { return this; },
    then: (resolve) => Promise.resolve(movements).then(resolve),
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      query: {},
    });
    const res = createRes();

    await ctrl.filterMovements(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.data, movements);
  });
});

test('assetMovements.filterMovements -> filters by departmentId', async () => {
  const movements = [{ id: 1, from_department_id: 5 }];

  const knexStub = () => ({
    leftJoin() { return this; },
    where() { return this; },
    andWhere() { return this; },
    select() { return this; },
    orderBy() { return this; },
    then: (resolve) => Promise.resolve(movements).then(resolve),
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      query: { departmentId: '5' },
    });
    const res = createRes();

    await ctrl.filterMovements(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.data, movements);
  });
});

test('assetMovements.filterMovements -> filters by date range', async () => {
  const movements = [{ id: 1, movement_date: '2025-01-15' }];

  const knexStub = () => ({
    leftJoin() { return this; },
    where() { return this; },
    andWhere() { return this; },
    andWhereBetween() { return this; },
    select() { return this; },
    orderBy() { return this; },
    then: (resolve) => Promise.resolve(movements).then(resolve),
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      query: { startDate: '2025-01-01', endDate: '2025-01-31' },
    });
    const res = createRes();

    await ctrl.filterMovements(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.data, movements);
  });
});

test('assetMovements.filterMovements -> 500 on error', async () => {
  const knexStub = () => ({
    leftJoin() { return this; },
    where() { return this; },
    select() { return this; },
    orderBy() { return this; },
    then: (_resolve, reject) => Promise.reject(new Error('db fail')).catch(reject),
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await ctrl.filterMovements(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Varlık hareketleri alınamadı' });
  });
});

