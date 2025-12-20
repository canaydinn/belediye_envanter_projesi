const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

const CTRL_PATH = './assets.controller';
const KNEX_PATH = require.resolve('../config/knex');
const QRCODE_PATH = require.resolve('qrcode');

function freshController() {
  delete require.cache[require.resolve(CTRL_PATH)];
  return require(CTRL_PATH);
}

// ============================================================================
// generateAssetQRCode Tests
// ============================================================================

test('assets.generateAssetQRCode -> 404 when asset not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'first', [null]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: 99 },
    });
    const res = createRes();

    await ctrl.generateAssetQRCode(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: 'Varlık bulunamadı' });
  });
});

test('assets.generateAssetQRCode -> generates QR code from asset.qrcode', async () => {
  const mockKnex = createMockKnex();
  const asset = {
    id: 5,
    qrcode: 'QR-CODE-123',
    asset_code: 'AS-1-25-000005',
    municipality_id: 1,
  };
  mockKnex.__queue('assets', 'first', [asset]);

  const mockQRCodeBuffer = Buffer.from('fake-qr-image');

  const mockQRCode = {
    toBuffer: async (data, options) => {
      assert.equal(data, 'QR-CODE-123');
      assert.equal(options.type, 'png');
      assert.equal(options.width, 300);
      return mockQRCodeBuffer;
    },
  };

  await withMockedModules(
    {
      [KNEX_PATH]: mockKnex,
      [QRCODE_PATH]: mockQRCode,
    },
    async () => {
      const ctrl = freshController();
      const req = createReq({
        tenantMunicipalityId: 1,
        params: { id: 5 },
      });
      const res = createRes();

      await ctrl.generateAssetQRCode(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body, mockQRCodeBuffer);
      assert.equal(res.headers['Content-Type'], 'image/png');
      assert.match(res.headers['Content-Disposition'], /asset-5-qr\.png/);
      assert.equal(res.headers['Cache-Control'], 'public, max-age=3600');
    }
  );
});

test('assets.generateAssetQRCode -> generates QR code from asset.asset_code when qrcode is null', async () => {
  const mockKnex = createMockKnex();
  const asset = {
    id: 5,
    qrcode: null,
    asset_code: 'AS-1-25-000005',
    municipality_id: 1,
  };
  mockKnex.__queue('assets', 'first', [asset]);

  const mockQRCodeBuffer = Buffer.from('fake-qr-image');

  const mockQRCode = {
    toBuffer: async (data, options) => {
      assert.equal(data, 'AS-1-25-000005');
      return mockQRCodeBuffer;
    },
  };

  await withMockedModules(
    {
      [KNEX_PATH]: mockKnex,
      [QRCODE_PATH]: mockQRCode,
    },
    async () => {
      const ctrl = freshController();
      const req = createReq({
        tenantMunicipalityId: 1,
        params: { id: 5 },
      });
      const res = createRes();

      await ctrl.generateAssetQRCode(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body, mockQRCodeBuffer);
    }
  );
});

test('assets.generateAssetQRCode -> uses query param data if provided', async () => {
  const mockKnex = createMockKnex();
  const asset = {
    id: 5,
    qrcode: 'QR-CODE-123',
    asset_code: 'AS-1-25-000005',
    municipality_id: 1,
  };
  mockKnex.__queue('assets', 'first', [asset]);

  const mockQRCodeBuffer = Buffer.from('fake-qr-image');

  const mockQRCode = {
    toBuffer: async (data, options) => {
      assert.equal(data, 'CUSTOM-QR-DATA');
      return mockQRCodeBuffer;
    },
  };

  await withMockedModules(
    {
      [KNEX_PATH]: mockKnex,
      [QRCODE_PATH]: mockQRCode,
    },
    async () => {
      const ctrl = freshController();
      const req = createReq({
        tenantMunicipalityId: 1,
        params: { id: 5 },
        query: { data: 'CUSTOM-QR-DATA' },
      });
      const res = createRes();

      await ctrl.generateAssetQRCode(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body, mockQRCodeBuffer);
    }
  );
});

test('assets.generateAssetQRCode -> 500 when QR code generation fails', async () => {
  const mockKnex = createMockKnex();
  const asset = {
    id: 5,
    qrcode: 'QR-CODE-123',
    asset_code: 'AS-1-25-000005',
    municipality_id: 1,
  };
  mockKnex.__queue('assets', 'first', [asset]);

  const mockQRCode = {
    toBuffer: async () => {
      throw new Error('QR generation failed');
    },
  };

  await withMockedModules(
    {
      [KNEX_PATH]: mockKnex,
      [QRCODE_PATH]: mockQRCode,
    },
    async () => {
      const ctrl = freshController();
      const req = createReq({
        tenantMunicipalityId: 1,
        params: { id: 5 },
      });
      const res = createRes();

      await ctrl.generateAssetQRCode(req, res);

      assert.equal(res.statusCode, 500);
      assert.deepEqual(res.body, { message: 'QR kod oluşturulamadı' });
    }
  );
});

