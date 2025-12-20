const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

// ============================================================================
// listCategories
// ============================================================================

test('assetCategories.listCategories -> returns categories list for municipality', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'result', [[
    { id: 1, code: 'CAT1', name: 'Kategori 1', description: 'Açıklama 1' },
    { id: 2, code: 'CAT2', name: 'Kategori 2', description: 'Açıklama 2' },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
    });
    const res = createRes();

    await assetCategories.listCategories(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.length, 2);
    assert.equal(res.body[0].code, 'CAT1');
    assert.equal(res.body[1].code, 'CAT2');
  });
});

test('assetCategories.listCategories -> returns empty array when no categories', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'result', [[]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
    });
    const res = createRes();

    await assetCategories.listCategories(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.length, 0);
  });
});

test('assetCategories.listCategories -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  // Simulate DB error by not queueing any result
  mockKnex.__queue('asset_categories', 'result', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
    });
    const res = createRes();

    await assetCategories.listCategories(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// getCategoryStats
// ============================================================================

test('assetCategories.getCategoryStats -> returns stats for municipality', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [{ count: '5' }]);
  mockKnex.__queue('asset_categories', 'first', [{ count: '3' }]);
  mockKnex.__queue('asset_categories', 'first', [{ 
    id: 10, 
    name: 'En Çok Varlık', 
    code: 'MAX', 
    asset_count: '15' 
  }]);
  mockKnex.__queue('asset_categories', 'first', [{ count: '2' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
    });
    const res = createRes();

    await assetCategories.getCategoryStats(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.total_categories, 5);
    assert.equal(res.body.total_active_categories, 3);
    assert.equal(res.body.max_asset_category.id, 10);
    assert.equal(res.body.max_asset_category.asset_count, 15);
    assert.equal(res.body.total_empty_categories, 2);
  });
});

test('assetCategories.getCategoryStats -> 400 when municipality_id missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: {},
    });
    const res = createRes();

    await assetCategories.getCategoryStats(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Belediye bilgisi bulunamadı');
  });
});

test('assetCategories.getCategoryStats -> handles null max_asset_category', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [{ count: '0' }]);
  mockKnex.__queue('asset_categories', 'first', [{ count: '0' }]);
  mockKnex.__queue('asset_categories', 'first', [null]);
  mockKnex.__queue('asset_categories', 'first', [{ count: '0' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
    });
    const res = createRes();

    await assetCategories.getCategoryStats(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.max_asset_category, null);
  });
});

test('assetCategories.getCategoryStats -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
    });
    const res = createRes();

    await assetCategories.getCategoryStats(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// createCategory
// ============================================================================

test('assetCategories.createCategory -> 401 when municipality_id missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: {},
      body: { code: 'CAT1', name: 'Kategori 1' },
    });
    const res = createRes();

    await assetCategories.createCategory(req, res);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, 'Belediye doğrulaması başarısız');
  });
});

test('assetCategories.createCategory -> 400 when required fields missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      body: { code: 'CAT1' },
    });
    const res = createRes();

    await assetCategories.createCategory(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Kod ve ad alanları zorunludur');
  });
});

test('assetCategories.createCategory -> 400 when code is empty string', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      body: { code: '   ', name: 'Kategori 1' },
    });
    const res = createRes();

    await assetCategories.createCategory(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Kod ve ad alanları zorunludur');
  });
});

test('assetCategories.createCategory -> 409 when duplicate code exists', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [{ id: 1, code: 'CAT1', name: 'Existing' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      body: { code: 'CAT1', name: 'New Category' },
    });
    const res = createRes();

    await assetCategories.createCategory(req, res);
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, 'Bu kod veya ad ile kayıtlı kategori zaten mevcut');
  });
});

test('assetCategories.createCategory -> 409 when duplicate name exists', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [{ id: 1, code: 'CAT2', name: 'Existing Name' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      body: { code: 'CAT1', name: 'Existing Name' },
    });
    const res = createRes();

    await assetCategories.createCategory(req, res);
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, 'Bu kod veya ad ile kayıtlı kategori zaten mevcut');
  });
});

test('assetCategories.createCategory -> creates category successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [null]); // No duplicate
  mockKnex.__queue('asset_categories', 'insert:returning', [[{
    id: 10,
    code: 'CAT1',
    name: 'Kategori 1',
    description: 'Açıklama',
    municipality_id: 5,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      body: { code: 'CAT1', name: 'Kategori 1', description: 'Açıklama' },
    });
    const res = createRes();

    await assetCategories.createCategory(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.message, 'Kategori başarıyla oluşturuldu');
    assert.equal(res.body.category.id, 10);
    assert.equal(res.body.category.code, 'CAT1');
    assert.equal(res.body.category.name, 'Kategori 1');
  });
});

