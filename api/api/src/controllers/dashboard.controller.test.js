const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

// ============================================================================
// GET MUNICIPALITY STATS TESTS
// ============================================================================

test('dashboard.controller.getMunicipalityStats -> 400 when municipalityId missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: undefined });
    const res = createRes();

    await dashboard.getMunicipalityStats(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Belediye kapsamı bulunamadı/);
  });
});

test('dashboard.controller.getMunicipalityStats -> 200 with all stats', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{ total: 5 }]);
  mockKnex.__queue('departments', 'first', [{ total: 3 }]);
  mockKnex.__queue('locations', 'first', [{ total: 10 }]);
  mockKnex.__queue('assets', 'first', [{ total: 25 }]);
  mockKnex.__queue('asset_movements', 'first', [{ count: 8 }]);
  mockKnex.__queue('assets', 'first', [{ count: 2 }]); // maintenance
  mockKnex.__queue('assets', 'first', [{ count: 15 }]); // qr tagged

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await dashboard.getMunicipalityStats(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.municipality_id, 1);
    assert.equal(res.body.totals.users, 5);
    assert.equal(res.body.totals.departments, 3);
    assert.equal(res.body.totals.locations, 10);
    assert.equal(res.body.assets.total, 25);
    assert.equal(res.body.assets.movedLast30Days, 8);
    assert.equal(res.body.assets.maintenanceNeeded, 2);
    assert.equal(res.body.assets.qrTagged.count, 15);
    assert.equal(res.body.assets.qrTagged.percentage, 60.0);
  });
});

test('dashboard.controller.getMunicipalityStats -> handles zero assets correctly', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{ total: 0 }]);
  mockKnex.__queue('departments', 'first', [{ total: 0 }]);
  mockKnex.__queue('locations', 'first', [{ total: 0 }]);
  mockKnex.__queue('assets', 'first', [{ total: 0 }]);
  mockKnex.__queue('asset_movements', 'first', [{ count: 0 }]);
  mockKnex.__queue('assets', 'first', [{ count: 0 }]); // maintenance
  mockKnex.__queue('assets', 'first', [{ count: 0 }]); // qr tagged

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await dashboard.getMunicipalityStats(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.assets.total, 0);
    assert.equal(res.body.assets.qrTagged.count, 0);
    assert.equal(res.body.assets.qrTagged.percentage, 0);
  });
});

test('dashboard.controller.getMunicipalityStats -> handles null/undefined counts', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]);
  mockKnex.__queue('departments', 'first', [{ total: undefined }]);
  mockKnex.__queue('locations', 'first', [{ count: null }]);
  mockKnex.__queue('assets', 'first', [{ total: 10 }]);
  mockKnex.__queue('asset_movements', 'first', [null]);
  mockKnex.__queue('assets', 'first', [{ count: undefined }]);
  mockKnex.__queue('assets', 'first', [{ count: null }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await dashboard.getMunicipalityStats(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.totals.users, 0);
    assert.equal(res.body.totals.departments, 0);
    assert.equal(res.body.totals.locations, 0);
    assert.equal(res.body.assets.movedLast30Days, 0);
    assert.equal(res.body.assets.maintenanceNeeded, 0);
    assert.equal(res.body.assets.qrTagged.count, 0);
  });
});

test('dashboard.controller.getMunicipalityStats -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  // Make first() throw an error
  const errorKnex = createMockKnex();
  errorKnex.__queue('users', 'first', [Promise.reject(new Error('DB connection failed'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: errorKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await dashboard.getMunicipalityStats(req, res);
    assert.equal(res.statusCode, 500);
    assert.match(res.body.message, /Sunucu hatası/);
  });
});

// ============================================================================
// GET MUNICIPALITY INFO TESTS
// ============================================================================

test('dashboard.controller.getMunicipalityInfo -> 400 when municipalityId missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: undefined });
    const res = createRes();

    await dashboard.getMunicipalityInfo(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Belediye kapsamı bulunamadı/);
  });
});

test('dashboard.controller.getMunicipalityInfo -> 404 when municipality not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 999 });
    const res = createRes();

    await dashboard.getMunicipalityInfo(req, res);
    assert.equal(res.statusCode, 404);
    assert.match(res.body.message, /Belediye kaydı bulunamadı/);
  });
});

