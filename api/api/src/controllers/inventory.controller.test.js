const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

const CTRL_PATH = './inventory.controller';
const KNEX_PATH = require.resolve('../config/knex');

function freshController() {
  delete require.cache[require.resolve(CTRL_PATH)];
  return require(CTRL_PATH);
}

// ============================================================================
// createInventoryItem tests
// ============================================================================

test('inventory.controller.createInventoryItem -> 403 when tenantMunicipalityId missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      body: { name: 'Test Item', assetTag: 'TAG-001' },
    });
    const res = createRes();

    await inventory.createInventoryItem(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Belediye kapsamı bulunamadı/);
  });
});

test('inventory.controller.createInventoryItem -> 400 when name missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      body: { assetTag: 'TAG-001' },
    });
    const res = createRes();

    await inventory.createInventoryItem(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'VALIDATION_ERROR');
    assert.match(res.body.message, /zorunludur/);
  });
});

test('inventory.controller.createInventoryItem -> 400 when assetTag missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      body: { name: 'Test Item' },
    });
    const res = createRes();

    await inventory.createInventoryItem(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'VALIDATION_ERROR');
    assert.match(res.body.message, /zorunludur/);
  });
});

test('inventory.controller.createInventoryItem -> 400 when invalid status', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      body: { name: 'Test Item', assetTag: 'TAG-001', status: 'invalid_status' },
    });
    const res = createRes();

    await inventory.createInventoryItem(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'VALIDATION_ERROR');
    assert.match(res.body.message, /Geçersiz status/);
  });
});

test('inventory.controller.createInventoryItem -> 400 when department does not belong to tenant', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [null]); // Department not found

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      body: { name: 'Test Item', assetTag: 'TAG-001', departmentId: 999 },
    });
    const res = createRes();

    await inventory.createInventoryItem(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Departman bu belediyeye ait değil/);
  });
});

test('inventory.controller.createInventoryItem -> 400 when location does not belong to tenant', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [{ id: 1 }]); // Department exists
  mockKnex.__queue('locations', 'first', [null]); // Location not found

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      body: { name: 'Test Item', assetTag: 'TAG-001', locationId: 999 },
    });
    const res = createRes();

    await inventory.createInventoryItem(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Lokasyon bu belediyeye ait değil/);
  });
});

test('inventory.controller.createInventoryItem -> 409 when assetTag already exists', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [{ id: 1 }]);
  mockKnex.__queue('locations', 'first', [{ id: 1 }]);
  mockKnex.__queue('inventory_items', 'first', [{ id: 1, asset_tag: 'TAG-001' }]); // Already exists

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      body: { name: 'Test Item', assetTag: 'TAG-001' },
    });
    const res = createRes();

    await inventory.createInventoryItem(req, res);
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.error, 'VALIDATION_ERROR');
    assert.match(res.body.message, /zaten kullanılıyor/);
  });
});

test('inventory.controller.createInventoryItem -> 201 success with all fields', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('departments', 'first', [{ id: 1 }]);
  mockKnex.__queue('locations', 'first', [{ id: 1 }]);
  mockKnex.__queue('inventory_items', 'first', [null]); // No existing item
  mockKnex.__queue('inventory_items', 'insert:returning', [[{
    id: 1,
    municipality_id: 1,
    name: 'Test Item',
    category: 'Electronics',
    serial_number: 'SN-123',
    asset_tag: 'TAG-001',
    department_id: 1,
    location_id: 1,
    purchase_date: '2025-01-01',
    status: 'active',
    value: 1000,
    description: 'Test description',
    created_at: new Date('2025-01-01T00:00:00.000Z'),
    updated_at: new Date('2025-01-01T00:00:00.000Z'),
  }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      body: {
        name: 'Test Item',
        category: 'Electronics',
        serialNumber: 'SN-123',
        assetTag: 'TAG-001',
        departmentId: 1,
        locationId: 1,
        purchaseDate: '2025-01-01',
        status: 'active',
        value: 1000,
        description: 'Test description',
      },
    });
    const res = createRes();

    await inventory.createInventoryItem(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.id, 1);
    assert.equal(res.body.name, 'Test Item');
    assert.equal(res.body.asset_tag, 'TAG-001');
  });
});

test('inventory.controller.createInventoryItem -> 201 success with minimal fields', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [null]); // No existing item
  mockKnex.__queue('inventory_items', 'insert:returning', [[{
    id: 2,
    municipality_id: 1,
    name: 'Minimal Item',
    category: null,
    serial_number: null,
    asset_tag: 'TAG-002',
    department_id: null,
    location_id: null,
    purchase_date: null,
    status: 'active',
    value: null,
    description: null,
    created_at: new Date('2025-01-01T00:00:00.000Z'),
    updated_at: new Date('2025-01-01T00:00:00.000Z'),
  }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      body: {
        name: 'Minimal Item',
        assetTag: 'TAG-002',
      },
    });
    const res = createRes();

    await inventory.createInventoryItem(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.id, 2);
    assert.equal(res.body.status, 'active'); // Default status
  });
});