test('assetCategories.createCategory -> trims whitespace from inputs', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [null]);
  mockKnex.__queue('asset_categories', 'insert:returning', [[{
    id: 10,
    code: 'CAT1',
    name: 'Kategori 1',
    description: 'Açıklama',
    municipality_id: 5,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      body: { code: '  CAT1  ', name: '  Kategori 1  ', description: '  Açıklama  ' },
    });
    const res = createRes();

    await assetCategories.createCategory(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.category.code, 'CAT1');
    assert.equal(res.body.category.name, 'Kategori 1');
    assert.equal(res.body.category.description, 'Açıklama');
  });
});

test('assetCategories.createCategory -> sets description to null when empty', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [null]);
  mockKnex.__queue('asset_categories', 'insert:returning', [[{
    id: 10,
    code: 'CAT1',
    name: 'Kategori 1',
    description: null,
    municipality_id: 5,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      body: { code: 'CAT1', name: 'Kategori 1', description: '' },
    });
    const res = createRes();

    await assetCategories.createCategory(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.category.description, null);
  });
});

test('assetCategories.createCategory -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      body: { code: 'CAT1', name: 'Kategori 1' },
    });
    const res = createRes();

    await assetCategories.createCategory(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// getCategoryById
// ============================================================================

test('assetCategories.getCategoryById -> 400 when id missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: {},
    });
    const res = createRes();

    await assetCategories.getCategoryById(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Kategori id bilgisi zorunludur');
  });
});

test('assetCategories.getCategoryById -> 404 when category not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: { id: 999 },
    });
    const res = createRes();

    await assetCategories.getCategoryById(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Kategori bulunamadı veya bu belediyeye ait değil');
  });
});

test('assetCategories.getCategoryById -> returns category with asset count', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [{
    id: 10,
    code: 'CAT1',
    name: 'Kategori 1',
    description: 'Açıklama',
    municipality_id: 5,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
  }]);
  mockKnex.__queue('assets', 'result', [[{ count: '7' }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: { id: 10 },
    });
    const res = createRes();

    await assetCategories.getCategoryById(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.id, 10);
    assert.equal(res.body.code, 'CAT1');
    assert.equal(res.body.asset_count, 7);
  });
});

test('assetCategories.getCategoryById -> returns 0 asset_count when no assets', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [{
    id: 10,
    code: 'CAT1',
    name: 'Kategori 1',
    description: null,
    municipality_id: 5,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-01'),
  }]);
  mockKnex.__queue('assets', 'result', [[{ count: '0' }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: { id: 10 },
    });
    const res = createRes();

    await assetCategories.getCategoryById(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.asset_count, 0);
  });
});

test('assetCategories.getCategoryById -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: { id: 10 },
    });
    const res = createRes();

    await assetCategories.getCategoryById(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// updateCategory
// ============================================================================

test('assetCategories.updateCategory -> 401 when municipality_id missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: {},
      params: { id: 10 },
      body: { code: 'CAT1', name: 'Kategori 1' },
    });
    const res = createRes();

    await assetCategories.updateCategory(req, res);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.message, 'Belediye doğrulaması başarısız');
  });
});

test('assetCategories.updateCategory -> 400 when id missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: {},
      body: { code: 'CAT1', name: 'Kategori 1' },
    });
    const res = createRes();

    await assetCategories.updateCategory(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Kategori id bilgisi zorunludur');
  });
});

test('assetCategories.updateCategory -> 400 when required fields missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: { id: 10 },
      body: { code: 'CAT1' },
    });
    const res = createRes();

    await assetCategories.updateCategory(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Kod ve ad alanları zorunludur');
  });
});

test('assetCategories.updateCategory -> 404 when category not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: { id: 999 },
      body: { code: 'CAT1', name: 'Kategori 1' },
    });
    const res = createRes();

    await assetCategories.updateCategory(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Kategori bulunamadı veya bu belediyeye ait değil');
  });
});

test('assetCategories.updateCategory -> 409 when duplicate code exists', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [{ id: 10, code: 'OLD', name: 'Old Name' }]);
  mockKnex.__queue('asset_categories', 'first', [{ id: 20, code: 'CAT1', name: 'Other' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: { id: 10 },
      body: { code: 'CAT1', name: 'New Name' },
    });
    const res = createRes();

    await assetCategories.updateCategory(req, res);
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, 'Bu kod veya ad ile kayıtlı kategori zaten mevcut');
  });
});

test('assetCategories.updateCategory -> 409 when duplicate name exists', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [{ id: 10, code: 'OLD', name: 'Old Name' }]);
  mockKnex.__queue('asset_categories', 'first', [{ id: 20, code: 'OTHER', name: 'New Name' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: { id: 10 },
      body: { code: 'NEW', name: 'New Name' },
    });
    const res = createRes();

    await assetCategories.updateCategory(req, res);
    assert.equal(res.statusCode, 409);
    assert.equal(res.body.message, 'Bu kod veya ad ile kayıtlı kategori zaten mevcut');
  });
});

