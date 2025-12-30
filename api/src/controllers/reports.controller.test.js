const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

// ============================================================================
// getInventorySummary
// ============================================================================

test('reports.getInventorySummary -> 400 when tenantMunicipalityId missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./reports.controller')];
    const reports = require('./reports.controller');

    const req = createReq({});
    const res = createRes();

    await reports.getInventorySummary(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'VALIDATION_ERROR');
    assert.match(res.body.message, /Belediye kapsamı/);
  });
});

test('reports.getInventorySummary -> 400 when groupBy is invalid', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./reports.controller')];
    const reports = require('./reports.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { groupBy: 'invalid' },
    });
    const res = createRes();

    await reports.getInventorySummary(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'VALIDATION_ERROR');
    assert.match(res.body.message, /Geçersiz groupBy/);
  });
});

test('reports.getInventorySummary -> returns summary grouped by department', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'result', [[
    { _id: 1, total_count: '5', total_value: '15000.00' },
    { _id: 2, total_count: '3', total_value: '8000.00' },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./reports.controller')];
    const reports = require('./reports.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { groupBy: 'department' },
    });
    const res = createRes();

    await reports.getInventorySummary(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.groupBy, 'department');
    assert.equal(res.body.filters.status, null);
    assert.equal(res.body.data.length, 2);
    assert.equal(res.body.data[0]._id, 1);
    assert.equal(res.body.data[0].totalCount, 5);
    assert.equal(res.body.data[0].totalValue, 15000);
    assert.equal(res.body.data[1]._id, 2);
    assert.equal(res.body.data[1].totalCount, 3);
    assert.equal(res.body.data[1].totalValue, 8000);
    assert.ok(res.body.generatedAt);
  });
});

test('reports.getInventorySummary -> returns summary grouped by location', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'result', [[
    { _id: 10, total_count: '7', total_value: '20000.00' },
    { _id: 11, total_count: '2', total_value: '5000.00' },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./reports.controller')];
    const reports = require('./reports.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { groupBy: 'location' },
    });
    const res = createRes();

    await reports.getInventorySummary(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.groupBy, 'location');
    assert.equal(res.body.data.length, 2);
    assert.equal(res.body.data[0]._id, 10);
    assert.equal(res.body.data[0].totalCount, 7);
    assert.equal(res.body.data[0].totalValue, 20000);
  });
});

test('reports.getInventorySummary -> filters by status', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'result', [[
    { _id: 1, total_count: '2', total_value: '6000.00' },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./reports.controller')];
    const reports = require('./reports.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { groupBy: 'department', status: 'active' },
    });
    const res = createRes();

    await reports.getInventorySummary(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.filters.status, 'active');
    assert.equal(res.body.data.length, 1);
  });
});

test('reports.getInventorySummary -> returns empty data when no assets', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'result', [[]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./reports.controller')];
    const reports = require('./reports.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { groupBy: 'department' },
    });
    const res = createRes();

    await reports.getInventorySummary(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 0);
  });
});

test('reports.getInventorySummary -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  // Queue a rejected promise to simulate DB error
  mockKnex.__queue('assets', 'result', [Promise.reject(new Error('DB connection failed'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./reports.controller')];
    const reports = require('./reports.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { groupBy: 'department' },
    });
    const res = createRes();

    await reports.getInventorySummary(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
    assert.match(res.body.message, /Envanter raporu/);
  });
});

// ============================================================================
// getMaintenanceSummary
// ============================================================================

test('reports.getMaintenanceSummary -> 400 when tenantMunicipalityId missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./reports.controller')];
    const reports = require('./reports.controller');

    const req = createReq({});
    const res = createRes();

    await reports.getMaintenanceSummary(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.error, 'VALIDATION_ERROR');
    assert.match(res.body.message, /Belediye kapsamı/);
  });
});