// ============================================================================
// listInventory tests
// ============================================================================

test('inventory.controller.listInventory -> 403 when tenantMunicipalityId missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({ query: {} });
    const res = createRes();

    await inventory.listInventory(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Belediye kapsamı bulunamadı/);
  });
});

test('inventory.controller.listInventory -> 200 with default pagination', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'result', [[
    { id: 1, name: 'Item 1', asset_tag: 'TAG-001' },
    { id: 2, name: 'Item 2', asset_tag: 'TAG-002' },
  ]]);
  mockKnex.__queue('inventory_items', 'first', [{ total: '2' }]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      query: {},
    });
    const res = createRes();

    await inventory.listInventory(req, res);
    assert.equal(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.pagination.page, 1);
    assert.equal(res.body.pagination.limit, 10);
    assert.equal(res.body.pagination.total, 2);
  });
});

test('inventory.controller.listInventory -> 200 with custom pagination', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'result', [[
    { id: 1, name: 'Item 1', asset_tag: 'TAG-001' },
  ]]);
  mockKnex.__queue('inventory_items', 'first', [{ total: '5' }]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { page: '2', limit: '2' },
    });
    const res = createRes();

    await inventory.listInventory(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.pagination.page, 2);
    assert.equal(res.body.pagination.limit, 2);
    assert.equal(res.body.pagination.total, 5);
  });
});

test('inventory.controller.listInventory -> 200 with departmentId filter', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'result', [[
    { id: 1, name: 'Item 1', asset_tag: 'TAG-001', department_id: 1 },
  ]]);
  mockKnex.__queue('inventory_items', 'first', [{ total: '1' }]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { departmentId: '1' },
    });
    const res = createRes();

    await inventory.listInventory(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 1);
  });
});

test('inventory.controller.listInventory -> 200 with locationId filter', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'result', [[
    { id: 1, name: 'Item 1', asset_tag: 'TAG-001', location_id: 1 },
  ]]);
  mockKnex.__queue('inventory_items', 'first', [{ total: '1' }]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { locationId: '1' },
    });
    const res = createRes();

    await inventory.listInventory(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 1);
  });
});

test('inventory.controller.listInventory -> 200 with status filter', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'result', [[
    { id: 1, name: 'Item 1', asset_tag: 'TAG-001', status: 'active' },
  ]]);
  mockKnex.__queue('inventory_items', 'first', [{ total: '1' }]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { status: 'active' },
    });
    const res = createRes();

    await inventory.listInventory(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 1);
  });
});

test('inventory.controller.listInventory -> 200 with search filter', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'result', [[
    { id: 1, name: 'Test Item', asset_tag: 'TAG-001', serial_number: 'SN-123' },
  ]]);
  mockKnex.__queue('inventory_items', 'first', [{ total: '1' }]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { search: 'Test' },
    });
    const res = createRes();

    await inventory.listInventory(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 1);
  });
});

test('inventory.controller.listInventory -> pagination limit capped at 100', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'result', [[]]);
  mockKnex.__queue('inventory_items', 'first', [{ total: '0' }]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { limit: '200' },
    });
    const res = createRes();

    await inventory.listInventory(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.pagination.limit, 100); // Capped at 100
  });
});

// ============================================================================
// getInventoryById tests
// ============================================================================

test('inventory.controller.getInventoryById -> 403 when tenantMunicipalityId missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({ params: { id: '1' } });
    const res = createRes();

    await inventory.getInventoryById(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Belediye kapsamı bulunamadı/);
  });
});

test('inventory.controller.getInventoryById -> 400 when invalid ID', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: 'invalid' },
    });
    const res = createRes();

    await inventory.getInventoryById(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Geçersiz envanter ID/);
  });
});

test('inventory.controller.getInventoryById -> 404 when not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [null]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '999' },
    });
    const res = createRes();

    await inventory.getInventoryById(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.error, 'INVENTORY_NOT_FOUND');
    assert.match(res.body.message, /bulunamadı/);
  });
});

test('inventory.controller.getInventoryById -> 200 success', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [{
    id: 1,
    municipality_id: 1,
    name: 'Test Item',
    asset_tag: 'TAG-001',
    status: 'active',
  }]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '1' },
    });
    const res = createRes();

    await inventory.getInventoryById(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.id, 1);
    assert.equal(res.body.name, 'Test Item');
  });
});

// ============================================================================
// updateInventory tests
// ============================================================================

test('inventory.controller.updateInventory -> 403 when tenantMunicipalityId missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      params: { id: '1' },
      body: { name: 'Updated Name' },
    });
    const res = createRes();

    await inventory.updateInventory(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Belediye kapsamı bulunamadı/);
  });
});

test('inventory.controller.updateInventory -> 400 when invalid ID', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: 'invalid' },
      body: { name: 'Updated Name' },
    });
    const res = createRes();

    await inventory.updateInventory(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Geçersiz envanter ID/);
  });
});