test('assetCategories.updateCategory -> updates category successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [{ id: 10, code: 'OLD', name: 'Old Name' }]);
  mockKnex.__queue('asset_categories', 'first', [null]); // No duplicate
  mockKnex.__queue('asset_categories', 'update:returning', [[{
    id: 10,
    code: 'NEW',
    name: 'New Name',
    description: 'New Description',
    municipality_id: 5,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-02'),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: { id: 10 },
      body: { code: 'NEW', name: 'New Name', description: 'New Description' },
    });
    const res = createRes();

    await assetCategories.updateCategory(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'Kategori başarıyla güncellendi');
    assert.equal(res.body.category.id, 10);
    assert.equal(res.body.category.code, 'NEW');
    assert.equal(res.body.category.name, 'New Name');
  });
});

test('assetCategories.updateCategory -> skips duplicate check when code and name unchanged', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [{ id: 10, code: 'CAT1', name: 'Kategori 1' }]);
  // No duplicate check query should be made
  mockKnex.__queue('asset_categories', 'update:returning', [[{
    id: 10,
    code: 'CAT1',
    name: 'Kategori 1',
    description: 'Updated Description',
    municipality_id: 5,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-02'),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: { id: 10 },
      body: { code: 'CAT1', name: 'Kategori 1', description: 'Updated Description' },
    });
    const res = createRes();

    await assetCategories.updateCategory(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'Kategori başarıyla güncellendi');
  });
});

test('assetCategories.updateCategory -> trims whitespace from inputs', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [{ id: 10, code: 'OLD', name: 'Old' }]);
  mockKnex.__queue('asset_categories', 'first', [null]);
  mockKnex.__queue('asset_categories', 'update:returning', [[{
    id: 10,
    code: 'NEW',
    name: 'New',
    description: 'Desc',
    municipality_id: 5,
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-02'),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: { id: 10 },
      body: { code: '  NEW  ', name: '  New  ', description: '  Desc  ' },
    });
    const res = createRes();

    await assetCategories.updateCategory(req, res);
    assert.equal(res.statusCode, 200);
    const builder = mockKnex('asset_categories');
    assert.equal(builder._state.lastUpdate.code, 'NEW');
    assert.equal(builder._state.lastUpdate.name, 'New');
    assert.equal(builder._state.lastUpdate.description, 'Desc');
  });
});

test('assetCategories.updateCategory -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: { id: 10 },
      body: { code: 'CAT1', name: 'Kategori 1' },
    });
    const res = createRes();

    await assetCategories.updateCategory(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// getCategoryDistribution
// ============================================================================

test('assetCategories.getCategoryDistribution -> returns normalized distribution', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'result', [[
    { id: 1, name: 'Kategori A', code: 'CAT_A', asset_count: '5' },
    { id: 2, name: 'Kategori B', code: 'CAT_B', asset_count: '3' },
    { id: 3, name: 'Kategori C', code: 'CAT_C', asset_count: '0' },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
    });
    const res = createRes();

    await assetCategories.getCategoryDistribution(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.length, 3);
    assert.equal(res.body[0].id, 1);
    assert.equal(res.body[0].asset_count, 5);
    assert.equal(res.body[2].asset_count, 0);
  });
});

test('assetCategories.getCategoryDistribution -> returns empty array when no categories', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'result', [[]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
    });
    const res = createRes();

    await assetCategories.getCategoryDistribution(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.length, 0);
  });
});

test('assetCategories.getCategoryDistribution -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'result', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
    });
    const res = createRes();

    await assetCategories.getCategoryDistribution(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// deleteCategory
// ============================================================================

test('assetCategories.deleteCategory -> 400 when id missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: {},
    });
    const res = createRes();

    await assetCategories.deleteCategory(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Kategori id bilgisi zorunludur');
  });
});

test('assetCategories.deleteCategory -> 404 when category not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: { id: 999 },
    });
    const res = createRes();

    await assetCategories.deleteCategory(req, res);
    assert.equal(res.statusCode, 404);
    assert.equal(res.body.message, 'Kategori bulunamadı veya bu belediyeye ait değil');
  });
});

test('assetCategories.deleteCategory -> 400 when category has linked assets', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [{ id: 10, code: 'CAT1', name: 'Kategori 1' }]);
  mockKnex.__queue('assets', 'result', [[{ count: '5' }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: { id: 10 },
    });
    const res = createRes();

    await assetCategories.deleteCategory(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.message, 'Kategori bağlı varlıklar bulunduğu için silinemez');
  });
});

test('assetCategories.deleteCategory -> deletes category successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [{ id: 10, code: 'CAT1', name: 'Kategori 1' }]);
  mockKnex.__queue('assets', 'result', [[{ count: '0' }]]);
  mockKnex.__queue('asset_categories', 'del', [1]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: { id: 10 },
    });
    const res = createRes();

    await assetCategories.deleteCategory(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'Kategori başarıyla silindi');
  });
});

test('assetCategories.deleteCategory -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('asset_categories', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./assetCategories.controller')];
    const assetCategories = require('./assetCategories.controller');

    const req = createReq({
      user: { municipality_id: 5 },
      params: { id: 10 },
    });
    const res = createRes();

    await assetCategories.deleteCategory(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

