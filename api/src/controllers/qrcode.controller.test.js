const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

// ============================================================================
// generateInventoryQrCode
// ============================================================================

test('qrcode.generateInventoryQrCode -> 400 when id is not a valid integer', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      qrcode: {
        toFileStream: () => {},
      },
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.controller')];
      const qrcode = require('./qrcode.controller');

      const req = createReq({
        params: { id: 'invalid' },
      });
      const res = createRes();

      await qrcode.generateInventoryQrCode(req, res);
      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'VALIDATION_ERROR');
      assert.match(res.body.message, /Geçersiz envanter ID/);
    }
  );
});

test('qrcode.generateInventoryQrCode -> 404 when inventory not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [null]);

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      qrcode: {
        toFileStream: () => {},
      },
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.controller')];
      const qrcode = require('./qrcode.controller');

      const req = createReq({
        params: { id: '123' },
      });
      const res = createRes();

      await qrcode.generateInventoryQrCode(req, res);
      assert.equal(res.statusCode, 404);
      assert.equal(res.body.error, 'INVENTORY_NOT_FOUND');
      assert.match(res.body.message, /Envanter bulunamadı/);
    }
  );
});

test('qrcode.generateInventoryQrCode -> 200 when inventory found, sets headers and generates QR', async () => {
  const mockItem = {
    id: 123,
    asset_tag: 'ASSET-001',
    serial_number: 'SN-123',
    name: 'Test Asset',
  };

  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [mockItem]);

  let toFileStreamCalled = false;
  let toFileStreamArgs = null;
  const mockQRCode = {
    toFileStream: (stream, text) => {
      toFileStreamCalled = true;
      toFileStreamArgs = { stream, text };
      // Simulate stream write
      if (stream && typeof stream.write === 'function') {
        stream.write('fake-qr-data');
        stream.end();
      }
    },
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      qrcode: mockQRCode,
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.controller')];
      const qrcode = require('./qrcode.controller');

      const req = createReq({
        params: { id: '123' },
      });
      const res = createRes();

      // Add write and end methods to res for stream simulation
      res.write = (chunk) => {
        res._streamData = (res._streamData || '') + chunk;
      };
      res.end = () => {
        res._streamEnded = true;
      };

      await qrcode.generateInventoryQrCode(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['Content-Type'], 'image/png');
      assert.match(
        res.headers['Content-Disposition'],
        /inline; filename="123_qr.png"/
      );
      assert.equal(toFileStreamCalled, true);
      assert.equal(toFileStreamArgs.text, 'ASSET-001');
    }
  );
});

test('qrcode.generateInventoryQrCode -> uses id when asset_tag is missing', async () => {
  const mockItem = {
    id: 123,
    serial_number: 'SN-123',
    name: 'Test Asset',
  };

  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [mockItem]);

  let toFileStreamText = null;
  const mockQRCode = {
    toFileStream: (stream, text) => {
      toFileStreamText = text;
      if (stream && typeof stream.end === 'function') {
        stream.end();
      }
    },
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      qrcode: mockQRCode,
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.controller')];
      const qrcode = require('./qrcode.controller');

      const req = createReq({
        params: { id: '123' },
      });
      const res = createRes();
      res.end = () => {};

      await qrcode.generateInventoryQrCode(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(toFileStreamText, '123');
    }
  );
});

test('qrcode.generateInventoryQrCode -> 500 on error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [Promise.reject(new Error('Database error'))]);

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      qrcode: {
        toFileStream: () => {},
      },
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.controller')];
      const qrcode = require('./qrcode.controller');

      const req = createReq({
        params: { id: '123' },
      });
      const res = createRes();

      await qrcode.generateInventoryQrCode(req, res);
      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
      assert.match(res.body.message, /QR kod üretilirken bir hata oluştu/);
    }
  );
});

// ============================================================================
// generateBatchQrCodes
// ============================================================================