test('dashboard.controller.getMunicipalityInfo -> 200 returns municipality info', async () => {
  const mockKnex = createMockKnex();
  const mockMunicipality = {
    id: 1,
    name: 'Test Belediye',
    province: 'İstanbul',
    district: 'Kadıköy',
  };
  mockKnex.__queue('municipalities', 'first', [mockMunicipality]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await dashboard.getMunicipalityInfo(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.id, 1);
    assert.equal(res.body.name, 'Test Belediye');
    assert.equal(res.body.province, 'İstanbul');
    assert.equal(res.body.district, 'Kadıköy');
  });
});

test('dashboard.controller.getMunicipalityInfo -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [Promise.reject(new Error('DB error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await dashboard.getMunicipalityInfo(req, res);
    assert.equal(res.statusCode, 500);
    assert.match(res.body.message, /Sunucu hatası/);
  });
});

// ============================================================================
// GET RECENT ASSET MOVEMENTS TESTS
// ============================================================================

test('dashboard.controller.getRecentAssetMovements -> 200 returns recent movements', async () => {
  const mockKnex = createMockKnex();
  const mockMovements = [
    {
      id: 1,
      asset_id: 10,
      asset_code: 'AS-1-001',
      asset_name: 'Test Asset',
      movement_type: 'transfer',
      from_department_name: 'IT',
      to_department_name: 'HR',
      from_location_name: 'Building A',
      to_location_name: 'Building B',
      performed_by_name: 'John Doe',
      movement_date: new Date('2025-01-15'),
      notes: 'Test note',
      created_at: new Date('2025-01-15'),
    },
    {
      id: 2,
      asset_id: 11,
      asset_code: 'AS-1-002',
      asset_name: 'Another Asset',
      movement_type: 'disposal',
      from_department_name: 'Finance',
      to_department_name: null,
      from_location_name: 'Building C',
      to_location_name: null,
      performed_by_name: 'Jane Smith',
      movement_date: new Date('2025-01-14'),
      notes: null,
      created_at: new Date('2025-01-14'),
    },
  ];
  // Query starts with 'asset_movements as am', so queue for 'asset_movements'
  mockKnex.__queue('asset_movements', 'result', [mockMovements]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await dashboard.getRecentAssetMovements(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.length, 2);
    assert.equal(res.body[0].id, 1);
    assert.equal(res.body[0].asset_code, 'AS-1-001');
    assert.equal(res.body[0].from_department_name, 'IT');
    assert.equal(res.body[1].to_department_name, null);
  });
});

test('dashboard.controller.getRecentAssetMovements -> 200 returns empty array when no movements', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_movements', 'result', [[]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await dashboard.getRecentAssetMovements(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(Array.isArray(res.body), true);
    assert.equal(res.body.length, 0);
  });
});

test('dashboard.controller.getRecentAssetMovements -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_movements', 'result', [Promise.reject(new Error('DB error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await dashboard.getRecentAssetMovements(req, res);
    assert.equal(res.statusCode, 500);
    assert.match(res.body.message, /Sunucu hatası/);
  });
});

// ============================================================================
// GET CATEGORY DISTRIBUTION TESTS
// ============================================================================

test('dashboard.controller.getCategoryDistribution -> 200 returns category distribution', async () => {
  const mockKnex = createMockKnex();
  const mockRows = [
    { category_id: 1, category_name: 'Bilgisayar', total: '10' },
    { category_id: 2, category_name: 'Mobilya', total: '5' },
    { category_id: null, category_name: null, total: '2' },
  ];
  // Query starts with 'assets as a', so queue for 'assets'
  mockKnex.__queue('assets', 'result', [mockRows]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await dashboard.getCategoryDistribution(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.municipality_id, 1);
    assert.equal(res.body.total_assets, 17);
    assert.equal(res.body.distribution.length, 3);
    assert.equal(res.body.distribution[0].category_id, 1);
    assert.equal(res.body.distribution[0].category_name, 'Bilgisayar');
    assert.equal(res.body.distribution[0].count, 10);
    assert.equal(res.body.distribution[0].percentage, 58.82);
    assert.equal(res.body.distribution[2].category_name, 'Diğer');
  });
});

test('dashboard.controller.getCategoryDistribution -> handles zero assets', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'result', [[]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await dashboard.getCategoryDistribution(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.total_assets, 0);
    assert.equal(res.body.distribution.length, 0);
  });
});

test('dashboard.controller.getCategoryDistribution -> calculates percentages correctly', async () => {
  const mockKnex = createMockKnex();
  const mockRows = [
    { category_id: 1, category_name: 'Category A', total: '3' },
    { category_id: 2, category_name: 'Category B', total: '1' },
  ];
  mockKnex.__queue('assets', 'result', [mockRows]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await dashboard.getCategoryDistribution(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.total_assets, 4);
    assert.equal(res.body.distribution[0].percentage, 75.0);
    assert.equal(res.body.distribution[1].percentage, 25.0);
  });
});