test('assets.generateAssetQRCode -> 500 when DB query fails', async () => {
  const knexStub = () => ({
    where() {
      return this;
    },
    first() {
      return Promise.reject(new Error('DB error'));
    },
  });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: 5 },
    });
    const res = createRes();

    await ctrl.generateAssetQRCode(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Sunucu hatası' });
  });
});

// ============================================================================
// getAssetByQRCode Tests
// ============================================================================

test('assets.getAssetByQRCode -> 400 when code is missing', async () => {
  await withMockedModules({ [KNEX_PATH]: createMockKnex() }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      params: { code: '' },
    });
    const res = createRes();

    await ctrl.getAssetByQRCode(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: 'QR kod verisi gerekli' });
  });
});

test('assets.getAssetByQRCode -> finds asset by qrcode field', async () => {
  const mockKnex = createMockKnex();
  const asset = {
    id: 5,
    name: 'Test Asset',
    qrcode: 'QR-CODE-123',
    asset_code: 'AS-1-25-000005',
    municipality_id: 1,
  };

  const knexStub = () => ({
    leftJoin() {
      return this;
    },
    where() {
      return this;
    },
    select() {
      return this;
    },
    first: () => Promise.resolve(asset),
  });
  knexStub.raw = () => ({ __raw: 'RAW' });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      params: { code: 'QR-CODE-123' },
    });
    const res = createRes();

    await ctrl.getAssetByQRCode(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, asset);
  });
});

test('assets.getAssetByQRCode -> finds asset by asset_code field', async () => {
  const mockKnex = createMockKnex();
  const asset = {
    id: 5,
    name: 'Test Asset',
    qrcode: null,
    asset_code: 'AS-1-25-000005',
    municipality_id: 1,
  };

  const knexStub = () => ({
    leftJoin() {
      return this;
    },
    where() {
      return this;
    },
    select() {
      return this;
    },
    first: () => Promise.resolve(asset),
  });
  knexStub.raw = () => ({ __raw: 'RAW' });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      params: { code: 'AS-1-25-000005' },
    });
    const res = createRes();

    await ctrl.getAssetByQRCode(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, asset);
  });
});

test('assets.getAssetByQRCode -> finds asset by id field', async () => {
  const mockKnex = createMockKnex();
  const asset = {
    id: 5,
    name: 'Test Asset',
    qrcode: null,
    asset_code: null,
    municipality_id: 1,
  };

  const knexStub = () => ({
    leftJoin() {
      return this;
    },
    where() {
      return this;
    },
    select() {
      return this;
    },
    first: () => Promise.resolve(asset),
  });
  knexStub.raw = () => ({ __raw: 'RAW' });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      params: { code: '5' },
    });
    const res = createRes();

    await ctrl.getAssetByQRCode(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, asset);
  });
});

test('assets.getAssetByQRCode -> 404 when asset not found', async () => {
  const knexStub = () => ({
    leftJoin() {
      return this;
    },
    where() {
      return this;
    },
    select() {
      return this;
    },
    first: () => Promise.resolve(null),
  });
  knexStub.raw = () => ({ __raw: 'RAW' });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      params: { code: 'NONEXISTENT' },
    });
    const res = createRes();

    await ctrl.getAssetByQRCode(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { message: 'Bu QR kod ile eşleşen varlık bulunamadı' });
  });
});

test('assets.getAssetByQRCode -> 500 on error', async () => {
  const knexStub = () => ({
    leftJoin() {
      return this;
    },
    where() {
      return this;
    },
    select() {
      return this;
    },
    first: () => Promise.reject(new Error('DB error')),
  });
  knexStub.raw = () => ({ __raw: 'RAW' });

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      params: { code: 'TEST' },
    });
    const res = createRes();

    await ctrl.getAssetByQRCode(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Sunucu hatası' });
  });
});

// ============================================================================
// updateAsset Additional Tests (Happy Path & Edge Cases)
// ============================================================================

test('assets.updateAsset -> successfully updates asset (happy path)', async () => {
  const mockKnex = createMockKnex();
  const existing = {
    id: 10,
    municipality_id: 1,
    asset_code: 'AS-1-25-000010',
    name: 'Old Name',
    category_id: 1,
    department_id: 1,
    location_id: 1,
    assigned_user_id: null,
    purchase_price: 1000,
    status: 'active',
  };

  const updated = {
    ...existing,
    name: 'New Name',
    category_id: 2,
    department_id: 2,
    location_id: 2,
    updated_by_user_id: 99,
  };

  mockKnex.__queue('assets', 'first', [existing]);
  mockKnex.__queue('asset_categories', 'first', [{ id: 2 }]);
  mockKnex.__queue('departments', 'first', [{ id: 2 }]);
  mockKnex.__queue('locations', 'first', [{ id: 2 }]);
  mockKnex.__queue('assets', 'update:returning', [[updated]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 99 },
      params: { id: 10 },
      body: {
        name: 'New Name',
        category_id: 2,
        department_id: 2,
        location_id: 2,
      },
    });
    const res = createRes();

    await ctrl.updateAsset(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.name, 'New Name');
    assert.equal(res.body.category_id, 2);
    assert.equal(res.body.updated_by_user_id, 99);
  });
});

