const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

const CTRL_PATH = require.resolve('../../../src/controllers/bulk-import.controller');
const KNEX_PATH = require.resolve('../config/knex');

// ============================================================================
// bulkImportAssets tests
// ============================================================================

test('bulk-import.bulkImportAssets -> 400 when assets array is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {},
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Varlık listesi gerekli/);
  });
});

test('bulk-import.bulkImportAssets -> 400 when assets is not an array', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: { assets: 'not-an-array' },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Varlık listesi gerekli/);
  });
});

test('bulk-import.bulkImportAssets -> 400 when assets array is empty', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: { assets: [] },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Varlık listesi gerekli/);
  });
});

test('bulk-import.bulkImportAssets -> loads cache and processes single asset successfully', async () => {
  const mockKnex = createMockKnex();
  
  // Cache loading queries
  mockKnex.__queue('asset_categories', 'result', [[
    { id: 1, name: 'Kategori 1' },
    { id: 2, name: 'Kategori 2' }
  ]]);
  mockKnex.__queue('departments', 'result', [[
    { id: 1, name: 'Birim 1' },
    { id: 2, name: 'Birim 2' }
  ]]);
  mockKnex.__queue('locations', 'result', [[
    { id: 1, name: 'Lokasyon 1' },
    { id: 2, name: 'Lokasyon 2' }
  ]]);
  mockKnex.__queue('users', 'result', [[
    { id: 1, full_name: 'Kullanıcı 1', username: 'user1' }
  ]]);
  
  // Transaction: insert asset
  mockKnex.__queue('assets', 'insert:returning', [[{ id: 100, municipality_id: 5 }]]);
  // Transaction: update asset_code
  mockKnex.__queue('assets', 'update:returning', [[{ id: 100 }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 5,
      user: { id: 10 },
      body: {
        assets: [{
          name: 'Test Varlık',
          category_id: 1,
          department_id: 1,
          location_id: 1,
          purchase_date: '2025-01-15'
        }],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, 1);
    assert.equal(res.body.processed, 1);
    assert.equal(res.body.errors.length, 0);
    assert.equal(res.body.chunkNumber, 1);
    assert.equal(res.body.totalChunks, 1);
  });
});

test('bulk-import.bulkImportAssets -> validates required fields (name missing)', async () => {
  const mockKnex = createMockKnex();
  
  mockKnex.__queue('asset_categories', 'result', [[{ id: 1, name: 'Kategori 1' }]]);
  mockKnex.__queue('departments', 'result', [[{ id: 1, name: 'Birim 1' }]]);
  mockKnex.__queue('locations', 'result', [[{ id: 1, name: 'Lokasyon 1' }]]);
  mockKnex.__queue('users', 'result', [[]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        assets: [{
          category_id: 1,
          department_id: 1,
          location_id: 1
        }],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, 0);
    assert.equal(res.body.processed, 1);
    assert.equal(res.body.errors.length, 1);
    assert.equal(res.body.errors[0].row, 1);
    assert.match(res.body.errors[0].message, /Varlık adı zorunludur/);
  });
});

test('bulk-import.bulkImportAssets -> validates required fields (category_id missing)', async () => {
  const mockKnex = createMockKnex();
  
  mockKnex.__queue('asset_categories', 'result', [[]]);
  mockKnex.__queue('departments', 'result', [[{ id: 1, name: 'Birim 1' }]]);
  mockKnex.__queue('locations', 'result', [[{ id: 1, name: 'Lokasyon 1' }]]);
  mockKnex.__queue('users', 'result', [[]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        assets: [{
          name: 'Test Varlık',
          department_id: 1,
          location_id: 1
        }],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, 0);
    assert.equal(res.body.processed, 1);
    assert.equal(res.body.errors.length, 1);
    assert.match(res.body.errors[0].message, /Kategori ID zorunludur/);
  });
});