test('dashboard.controller.getCategoryDistribution -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'result', [Promise.reject(new Error('DB error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await dashboard.getCategoryDistribution(req, res);
    assert.equal(res.statusCode, 500);
    assert.match(res.body.message, /Sunucu hatası/);
  });
});

// ============================================================================
// GET UPCOMING MAINTENANCE TESTS
// ============================================================================

test('dashboard.controller.getUpcomingMaintenance -> 200 returns empty when municipalityId missing (no validation)', async () => {
  const mockKnex = createMockKnex();
  // Controller doesn't validate municipalityId, just uses it in where clause
  mockKnex.__queue('maintenance_logs', 'result', [[]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: undefined });
    const res = createRes();

    await dashboard.getUpcomingMaintenance(req, res);
    // Controller doesn't validate, just returns empty result
    assert.equal(res.statusCode, 200);
    assert.equal(Array.isArray(res.body), true);
  });
});

test('dashboard.controller.getUpcomingMaintenance -> 200 returns upcoming maintenance logs', async () => {
  const mockKnex = createMockKnex();
  const mockLogs = [
    {
      id: 1,
      maintenance_request_id: 10,
      log_date: new Date('2025-01-20'),
      log_description: 'Test description',
      created_at: new Date('2025-01-15'),
      asset_id: 10,
      asset_name: 'Test Asset',
      asset_code: 'AS-1-001',
      title: 'Bakım Gerekli',
      status: 'open',
      priority: 'high',
    },
    {
      id: 2,
      maintenance_request_id: 11,
      log_date: new Date('2025-01-25'),
      log_description: null,
      created_at: new Date('2025-01-10'),
      asset_id: 11,
      asset_name: 'Another Asset',
      asset_code: 'AS-1-002',
      title: 'Planlı Bakım',
      status: 'planned',
      priority: 'medium',
    },
  ];
  // Query starts with 'maintenance_logs as ml', so queue for 'maintenance_logs'
  mockKnex.__queue('maintenance_logs', 'result', [mockLogs]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await dashboard.getUpcomingMaintenance(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.length, 2);
    assert.equal(res.body[0].id, 1);
    assert.equal(res.body[0].maintenance_request_id, 10);
    assert.equal(res.body[0].asset_id, 10);
    assert.equal(res.body[0].asset_name, 'Test Asset');
    assert.equal(res.body[0].title, 'Bakım Gerekli');
    assert.equal(res.body[0].status, 'open');
    assert.equal(res.body[0].priority, 'high');
    assert.equal(res.body[0].due_date.getTime(), mockLogs[0].log_date.getTime());
    assert.equal(res.body[1].due_date.getTime(), mockLogs[1].log_date.getTime());
  });
});

test('dashboard.controller.getUpcomingMaintenance -> handles missing asset info', async () => {
  const mockKnex = createMockKnex();
  const mockLogs = [
    {
      id: 1,
      maintenance_request_id: null,
      log_date: new Date('2025-01-15'),
      log_description: null,
      created_at: new Date('2025-01-15'),
      asset_id: null,
      asset_name: null,
      asset_code: null,
      title: 'Bakım',
      status: 'in_progress',
      priority: 'low',
    },
  ];
  mockKnex.__queue('maintenance_logs', 'result', [mockLogs]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await dashboard.getUpcomingMaintenance(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body[0].asset_id, null);
    assert.equal(res.body[0].asset_name, 'Bilinmeyen Varlık');
    assert.equal(res.body[0].asset_code, null);
    assert.equal(res.body[0].status, 'in_progress');
    assert.equal(res.body[0].priority, 'low');
    assert.equal(res.body[0].due_date.getTime(), mockLogs[0].log_date.getTime());
  });
});

test('dashboard.controller.getUpcomingMaintenance -> 200 returns empty array when no logs', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_logs', 'result', [[]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await dashboard.getUpcomingMaintenance(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(Array.isArray(res.body), true);
    assert.equal(res.body.length, 0);
  });
});

test('dashboard.controller.getUpcomingMaintenance -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_logs', 'result', [Promise.reject(new Error('DB error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./dashboard.controller')];
    const dashboard = require('./dashboard.controller');

    const req = createReq({ tenantMunicipalityId: 1 });
    const res = createRes();

    await dashboard.getUpcomingMaintenance(req, res);
    assert.equal(res.statusCode, 500);
    assert.match(res.body.message, /Sunucu hatası/);
  });
});