test('reports.getMaintenanceSummary -> returns summary with status and priority counts', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'result', [[
    { status: 'open', priority: 'high' },
    { status: 'open', priority: 'medium' },
    { status: 'in_progress', priority: 'high' },
    { status: 'completed', priority: 'low' },
    { status: 'completed', priority: 'low' },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./reports.controller')];
    const reports = require('./reports.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: {},
    });
    const res = createRes();

    await reports.getMaintenanceSummary(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.totalTickets, 5);
    assert.equal(res.body.data.byStatus.open, 2);
    assert.equal(res.body.data.byStatus.in_progress, 1);
    assert.equal(res.body.data.byStatus.completed, 2);
    assert.equal(res.body.data.byPriority.high, 2);
    assert.equal(res.body.data.byPriority.medium, 1);
    assert.equal(res.body.data.byPriority.low, 2);
    assert.equal(res.body.period.from, null);
    assert.equal(res.body.period.to, null);
    assert.ok(res.body.generatedAt);
  });
});

test('reports.getMaintenanceSummary -> filters by date range', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'result', [[
    { status: 'open', priority: 'medium' },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./reports.controller')];
    const reports = require('./reports.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: {
        from: '2025-01-01',
        to: '2025-01-31',
      },
    });
    const res = createRes();

    await reports.getMaintenanceSummary(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.period.from, '2025-01-01');
    assert.equal(res.body.period.to, '2025-01-31');
    assert.equal(res.body.data.totalTickets, 1);
  });
});

test('reports.getMaintenanceSummary -> handles null status and priority', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'result', [[
    { status: null, priority: null },
    { status: 'open', priority: 'high' },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./reports.controller')];
    const reports = require('./reports.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: {},
    });
    const res = createRes();

    await reports.getMaintenanceSummary(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.totalTickets, 2);
    assert.equal(res.body.data.byStatus.unknown, 1);
    assert.equal(res.body.data.byStatus.open, 1);
    assert.equal(res.body.data.byPriority.unknown, 1);
    assert.equal(res.body.data.byPriority.high, 1);
  });
});

test('reports.getMaintenanceSummary -> returns empty summary when no tickets', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'result', [[]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./reports.controller')];
    const reports = require('./reports.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: {},
    });
    const res = createRes();

    await reports.getMaintenanceSummary(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.totalTickets, 0);
    assert.deepEqual(res.body.data.byStatus, {});
    assert.deepEqual(res.body.data.byPriority, {});
  });
});

test('reports.getMaintenanceSummary -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  // Queue a rejected promise to simulate DB error
  mockKnex.__queue('maintenance_requests', 'result', [Promise.reject(new Error('DB connection failed'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./reports.controller')];
    const reports = require('./reports.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: {},
    });
    const res = createRes();

    await reports.getMaintenanceSummary(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
    assert.match(res.body.message, /Bakım raporu/);
  });
});

// ============================================================================
// exportExcel
// ============================================================================

test('reports.exportExcel -> 403 when municipalityId missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./reports.controller')];
    const reports = require('./reports.controller');

    const req = createReq({
      query: { type: 'inventory-summary' },
    });
    const res = createRes();

    await reports.exportExcel(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, 'FORBIDDEN');
  });
});

test('reports.exportExcel -> sets correct headers and generates Excel file', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'where', [mockKnex]);
  mockKnex.__queue('assets', 'select', [mockKnex]);
  mockKnex.__queue('assets', 'groupBy', [mockKnex]);
  mockKnex.__queue('assets', 'then', [[{ _id: 1, total_count: 5, total_value: 1000 }]]);
  mockKnex.__queue('departments', 'whereIn', [mockKnex]);
  mockKnex.__queue('departments', 'where', [mockKnex]);
  mockKnex.__queue('departments', 'select', [mockKnex]);
  mockKnex.__queue('departments', 'then', [[{ id: 1, name: 'Test Department' }]]);

  const mockWorkbook = {
    addWorksheet: () => ({
      addRow: () => {},
      getRow: () => ({
        font: {},
        alignment: {},
        fill: {},
      }),
      mergeCells: () => {},
      getColumn: () => ({
        width: 0,
      }),
      rowCount: 1,
    }),
    xlsx: {
      write: async (stream) => {
        stream.end();
      },
    },
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      exceljs: {
        Workbook: class {
          constructor() {
            Object.assign(this, mockWorkbook);
          }
        },
      },
    },
    async () => {
      delete require.cache[require.resolve('./reports.controller')];
      const reports = require('./reports.controller');

      const req = createReq({
        tenantMunicipalityId: 1,
        query: { type: 'inventory-summary', groupBy: 'department' },
      });
      const res = createRes();
      let ended = false;
      res.end = () => {
        ended = true;
      };

      await reports.exportExcel(req, res);
      assert.equal(res.headers['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      assert.match(res.headers['Content-Disposition'], /attachment; filename="rapor_inventory-summary_.*\.xlsx"/);
      assert.equal(ended, true);
    }
  );
});

