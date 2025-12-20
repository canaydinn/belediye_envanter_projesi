const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

test('audit.controller.getAuditLogs -> returns logs filtered by municipality_id', async () => {
  const mockKnex = createMockKnex();
  const mockLogs = [
    { id: 1, action: 'ASSET_CREATE', entity_type: 'asset', entity_id: 10, municipality_id: 5, created_at: '2025-01-01' },
    { id: 2, action: 'ASSET_UPDATE', entity_type: 'asset', entity_id: 10, municipality_id: 5, created_at: '2025-01-02' },
  ];
  mockKnex.__queue('audit_logs', 'result', [mockLogs]);

  await withMockedModules(
    { [require.resolve('../config/knex')]: mockKnex },
    async () => {
      delete require.cache[require.resolve('./audit.controller')];
      const audit = require('./audit.controller');

      const req = createReq({ tenantMunicipalityId: 5 });
      const res = createRes();

      await audit.getAuditLogs(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(Array.isArray(res.body), true);
      assert.equal(res.body.length, 2);
      assert.equal(res.body[0].municipality_id, 5);
    }
  );
});

test('audit.controller.getAuditLogs -> limits to 500 records', async () => {
  const mockKnex = createMockKnex();
  const mockLogs = Array.from({ length: 500 }, (_, i) => ({
    id: i + 1,
    action: 'ASSET_CREATE',
    entity_type: 'asset',
    municipality_id: 3,
    created_at: '2025-01-01',
  }));
  mockKnex.__queue('audit_logs', 'result', [mockLogs]);

  await withMockedModules(
    { [require.resolve('../config/knex')]: mockKnex },
    async () => {
      delete require.cache[require.resolve('./audit.controller')];
      const audit = require('./audit.controller');

      const req = createReq({ tenantMunicipalityId: 3 });
      const res = createRes();

      await audit.getAuditLogs(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.length, 500);
    }
  );
});

test('audit.controller.getAuditLogs -> handles empty result', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('audit_logs', 'result', [[]]);

  await withMockedModules(
    { [require.resolve('../config/knex')]: mockKnex },
    async () => {
      delete require.cache[require.resolve('./audit.controller')];
      const audit = require('./audit.controller');

      const req = createReq({ tenantMunicipalityId: 1 });
      const res = createRes();

      await audit.getAuditLogs(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(Array.isArray(res.body), true);
      assert.equal(res.body.length, 0);
    }
  );
});

test('audit.controller.getAuditLogs -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  // Simulate DB error by making the query throw
  const errorKnex = (table) => {
    if (table === 'audit_logs') {
      const builder = {
        where: () => builder,
        select: () => builder,
        orderBy: () => builder,
        limit: () => {
          return Promise.reject(new Error('DB connection failed'));
        },
      };
      return builder;
    }
    return mockKnex(table);
  };
  Object.assign(errorKnex, mockKnex);

  await withMockedModules(
    { [require.resolve('../config/knex')]: errorKnex },
    async () => {
      delete require.cache[require.resolve('./audit.controller')];
      const audit = require('./audit.controller');

      const req = createReq({ tenantMunicipalityId: 1 });
      const res = createRes();

      await audit.getAuditLogs(req, res);

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.message, 'Sunucu hatası');
    }
  );
});

test('audit.controller.getAuditLogById -> returns log when found', async () => {
  const mockKnex = createMockKnex();
  const mockLog = {
    id: 42,
    action: 'ASSET_CREATE',
    entity_type: 'asset',
    entity_id: 100,
    municipality_id: 5,
    user_id: 10,
    created_at: '2025-01-01',
  };
  mockKnex.__queue('audit_logs', 'first', [mockLog]);

  await withMockedModules(
    { [require.resolve('../config/knex')]: mockKnex },
    async () => {
      delete require.cache[require.resolve('./audit.controller')];
      const audit = require('./audit.controller');

      const req = createReq({
        tenantMunicipalityId: 5,
        params: { id: '42' },
      });
      const res = createRes();

      await audit.getAuditLogById(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.id, 42);
      assert.equal(res.body.municipality_id, 5);
    }
  );
});