test('inventory.controller.updateInventory -> 404 when not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [null]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '999' },
      body: { name: 'Updated Name' },
    });
    const res = createRes();

    await inventory.updateInventory(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.error, 'INVENTORY_NOT_FOUND');
  });
});

test('inventory.controller.updateInventory -> 400 when no fields to update', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [{ id: 1 }]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '1' },
      body: {},
    });
    const res = createRes();

    await inventory.updateInventory(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Güncellenecek alan bulunamadı/);
  });
});

test('inventory.controller.updateInventory -> 400 when assetTag is empty', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [{ id: 1 }]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '1' },
      body: { assetTag: '' },
    });
    const res = createRes();

    await inventory.updateInventory(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /boş olamaz/);
  });
});

test('inventory.controller.updateInventory -> 409 when assetTag conflicts', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [{ id: 1, asset_tag: 'TAG-001' }]);
  mockKnex.__queue('inventory_items', 'first', [{ id: 2, asset_tag: 'TAG-002' }]); // Conflict

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '1' },
      body: { assetTag: 'TAG-002' },
    });
    const res = createRes();

    await inventory.updateInventory(req, res);
    assert.equal(res.statusCode, 409);
    assert.match(res.body.message, /zaten kullanılıyor/);
  });
});

test('inventory.controller.updateInventory -> 400 when invalid status', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [{ id: 1 }]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '1' },
      body: { status: 'invalid_status' },
    });
    const res = createRes();

    await inventory.updateInventory(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Geçersiz status/);
  });
});

test('inventory.controller.updateInventory -> 400 when department does not belong to tenant', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [{ id: 1 }]);
  mockKnex.__queue('departments', 'first', [null]); // Department not found

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '1' },
      body: { departmentId: 999 },
    });
    const res = createRes();

    await inventory.updateInventory(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Departman bu belediyeye ait değil/);
  });
});

test('inventory.controller.updateInventory -> 400 when location does not belong to tenant', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [{ id: 1 }]);
  mockKnex.__queue('locations', 'first', [null]); // Location not found

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '1' },
      body: { locationId: 999 },
    });
    const res = createRes();

    await inventory.updateInventory(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Lokasyon bu belediyeye ait değil/);
  });
});

test('inventory.controller.updateInventory -> 200 success with all fields', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [{ id: 1, asset_tag: 'TAG-001' }]);
  mockKnex.__queue('inventory_items', 'first', [null]); // No conflict
  mockKnex.__queue('departments', 'first', [{ id: 1 }]);
  mockKnex.__queue('locations', 'first', [{ id: 1 }]);
  mockKnex.__queue('inventory_items', 'update:returning', [[{
    id: 1,
    municipality_id: 1,
    name: 'Updated Item',
    category: 'Updated Category',
    serial_number: 'SN-456',
    asset_tag: 'TAG-002',
    department_id: 1,
    location_id: 1,
    purchase_date: '2025-02-01',
    status: 'in_maintenance',
    value: 2000,
    description: 'Updated description',
    updated_at: new Date('2025-01-02T00:00:00.000Z'),
  }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '1' },
      body: {
        name: 'Updated Item',
        category: 'Updated Category',
        serialNumber: 'SN-456',
        assetTag: 'TAG-002',
        departmentId: 1,
        locationId: 1,
        purchaseDate: '2025-02-01',
        status: 'in_maintenance',
        value: 2000,
        description: 'Updated description',
      },
    });
    const res = createRes();

    await inventory.updateInventory(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.id, 1);
    assert.equal(res.body.name, 'Updated Item');
    assert.equal(res.body.asset_tag, 'TAG-002');
  });
});

test('inventory.controller.updateInventory -> 200 success with partial update', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [{ id: 1 }]);
  mockKnex.__queue('inventory_items', 'update:returning', [[{
    id: 1,
    name: 'Updated Name Only',
    status: 'active',
  }]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '1' },
      body: { name: 'Updated Name Only' },
    });
    const res = createRes();

    await inventory.updateInventory(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.name, 'Updated Name Only');
  });
});

// ============================================================================
// deleteInventory tests
// ============================================================================

test('inventory.controller.deleteInventory -> 403 when tenantMunicipalityId missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({ params: { id: '1' } });
    const res = createRes();

    await inventory.deleteInventory(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Belediye kapsamı bulunamadı/);
  });
});

test('inventory.controller.deleteInventory -> 400 when invalid ID', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: 'invalid' },
    });
    const res = createRes();

    await inventory.deleteInventory(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Geçersiz envanter ID/);
  });
});

test('inventory.controller.deleteInventory -> 404 when not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'del', [0]); // No rows deleted

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '999' },
    });
    const res = createRes();

    await inventory.deleteInventory(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.error, 'INVENTORY_NOT_FOUND');
  });
});

test('inventory.controller.deleteInventory -> 204 success', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'del', [1]); // One row deleted

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const inventory = freshController();

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '1' },
    });
    const res = createRes();

    await inventory.deleteInventory(req, res);
    assert.equal(res.statusCode, 204);
    assert.equal(res.body, undefined);
  });
});