test('qrcode.generateBatchQrCodes -> 400 when inventoryIds is not array', async () => {
  await withMockedModules({}, async () => {
    delete require.cache[require.resolve('./qrcode.controller')];
    const qrcode = require('./qrcode.controller');

    const req = createReq({
      body: { inventoryIds: 'not-an-array' },
    });
    const res = createRes();

    await qrcode.generateBatchQrCodes(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'VALIDATION_ERROR');
    assert.match(res.body.message, /En az bir envanter ID gönderilmelidir/);
  });
});

test('qrcode.generateBatchQrCodes -> 400 when inventoryIds is empty array', async () => {
  await withMockedModules({}, async () => {
    delete require.cache[require.resolve('./qrcode.controller')];
    const qrcode = require('./qrcode.controller');

    const req = createReq({
      body: { inventoryIds: [] },
    });
    const res = createRes();

    await qrcode.generateBatchQrCodes(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'VALIDATION_ERROR');
    assert.match(res.body.message, /En az bir envanter ID gönderilmelidir/);
  });
});

test('qrcode.generateBatchQrCodes -> 400 when inventoryIds is missing', async () => {
  await withMockedModules({}, async () => {
    delete require.cache[require.resolve('./qrcode.controller')];
    const qrcode = require('./qrcode.controller');

    const req = createReq({
      body: {},
    });
    const res = createRes();

    await qrcode.generateBatchQrCodes(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'VALIDATION_ERROR');
    assert.match(res.body.message, /En az bir envanter ID gönderilmelidir/);
  });
});

test('qrcode.generateBatchQrCodes -> 403 when municipalityId missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      qrcode: {
        toBuffer: async () => Buffer.from('fake-qr-data'),
      },
      jszip: {
        __esModule: true,
        default: class {
          file() {}
          async generateAsync() {
            return Buffer.from('fake-zip-data');
          }
        },
      },
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.controller')];
      const qrcode = require('./qrcode.controller');

      const req = createReq({
        body: { inventoryIds: [1, 2, 3] },
      });
      const res = createRes();

      await qrcode.generateBatchQrCodes(req, res);
      assert.equal(res.statusCode, 403);
      assert.equal(res.body.error, 'FORBIDDEN');
    }
  );
});

test('qrcode.generateBatchQrCodes -> 200 when valid array provided, returns ZIP file', async () => {
  const mockItems = [
    { id: 1, asset_tag: 'TAG-001', name: 'Item 1' },
    { id: 2, asset_tag: 'TAG-002', name: 'Item 2' },
  ];

  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'whereIn', [mockKnex]);
  mockKnex.__queue('inventory_items', 'where', [mockKnex]);
  mockKnex.__queue('inventory_items', 'select', [mockKnex]);
  mockKnex.__queue('inventory_items', 'then', [mockItems]);

  let zipBuffer = null;
  const mockJSZip = class {
    file() {}
    async generateAsync() {
      zipBuffer = Buffer.from('fake-zip-data');
      return zipBuffer;
    }
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      qrcode: {
        toBuffer: async () => Buffer.from('fake-qr-data'),
      },
      jszip: {
        __esModule: true,
        default: mockJSZip,
      },
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.controller')];
      const qrcode = require('./qrcode.controller');

      const req = createReq({
        tenantMunicipalityId: 1,
        body: { inventoryIds: [1, 2] },
      });
      const res = createRes();
      let sentData = null;
      res.send = (data) => {
        sentData = data;
      };

      await qrcode.generateBatchQrCodes(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.headers['Content-Type'], 'application/zip');
      assert.match(res.headers['Content-Disposition'], /attachment; filename="qrcodes_batch_.*\.zip"/);
      assert.ok(sentData instanceof Buffer, 'Should send ZIP buffer');
    }
  );
});