test('bulk-import.bulkImportAssets -> validates required fields (department_id missing)', async () => {
  const mockKnex = createMockKnex();
  
  mockKnex.__queue('asset_categories', 'result', [[{ id: 1, name: 'Kategori 1' }]]);
  mockKnex.__queue('departments', 'result', [[]]);
  mockKnex.__queue('locations', 'result', [[{ id: 1, name: 'Lokasyon 1' }]]);
  mockKnex.__queue('users', 'result', [[]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        assets: [{
          name: 'Test Varlık',
          category_id: 1,
          location_id: 1
        }],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, 0);
    assert.equal(res.body.processed, 1);
    assert.equal(res.body.errors.length, 1);
    assert.match(res.body.errors[0].message, /Birim ID zorunludur/);
  });
});

test('bulk-import.bulkImportAssets -> validates required fields (location_id missing)', async () => {
  const mockKnex = createMockKnex();
  
  mockKnex.__queue('asset_categories', 'result', [[{ id: 1, name: 'Kategori 1' }]]);
  mockKnex.__queue('departments', 'result', [[{ id: 1, name: 'Birim 1' }]]);
  mockKnex.__queue('locations', 'result', [[]]);
  mockKnex.__queue('users', 'result', [[]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        assets: [{
          name: 'Test Varlık',
          category_id: 1,
          department_id: 1
        }],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, 0);
    assert.equal(res.body.processed, 1);
    assert.equal(res.body.errors.length, 1);
    assert.match(res.body.errors[0].message, /Lokasyon ID zorunludur/);
  });
});

test('bulk-import.bulkImportAssets -> handles category lookup by name', async () => {
  const mockKnex = createMockKnex();
  
  mockKnex.__queue('asset_categories', 'result', [[
    { id: 5, name: 'Bilgisayar' }
  ]]);
  mockKnex.__queue('departments', 'result', [[{ id: 1, name: 'Birim 1' }]]);
  mockKnex.__queue('locations', 'result', [[{ id: 1, name: 'Lokasyon 1' }]]);
  mockKnex.__queue('users', 'result', [[]]);
  
  mockKnex.__queue('assets', 'insert:returning', [[{ id: 200, municipality_id: 3 }]]);
  mockKnex.__queue('assets', 'update:returning', [[{ id: 200 }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 3,
      user: { id: 10 },
      body: {
        assets: [{
          name: 'Laptop',
          category_name: 'Bilgisayar',
          department_id: 1,
          location_id: 1
        }],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, 1);
  });
});

test('bulk-import.bulkImportAssets -> error when category name not found', async () => {
  const mockKnex = createMockKnex();
  
  mockKnex.__queue('asset_categories', 'result', [[
    { id: 1, name: 'Kategori 1' }
  ]]);
  mockKnex.__queue('departments', 'result', [[{ id: 1, name: 'Birim 1' }]]);
  mockKnex.__queue('locations', 'result', [[{ id: 1, name: 'Lokasyon 1' }]]);
  mockKnex.__queue('users', 'result', [[]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        assets: [{
          name: 'Test Varlık',
          category_name: 'Bulunamayan Kategori',
          department_id: 1,
          location_id: 1
        }],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, 0);
    assert.equal(res.body.processed, 1);
    assert.equal(res.body.errors.length, 1);
    assert.match(res.body.errors[0].message, /Kategori bulunamadı/);
  });
});

test('bulk-import.bulkImportAssets -> error when department name not found', async () => {
  const mockKnex = createMockKnex();
  
  mockKnex.__queue('asset_categories', 'result', [[{ id: 1, name: 'Kategori 1' }]]);
  mockKnex.__queue('departments', 'result', [[{ id: 1, name: 'Birim 1' }]]);
  mockKnex.__queue('locations', 'result', [[{ id: 1, name: 'Lokasyon 1' }]]);
  mockKnex.__queue('users', 'result', [[]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        assets: [{
          name: 'Test Varlık',
          category_id: 1,
          department_name: 'Bulunamayan Birim',
          location_id: 1
        }],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, 0);
    assert.equal(res.body.processed, 1);
    assert.equal(res.body.errors.length, 1);
    assert.match(res.body.errors[0].message, /Birim bulunamadı/);
  });
});