test('assets.updateAsset -> updates only provided fields, keeps existing for others', async () => {
  const mockKnex = createMockKnex();
  const existing = {
    id: 10,
    municipality_id: 1,
    asset_code: 'AS-1-25-000010',
    name: 'Original Name',
    description: 'Original Description',
    category_id: 1,
    department_id: 1,
    location_id: 1,
    purchase_price: 1000,
    status: 'active',
  };

  const updated = {
    ...existing,
    name: 'Updated Name',
    // description should remain 'Original Description'
  };

  mockKnex.__queue('assets', 'first', [existing]);
  mockKnex.__queue('asset_categories', 'first', [{ id: 1 }]);
  mockKnex.__queue('departments', 'first', [{ id: 1 }]);
  mockKnex.__queue('locations', 'first', [{ id: 1 }]);
  mockKnex.__queue('assets', 'update:returning', [[updated]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 99 },
      params: { id: 10 },
      body: {
        name: 'Updated Name',
        // description not provided, should keep existing
      },
    });
    const res = createRes();

    await ctrl.updateAsset(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.name, 'Updated Name');
  });
});

test('assets.updateAsset -> 500 on database error', async () => {
  const mockKnex = createMockKnex();
  const existing = {
    id: 10,
    municipality_id: 1,
    asset_code: 'AS-1-25-000010',
    category_id: 1,
    department_id: 1,
    location_id: 1,
  };

  mockKnex.__queue('assets', 'first', [existing]);
  mockKnex.__queue('asset_categories', 'first', [{ id: 1 }]);
  mockKnex.__queue('departments', 'first', [{ id: 1 }]);
  mockKnex.__queue('locations', 'first', [{ id: 1 }]);

  // Make update throw an error
  const knexStub = (table) => {
    if (table === 'assets') {
      let callCount = 0;
      return {
        where() {
          return this;
        },
        first() {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve(existing);
          }
          // This is the update call
          return {
            update() {
              return {
                returning: () => Promise.reject(new Error('Update failed')),
              };
            },
          };
        },
      };
    }
    return {
      where() {
        return this;
      },
      first() {
        return Promise.resolve({ id: 1 });
      },
    };
  };

  await withMockedModules({ [KNEX_PATH]: knexStub }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 99 },
      params: { id: 10 },
      body: { name: 'New Name' },
    });
    const res = createRes();

    await ctrl.updateAsset(req, res);

    assert.equal(res.statusCode, 500);
    assert.deepEqual(res.body, { message: 'Sunucu hatası' });
  });
});

test('assets.updateAsset -> validates assigned_user_id when provided', async () => {
  const mockKnex = createMockKnex();
  const existing = {
    id: 10,
    municipality_id: 1,
    asset_code: 'AS-1-25-000010',
    category_id: 1,
    department_id: 1,
    location_id: 1,
    assigned_user_id: null,
  };

  mockKnex.__queue('assets', 'first', [existing]);
  mockKnex.__queue('asset_categories', 'first', [{ id: 1 }]);
  mockKnex.__queue('departments', 'first', [{ id: 1 }]);
  mockKnex.__queue('locations', 'first', [{ id: 1 }]);
  mockKnex.__queue('users', 'first', [null]); // User not found or inactive

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 99 },
      params: { id: 10 },
      body: {
        assigned_user_id: 999,
      },
    });
    const res = createRes();

    await ctrl.updateAsset(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { message: 'Sorumlu kişi bu belediyeye ait değil veya pasif' });
  });
});

test('assets.updateAsset -> allows null assigned_user_id', async () => {
  const mockKnex = createMockKnex();
  const existing = {
    id: 10,
    municipality_id: 1,
    asset_code: 'AS-1-25-000010',
    category_id: 1,
    department_id: 1,
    location_id: 1,
    assigned_user_id: 5,
  };

  const updated = {
    ...existing,
    assigned_user_id: null,
  };

  mockKnex.__queue('assets', 'first', [existing]);
  mockKnex.__queue('asset_categories', 'first', [{ id: 1 }]);
  mockKnex.__queue('departments', 'first', [{ id: 1 }]);
  mockKnex.__queue('locations', 'first', [{ id: 1 }]);
  // assigned_user_id is null, so users query should not be called (validateAssetRefs checks if assigned_user_id is truthy)
  mockKnex.__queue('assets', 'update:returning', [[updated]]);

  await withMockedModules({ [KNEX_PATH]: mockKnex }, async () => {
    const ctrl = freshController();
    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 99 },
      params: { id: 10 },
      body: {
        assigned_user_id: null,
      },
    });
    const res = createRes();

    await ctrl.updateAsset(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.assigned_user_id, null);
  });
});