test('qrcode.generateBatchQrCodes -> 404 when no items found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'whereIn', [mockKnex]);
  mockKnex.__queue('inventory_items', 'where', [mockKnex]);
  mockKnex.__queue('inventory_items', 'select', [mockKnex]);
  mockKnex.__queue('inventory_items', 'then', [[]]);

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.controller')];
      const qrcode = require('./qrcode.controller');

      const req = createReq({
        tenantMunicipalityId: 1,
        body: { inventoryIds: [999] },
      });
      const res = createRes();

      await qrcode.generateBatchQrCodes(req, res);
      assert.equal(res.statusCode, 404);
      assert.equal(res.body.error, 'INVENTORY_NOT_FOUND');
    }
  );
});

test('qrcode.generateBatchQrCodes -> 500 on error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'whereIn', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.controller')];
      const qrcode = require('./qrcode.controller');

      const req = createReq({
        tenantMunicipalityId: 1,
        body: { inventoryIds: [1, 2, 3] },
      });
      const res = createRes();

      await qrcode.generateBatchQrCodes(req, res);
      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
    }
  );
});

// ============================================================================
// scanCodeAndResolveInventory
// ============================================================================

test('qrcode.scanCodeAndResolveInventory -> 400 when code is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.controller')];
      const qrcode = require('./qrcode.controller');

      const req = createReq({
        body: {},
      });
      const res = createRes();

      await qrcode.scanCodeAndResolveInventory(req, res);
      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'VALIDATION_ERROR');
      assert.match(res.body.message, /code alanı zorunludur/);
    }
  );
});

test('qrcode.scanCodeAndResolveInventory -> 400 when code is empty string', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.controller')];
      const qrcode = require('./qrcode.controller');

      const req = createReq({
        body: { code: '' },
      });
      const res = createRes();

      await qrcode.scanCodeAndResolveInventory(req, res);
      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'VALIDATION_ERROR');
      assert.match(res.body.message, /code alanı zorunludur/);
    }
  );
});

test('qrcode.scanCodeAndResolveInventory -> 404 when inventory not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [null]);

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.controller')];
      const qrcode = require('./qrcode.controller');

      const req = createReq({
        body: { code: 'ASSET-001' },
      });
      const res = createRes();

      await qrcode.scanCodeAndResolveInventory(req, res);
      assert.equal(res.statusCode, 404);
      assert.equal(res.body.error, 'INVENTORY_NOT_FOUND');
      assert.match(res.body.message, /Bu QR kod ile eşleşen envanter bulunamadı/);
    }
  );
});

test('qrcode.scanCodeAndResolveInventory -> 200 when inventory found by asset_tag', async () => {
  const mockItem = {
    id: 123,
    asset_tag: 'ASSET-001',
    serial_number: 'SN-123',
    name: 'Test Asset',
  };

  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [mockItem]);

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.controller')];
      const qrcode = require('./qrcode.controller');

      const req = createReq({
        body: { code: 'ASSET-001' },
      });
      const res = createRes();

      await qrcode.scanCodeAndResolveInventory(req, res);
      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.body.inventory, mockItem);
    }
  );
});

test('qrcode.scanCodeAndResolveInventory -> 200 when inventory found by serial_number', async () => {
  const mockItem = {
    id: 123,
    asset_tag: 'ASSET-001',
    serial_number: 'SN-123',
    name: 'Test Asset',
  };

  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [mockItem]);

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.controller')];
      const qrcode = require('./qrcode.controller');

      const req = createReq({
        body: { code: 'SN-123' },
      });
      const res = createRes();

      await qrcode.scanCodeAndResolveInventory(req, res);
      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.body.inventory, mockItem);
    }
  );
});

test('qrcode.scanCodeAndResolveInventory -> 500 on error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('inventory_items', 'first', [Promise.reject(new Error('Database error'))]);

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.controller')];
      const qrcode = require('./qrcode.controller');

      const req = createReq({
        body: { code: 'ASSET-001' },
      });
      const res = createRes();

      await qrcode.scanCodeAndResolveInventory(req, res);
      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
      assert.match(res.body.message, /Kod çözülürken bir hata oluştu/);
    }
  );
});