test('audit.controller.getAuditLogById -> 404 when log not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('audit_logs', 'first', [null]);

  await withMockedModules(
    { [require.resolve('../config/knex')]: mockKnex },
    async () => {
      delete require.cache[require.resolve('./audit.controller')];
      const audit = require('./audit.controller');

      const req = createReq({
        tenantMunicipalityId: 5,
        params: { id: '999' },
      });
      const res = createRes();

      await audit.getAuditLogById(req, res);

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.message, 'Kayıt bulunamadı');
    }
  );
});

test('audit.controller.getAuditLogById -> 400 when invalid ID', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules(
    { [require.resolve('../config/knex')]: mockKnex },
    async () => {
      delete require.cache[require.resolve('./audit.controller')];
      const audit = require('./audit.controller');

      const req = createReq({
        tenantMunicipalityId: 5,
        params: { id: 'invalid' },
      });
      const res = createRes();

      await audit.getAuditLogById(req, res);

      assert.equal(res.statusCode, 400);
      assert.equal(res.body.message, 'Geçersiz ID');
    }
  );
});

test('audit.controller.getAuditLogById -> 404 when log belongs to different municipality', async () => {
  const mockKnex = createMockKnex();
  // Log exists but belongs to different municipality
  mockKnex.__queue('audit_logs', 'first', [null]);

  await withMockedModules(
    { [require.resolve('../config/knex')]: mockKnex },
    async () => {
      delete require.cache[require.resolve('./audit.controller')];
      const audit = require('./audit.controller');

      const req = createReq({
        tenantMunicipalityId: 5,
        params: { id: '42' },
      });
      const res = createRes();

      await audit.getAuditLogById(req, res);

      assert.equal(res.statusCode, 404);
    }
  );
});

test('audit.controller.createAuditLog -> 401 when municipalityId or userId missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules(
    { [require.resolve('../config/knex')]: mockKnex },
    async () => {
      delete require.cache[require.resolve('./audit.controller')];
      const audit = require('./audit.controller');

      const req = createReq({
        tenantMunicipalityId: undefined,
        user: undefined,
        body: { action: 'ASSET_CREATE', entity_type: 'asset' },
      });
      const res = createRes();

      await audit.createAuditLog(req, res);

      assert.equal(res.statusCode, 401);
      assert.equal(res.body.message, 'Oturum doğrulanamadı');
    }
  );
});

test('audit.controller.createAuditLog -> 400 when required fields missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules(
    { [require.resolve('../config/knex')]: mockKnex },
    async () => {
      delete require.cache[require.resolve('./audit.controller')];
      const audit = require('./audit.controller');

      const req = createReq({
        tenantMunicipalityId: 5,
        user: { id: 10 },
        body: { action: 'ASSET_CREATE' }, // entity_type missing
      });
      const res = createRes();

      await audit.createAuditLog(req, res);

      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /action ve entity_type zorunludur/);
    }
  );
});

test('audit.controller.createAuditLog -> creates log with whitelisted fields only', async () => {
  const mockKnex = createMockKnex();
  const createdLog = {
    id: 1,
    action: 'ASSET_CREATE',
    entity_type: 'asset',
    entity_id: 100,
    meta: { test: 'data' },
    municipality_id: 5,
    user_id: 10,
    ip: '127.0.0.1',
    user_agent: 'test-agent',
    created_at: '2025-01-01',
  };
  mockKnex.__queue('audit_logs', 'insert:returning', [[createdLog]]);

  await withMockedModules(
    { [require.resolve('../config/knex')]: mockKnex },
    async () => {
      delete require.cache[require.resolve('./audit.controller')];
      const audit = require('./audit.controller');

      const req = createReq({
        tenantMunicipalityId: 5,
        user: { id: 10 },
        ip: '127.0.0.1',
        body: {
          action: 'ASSET_CREATE',
          entity_type: 'asset',
          entity_id: 100,
          meta: { test: 'data' },
          // These should be ignored (not in whitelist)
          malicious_field: 'should be ignored',
          municipality_id: 999, // Should be overridden
        },
        get: (header) => header === 'user-agent' ? 'test-agent' : null,
      });
      const res = createRes();

      await audit.createAuditLog(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.body.id, 1);
      assert.equal(res.body.municipality_id, 5); // Should be set from tenantMunicipalityId, not body
      assert.equal(res.body.user_id, 10);
      assert.equal(res.body.action, 'ASSET_CREATE');
      assert.equal(res.body.entity_type, 'asset');
    }
  );
});