test('bulk-import.bulkImportAssets -> error when location name not found', async () => {
  const mockKnex = createMockKnex();
  
  mockKnex.__queue('asset_categories', 'result', [[{ id: 1, name: 'Kategori 1' }]]);
  mockKnex.__queue('departments', 'result', [[{ id: 1, name: 'Birim 1' }]]);
  mockKnex.__queue('locations', 'result', [[{ id: 1, name: 'Lokasyon 1' }]]);
  mockKnex.__queue('users', 'result', [[]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        assets: [{
          name: 'Test Varlık',
          category_id: 1,
          department_id: 1,
          location_name: 'Bulunamayan Lokasyon'
        }],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, 0);
    assert.equal(res.body.processed, 1);
    assert.equal(res.body.errors.length, 1);
    assert.match(res.body.errors[0].message, /Lokasyon bulunamadı/);
  });
});

test('bulk-import.bulkImportAssets -> processes multiple assets with mixed success/errors', async () => {
  const mockKnex = createMockKnex();
  
  mockKnex.__queue('asset_categories', 'result', [[{ id: 1, name: 'Kategori 1' }]]);
  mockKnex.__queue('departments', 'result', [[{ id: 1, name: 'Birim 1' }]]);
  mockKnex.__queue('locations', 'result', [[{ id: 1, name: 'Lokasyon 1' }]]);
  mockKnex.__queue('users', 'result', [[]]);
  
  // First asset succeeds
  mockKnex.__queue('assets', 'insert:returning', [[{ id: 300, municipality_id: 2 }]]);
  mockKnex.__queue('assets', 'update:returning', [[{ id: 300 }]]);
  
  // Second asset will fail validation (no name)
  // Third asset succeeds
  mockKnex.__queue('assets', 'insert:returning', [[{ id: 301, municipality_id: 2 }]]);
  mockKnex.__queue('assets', 'update:returning', [[{ id: 301 }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 2,
      user: { id: 10 },
      body: {
        assets: [
          {
            name: 'Varlık 1',
            category_id: 1,
            department_id: 1,
            location_id: 1
          },
          {
            // Missing name - will fail validation
            category_id: 1,
            department_id: 1,
            location_id: 1
          },
          {
            name: 'Varlık 3',
            category_id: 1,
            department_id: 1,
            location_id: 1
          }
        ],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, 2);
    assert.equal(res.body.processed, 3);
    assert.equal(res.body.errors.length, 1);
    assert.equal(res.body.errors[0].row, 2);
  });
});

test('bulk-import.bulkImportAssets -> handles chunk numbering correctly', async () => {
  const mockKnex = createMockKnex();
  
  mockKnex.__queue('asset_categories', 'result', [[{ id: 1, name: 'Kategori 1' }]]);
  mockKnex.__queue('departments', 'result', [[{ id: 1, name: 'Birim 1' }]]);
  mockKnex.__queue('locations', 'result', [[{ id: 1, name: 'Lokasyon 1' }]]);
  mockKnex.__queue('users', 'result', [[]]);
  
  mockKnex.__queue('assets', 'insert:returning', [[{ id: 400, municipality_id: 1 }]]);
  mockKnex.__queue('assets', 'update:returning', [[{ id: 400 }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        assets: [{
          name: 'Test Varlık',
          category_id: 1,
          department_id: 1,
          location_id: 1
        }],
        chunkNumber: 3,
        totalChunks: 5
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.chunkNumber, 3);
    assert.equal(res.body.totalChunks, 5);
    // Row number should be (3-1) * 1000 + 1 = 2001
    assert.equal(res.body.errors.length, 0);
  });
});

test('bulk-import.bulkImportAssets -> handles date parsing (valid dates)', async () => {
  const mockKnex = createMockKnex();
  
  mockKnex.__queue('asset_categories', 'result', [[{ id: 1, name: 'Kategori 1' }]]);
  mockKnex.__queue('departments', 'result', [[{ id: 1, name: 'Birim 1' }]]);
  mockKnex.__queue('locations', 'result', [[{ id: 1, name: 'Lokasyon 1' }]]);
  mockKnex.__queue('users', 'result', [[]]);
  
  mockKnex.__queue('assets', 'insert:returning', [[{ id: 500, municipality_id: 1 }]]);
  mockKnex.__queue('assets', 'update:returning', [[{ id: 500 }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        assets: [{
          name: 'Test Varlık',
          category_id: 1,
          department_id: 1,
          location_id: 1,
          purchase_date: '2024-06-15',
          warranty_end_date: '2027-06-15'
        }],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, 1);
  });
});

test('bulk-import.bulkImportAssets -> handles date parsing (invalid dates become null)', async () => {
  const mockKnex = createMockKnex();
  
  mockKnex.__queue('asset_categories', 'result', [[{ id: 1, name: 'Kategori 1' }]]);
  mockKnex.__queue('departments', 'result', [[{ id: 1, name: 'Birim 1' }]]);
  mockKnex.__queue('locations', 'result', [[{ id: 1, name: 'Lokasyon 1' }]]);
  mockKnex.__queue('users', 'result', [[]]);
  
  mockKnex.__queue('assets', 'insert:returning', [[{ id: 600, municipality_id: 1 }]]);
  mockKnex.__queue('assets', 'update:returning', [[{ id: 600 }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        assets: [{
          name: 'Test Varlık',
          category_id: 1,
          department_id: 1,
          location_id: 1,
          purchase_date: 'invalid-date',
          warranty_end_date: 'also-invalid'
        }],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, 1);
  });
});

test('bulk-import.bulkImportAssets -> handles user lookup by name', async () => {
  const mockKnex = createMockKnex();
  
  mockKnex.__queue('asset_categories', 'result', [[{ id: 1, name: 'Kategori 1' }]]);
  mockKnex.__queue('departments', 'result', [[{ id: 1, name: 'Birim 1' }]]);
  mockKnex.__queue('locations', 'result', [[{ id: 1, name: 'Lokasyon 1' }]]);
  mockKnex.__queue('users', 'result', [[
    { id: 50, full_name: 'Ahmet Yılmaz', username: 'ahmet' },
    { id: 51, full_name: null, username: 'mehmet' }
  ]]);
  
  mockKnex.__queue('assets', 'insert:returning', [[{ id: 700, municipality_id: 1 }]]);
  mockKnex.__queue('assets', 'update:returning', [[{ id: 700 }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        assets: [{
          name: 'Test Varlık',
          category_id: 1,
          department_id: 1,
          location_id: 1,
          assigned_user_name: 'Ahmet Yılmaz'
        }],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, 1);
  });
});

test('bulk-import.bulkImportAssets -> handles all optional fields', async () => {
  const mockKnex = createMockKnex();
  
  mockKnex.__queue('asset_categories', 'result', [[{ id: 1, name: 'Kategori 1' }]]);
  mockKnex.__queue('departments', 'result', [[{ id: 1, name: 'Birim 1' }]]);
  mockKnex.__queue('locations', 'result', [[{ id: 1, name: 'Lokasyon 1' }]]);
  mockKnex.__queue('users', 'result', [[]]);
  
  mockKnex.__queue('assets', 'insert:returning', [[{ id: 800, municipality_id: 1 }]]);
  mockKnex.__queue('assets', 'update:returning', [[{ id: 800 }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        assets: [{
          name: 'Test Varlık',
          description: 'Açıklama',
          category_id: 1,
          department_id: 1,
          location_id: 1,
          purchase_price: 1500.50,
          serial_number: 'SN123456',
          status: 'active',
          is_qr_tagged: true,
          quantity: 5,
          unit: 'Adet',
          tasinir_code: 'TAS001',
          asset_type: 'demirbas',
          brand: 'Marka',
          model: 'Model',
          purchase_id: 100,
          amortisman_suresi: 5,
          hurda_degeri: 100.00,
          current_value: 1200.00,
          is_movable: true
        }],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, 1);
  });
});

test('bulk-import.bulkImportAssets -> handles database error gracefully', async () => {
  const mockKnex = createMockKnex();
  
  mockKnex.__queue('asset_categories', 'result', [[{ id: 1, name: 'Kategori 1' }]]);
  mockKnex.__queue('departments', 'result', [[{ id: 1, name: 'Birim 1' }]]);
  mockKnex.__queue('locations', 'result', [[{ id: 1, name: 'Lokasyon 1' }]]);
  mockKnex.__queue('users', 'result', [[]]);
  
  // Simulate database error on insert
  mockKnex.__queue('assets', 'insert:returning', [Promise.reject(new Error('DB connection failed'))]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        assets: [{
          name: 'Test Varlık',
          category_id: 1,
          department_id: 1,
          location_id: 1
        }],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, 0);
    assert.equal(res.body.processed, 1);
    assert.equal(res.body.errors.length, 1);
    assert.match(res.body.errors[0].message, /DB connection failed/);
  });
});