test('reports.exportExcel -> 500 on error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'where', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      exceljs: {
        Workbook: class {},
      },
    },
    async () => {
      delete require.cache[require.resolve('./reports.controller')];
      const reports = require('./reports.controller');

      const req = createReq({
        tenantMunicipalityId: 1,
        query: { type: 'inventory-summary' },
      });
      const res = createRes();

      await reports.exportExcel(req, res);
      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
      assert.match(res.body.message, /Excel çıktısı/);
    }
  );
});

// ============================================================================
// exportPdf
// ============================================================================

test('reports.exportPdf -> 403 when municipalityId missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./reports.controller')];
    const reports = require('./reports.controller');

    const req = createReq({});
    const res = createRes();

    await reports.exportPdf(req, res);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error, 'FORBIDDEN');
  });
});

test('reports.exportPdf -> sets correct headers and generates PDF file', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'where', [mockKnex]);
  mockKnex.__queue('assets', 'select', [mockKnex]);
  mockKnex.__queue('assets', 'groupBy', [mockKnex]);
  mockKnex.__queue('assets', 'then', [[{ _id: 1, total_count: 5, total_value: 1000 }]]);
  mockKnex.__queue('departments', 'whereIn', [mockKnex]);
  mockKnex.__queue('departments', 'where', [mockKnex]);
  mockKnex.__queue('departments', 'select', [mockKnex]);
  mockKnex.__queue('departments', 'then', [[{ id: 1, name: 'Test Department' }]]);

  let docEnded = false;
  const mockPDFDoc = class {
    constructor() {
      this.y = 50;
      this.page = { height: 800 };
    }
    pipe() {}
    fontSize() { return this; }
    font() { return this; }
    text() {}
    moveDown() {}
    moveTo() { return this; }
    lineTo() { return this; }
    stroke() {}
    addPage() {}
    end() {
      docEnded = true;
    }
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      pdfkit: mockPDFDoc,
    },
    async () => {
      delete require.cache[require.resolve('./reports.controller')];
      const reports = require('./reports.controller');

      const req = createReq({
        tenantMunicipalityId: 1,
        query: { type: 'inventory-summary', groupBy: 'department' },
      });
      const res = createRes();
      let ended = false;
      res.end = () => {
        ended = true;
      };

      await reports.exportPdf(req, res);
      assert.equal(res.headers['Content-Type'], 'application/pdf');
      assert.match(res.headers['Content-Disposition'], /attachment; filename="rapor_inventory-summary_.*\.pdf"/);
      // PDF dokümanı end() çağrıldığında res.end() de çağrılır
      assert.ok(docEnded || ended, 'PDF should be ended');
    }
  );
});

test('reports.exportPdf -> 500 on error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'where', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      pdfkit: class {
        pipe() {}
        end() {}
      },
    },
    async () => {
      delete require.cache[require.resolve('./reports.controller')];
      const reports = require('./reports.controller');

      const req = createReq({
        tenantMunicipalityId: 1,
        query: { type: 'inventory-summary' },
      });
      const res = createRes();

      await reports.exportPdf(req, res);
      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
      assert.match(res.body.message, /PDF çıktısı/);
    }
  );
});