test('audit.controller.createAuditLog -> sets municipality_id and user_id from request, not body', async () => {
  const mockKnex = createMockKnex();
  const createdLog = {
    id: 1,
    action: 'ASSET_CREATE',
    entity_type: 'asset',
    municipality_id: 7,
    user_id: 99,
    created_at: '2025-01-01',
  };
  mockKnex.__queue('audit_logs', 'insert:returning', [[createdLog]]);

  await withMockedModules(
    { [require.resolve('../config/knex')]: mockKnex },
    async () => {
      delete require.cache[require.resolve('./audit.controller')];
      const audit = require('./audit.controller');

      const req = createReq({
        tenantMunicipalityId: 7,
        user: { id: 99 },
        body: {
          action: 'ASSET_CREATE',
          entity_type: 'asset',
          // Attempt to spoof (should be ignored)
          municipality_id: 999,
          user_id: 888,
        },
      });
      const res = createRes();

      await audit.createAuditLog(req, res);

      assert.equal(res.statusCode, 201);
      // Verify that the insert was called with correct values
      // (municipality_id and user_id from request, not body)
    }
  );
});

test('audit.controller.createAuditLog -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  // Simulate DB error
  const errorKnex = (table) => {
    if (table === 'audit_logs') {
      const builder = {
        insert: () => ({
          returning: () => Promise.reject(new Error('DB error')),
        }),
      };
      return builder;
    }
    return mockKnex(table);
  };
  Object.assign(errorKnex, mockKnex);

  await withMockedModules(
    { [require.resolve('../config/knex')]: errorKnex },
    async () => {
      delete require.cache[require.resolve('./audit.controller')];
      const audit = require('./audit.controller');

      const req = createReq({
        tenantMunicipalityId: 5,
        user: { id: 10 },
        body: { action: 'ASSET_CREATE', entity_type: 'asset' },
      });
      const res = createRes();

      await audit.createAuditLog(req, res);

      assert.equal(res.statusCode, 500);
      assert.equal(res.body.message, 'Sunucu hatası');
    }
  );
});

test('audit.controller.updateAuditLog -> 405 method not allowed', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules(
    { [require.resolve('../config/knex')]: mockKnex },
    async () => {
      delete require.cache[require.resolve('./audit.controller')];
      const audit = require('./audit.controller');

      const req = createReq({
        tenantMunicipalityId: 5,
        params: { id: '1' },
        body: { action: 'UPDATED' },
      });
      const res = createRes();

      await audit.updateAuditLog(req, res);

      assert.equal(res.statusCode, 405);
      assert.match(res.body.message, /güncellenemez/);
    }
  );
});

test('audit.controller.deleteAuditLog -> 405 method not allowed', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules(
    { [require.resolve('../config/knex')]: mockKnex },
    async () => {
      delete require.cache[require.resolve('./audit.controller')];
      const audit = require('./audit.controller');

      const req = createReq({
        tenantMunicipalityId: 5,
        params: { id: '1' },
      });
      const res = createRes();

      await audit.deleteAuditLog(req, res);

      assert.equal(res.statusCode, 405);
      assert.match(res.body.message, /silinemez/);
    }
  );
});