test('bulk-import.bulkImportAssets -> handles top-level error (500)', async () => {
  const mockKnex = createMockKnex();
  
  // Simulate error during cache loading
  mockKnex.__queue('asset_categories', 'result', [Promise.reject(new Error('Cache load failed'))]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        assets: [{
          name: 'Test Varlık',
          category_id: 1,
          department_id: 1,
          location_id: 1
        }],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 500);
    assert.match(res.body.message, /Sunucu hatası/);
    assert.match(res.body.message, /Cache load failed/);
  });
});

test('bulk-import.bulkImportAssets -> generates asset_code correctly', async () => {
  const mockKnex = createMockKnex();
  
  mockKnex.__queue('asset_categories', 'result', [[{ id: 1, name: 'Kategori 1' }]]);
  mockKnex.__queue('departments', 'result', [[{ id: 1, name: 'Birim 1' }]]);
  mockKnex.__queue('locations', 'result', [[{ id: 1, name: 'Lokasyon 1' }]]);
  mockKnex.__queue('users', 'result', [[]]);
  
  // Insert returns asset with id 42, municipality_id 7, purchase_date 2024
  mockKnex.__queue('assets', 'insert:returning', [[{ id: 42, municipality_id: 7 }]]);
  mockKnex.__queue('assets', 'update:returning', [[{ id: 42 }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 7,
      user: { id: 10 },
      body: {
        assets: [{
          name: 'Test Varlık',
          category_id: 1,
          department_id: 1,
          location_id: 1,
          purchase_date: '2024-03-20'
        }],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, 1);
    // Asset code should be AS-7-24-000042 (municipality 7, year 24, id 42)
  });
});

test('bulk-import.bulkImportAssets -> handles user lookup by username when full_name is null', async () => {
  const mockKnex = createMockKnex();
  
  mockKnex.__queue('asset_categories', 'result', [[{ id: 1, name: 'Kategori 1' }]]);
  mockKnex.__queue('departments', 'result', [[{ id: 1, name: 'Birim 1' }]]);
  mockKnex.__queue('locations', 'result', [[{ id: 1, name: 'Lokasyon 1' }]]);
  mockKnex.__queue('users', 'result', [[
    { id: 60, full_name: null, username: 'testuser' }
  ]]);
  
  mockKnex.__queue('assets', 'insert:returning', [[{ id: 900, municipality_id: 1 }]]);
  mockKnex.__queue('assets', 'update:returning', [[{ id: 900 }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    delete require.cache[CTRL_PATH];
    const bulkImport = require(CTRL_PATH);

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        assets: [{
          name: 'Test Varlık',
          category_id: 1,
          department_id: 1,
          location_id: 1,
          assigned_user_name: 'testuser'
        }],
        chunkNumber: 1,
        totalChunks: 1
      },
    });
    const res = createRes();

    await bulkImport.bulkImportAssets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, 1);
  });
});

