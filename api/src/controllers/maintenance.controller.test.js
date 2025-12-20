const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

// ============================================================================
// createTicket
// ============================================================================

test('maintenance.createTicket -> 403 when tenantMunicipalityId is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      user: { id: 10 },
      body: { title: 'Test', asset_id: 1 },
    });
    const res = createRes();

    await maintenance.createTicket(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Belediye kapsamı bulunamadı/);
  });
});

test('maintenance.createTicket -> 401 when user is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      body: { title: 'Test', asset_id: 1 },
    });
    const res = createRes();

    await maintenance.createTicket(req, res);
    assert.equal(res.statusCode, 401);
    assert.match(res.body.message, /Oturum bulunamadı/);
  });
});

test('maintenance.createTicket -> 400 when title is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: { asset_id: 1 },
    });
    const res = createRes();

    await maintenance.createTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Başlık.*zorunludur/);
  });
});

test('maintenance.createTicket -> 400 when title is empty after trim', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: { title: '   ', asset_id: 1 },
    });
    const res = createRes();

    await maintenance.createTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Başlık.*zorunludur/);
  });
});

test('maintenance.createTicket -> 400 when asset_id is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: { title: 'Test' },
    });
    const res = createRes();

    await maintenance.createTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /asset_id zorunludur/);
  });
});

test('maintenance.createTicket -> 400 when asset_id is invalid', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: { title: 'Test', asset_id: 'abc' },
    });
    const res = createRes();

    await maintenance.createTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /asset_id zorunludur/);
  });
});

test('maintenance.createTicket -> 400 when asset not found or not in tenant scope', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: { title: 'Test', asset_id: 999 },
    });
    const res = createRes();

    await maintenance.createTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Varlık bulunamadı/);
  });
});

test('maintenance.createTicket -> 400 when assigned_to_user_id is invalid', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'first', [{ id: 1 }]);
  mockKnex.__queue('users', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: { title: 'Test', asset_id: 1, assigned_to_user_id: 999 },
    });
    const res = createRes();

    await maintenance.createTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Atanan kullanıcı/);
  });
});

test('maintenance.createTicket -> 400 when priority is invalid', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'first', [{ id: 1 }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: { title: 'Test', asset_id: 1, priority: 'invalid' },
    });
    const res = createRes();

    await maintenance.createTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Geçersiz öncelik/);
  });
});

test('maintenance.createTicket -> 400 when status is invalid', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'first', [{ id: 1 }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: { title: 'Test', asset_id: 1, status: 'invalid' },
    });
    const res = createRes();

    await maintenance.createTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Geçersiz durum/);
  });
});

test('maintenance.createTicket -> creates ticket successfully with defaults', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'first', [{ id: 1 }]);
  mockKnex.__queue('maintenance_requests', 'insert:returning', [[{
    id: 1,
    municipality_id: 1,
    asset_id: 1,
    title: 'Test Ticket',
    description: null,
    priority: 'medium',
    status: 'open',
    due_date: null,
    assigned_to_user_id: null,
    created_by_user_id: 10,
    updated_by_user_id: 10,
    created_at: new Date(),
    updated_at: new Date(),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: { title: 'Test Ticket', asset_id: 1 },
    });
    const res = createRes();

    await maintenance.createTicket(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.id, 1);
    assert.equal(res.body.title, 'Test Ticket');
    assert.equal(res.body.priority, 'medium');
    assert.equal(res.body.status, 'open');
  });
});

test('maintenance.createTicket -> creates ticket with all fields', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'first', [{ id: 1 }]);
  mockKnex.__queue('users', 'first', [{ id: 20, municipality_id: 1, is_active: true }]);
  mockKnex.__queue('maintenance_requests', 'insert:returning', [[{
    id: 2,
    municipality_id: 1,
    asset_id: 1,
    title: 'Urgent Fix',
    description: 'Fix broken part',
    priority: 'high',
    status: 'in_progress',
    due_date: '2025-12-31',
    assigned_to_user_id: 20,
    created_by_user_id: 10,
    updated_by_user_id: 10,
    created_at: new Date(),
    updated_at: new Date(),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: {
        title: 'Urgent Fix',
        description: 'Fix broken part',
        asset_id: 1,
        priority: 'high',
        status: 'in_progress',
        due_date: '2025-12-31',
        assigned_to_user_id: 20,
      },
    });
    const res = createRes();

    await maintenance.createTicket(req, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.title, 'Urgent Fix');
    assert.equal(res.body.priority, 'high');
    assert.equal(res.body.status, 'in_progress');
    assert.equal(res.body.assigned_to_user_id, 20);
  });
});

test('maintenance.createTicket -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('assets', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      body: { title: 'Test', asset_id: 1 },
    });
    const res = createRes();

    await maintenance.createTicket(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// listTickets
// ============================================================================

test('maintenance.listTickets -> 403 when tenantMunicipalityId is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({ query: {} });
    const res = createRes();

    await maintenance.listTickets(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Belediye kapsamı bulunamadı/);
  });
});

test('maintenance.listTickets -> returns empty list when no tickets', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{ total: 0 }]);
  mockKnex.__queue('maintenance_requests', 'result', [[]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: {},
    });
    const res = createRes();

    await maintenance.listTickets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 0);
    assert.equal(res.body.pagination.total, 0);
  });
});

test('maintenance.listTickets -> returns tickets with pagination', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{ total: 2 }]);
  mockKnex.__queue('maintenance_requests', 'result', [[
    {
      id: 1,
      asset_id: 1,
      asset_code: 'AS-1-001',
      asset_name: 'Asset 1',
      department_id: 1,
      department_name: 'Dept 1',
      title: 'Ticket 1',
      description: 'Desc 1',
      status: 'open',
      priority: 'medium',
      due_date: null,
      assigned_to_user_id: null,
      assigned_to_name: null,
      completed_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 2,
      asset_id: 2,
      asset_code: 'AS-1-002',
      asset_name: 'Asset 2',
      department_id: 2,
      department_name: 'Dept 2',
      title: 'Ticket 2',
      description: 'Desc 2',
      status: 'in_progress',
      priority: 'high',
      due_date: '2025-12-31',
      assigned_to_user_id: 20,
      assigned_to_name: 'User 20',
      completed_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { page: 1, limit: 20 },
    });
    const res = createRes();

    await maintenance.listTickets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 2);
    assert.equal(res.body.pagination.page, 1);
    assert.equal(res.body.pagination.limit, 20);
    assert.equal(res.body.pagination.total, 2);
  });
});

test('maintenance.listTickets -> filters by status', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{ total: 1 }]);
  mockKnex.__queue('maintenance_requests', 'result', [[
    {
      id: 1,
      asset_id: 1,
      asset_code: 'AS-1-001',
      asset_name: 'Asset 1',
      department_id: 1,
      department_name: 'Dept 1',
      title: 'Ticket 1',
      status: 'open',
      priority: 'medium',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { status: 'open' },
    });
    const res = createRes();

    await maintenance.listTickets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].status, 'open');
  });
});

test('maintenance.listTickets -> 400 when status filter is invalid', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { status: 'invalid_status' },
    });
    const res = createRes();

    await maintenance.listTickets(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Geçersiz status filtresi/);
  });
});

test('maintenance.listTickets -> filters by priority', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{ total: 1 }]);
  mockKnex.__queue('maintenance_requests', 'result', [[
    {
      id: 1,
      asset_id: 1,
      asset_code: 'AS-1-001',
      asset_name: 'Asset 1',
      department_id: 1,
      department_name: 'Dept 1',
      title: 'Ticket 1',
      status: 'open',
      priority: 'high',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { priority: 'high' },
    });
    const res = createRes();

    await maintenance.listTickets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].priority, 'high');
  });
});

test('maintenance.listTickets -> 400 when priority filter is invalid', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { priority: 'invalid_priority' },
    });
    const res = createRes();

    await maintenance.listTickets(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Geçersiz priority filtresi/);
  });
});

test('maintenance.listTickets -> filters by departmentId', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{ total: 1 }]);
  mockKnex.__queue('maintenance_requests', 'result', [[
    {
      id: 1,
      asset_id: 1,
      asset_code: 'AS-1-001',
      asset_name: 'Asset 1',
      department_id: 5,
      department_name: 'Dept 5',
      title: 'Ticket 1',
      status: 'open',
      priority: 'medium',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { departmentId: '5' },
    });
    const res = createRes();

    await maintenance.listTickets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].department_id, 5);
  });
});

test('maintenance.listTickets -> filters by search term', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{ total: 1 }]);
  mockKnex.__queue('maintenance_requests', 'result', [[
    {
      id: 1,
      asset_id: 1,
      asset_code: 'AS-1-001',
      asset_name: 'Asset 1',
      department_id: 1,
      department_name: 'Dept 1',
      title: 'Broken Machine',
      description: 'Needs repair',
      status: 'open',
      priority: 'medium',
      created_at: new Date(),
      updated_at: new Date(),
    },
  ]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { search: 'Broken' },
    });
    const res = createRes();

    await maintenance.listTickets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 1);
    assert.match(res.body.data[0].title, /Broken/);
  });
});

test('maintenance.listTickets -> uses default pagination when not provided', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{ total: 0 }]);
  mockKnex.__queue('maintenance_requests', 'result', [[]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: {},
    });
    const res = createRes();

    await maintenance.listTickets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.pagination.page, 1);
    assert.equal(res.body.pagination.limit, 20);
  });
});

test('maintenance.listTickets -> limits max page size to 100', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{ total: 0 }]);
  mockKnex.__queue('maintenance_requests', 'result', [[]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: { limit: 200 },
    });
    const res = createRes();

    await maintenance.listTickets(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.pagination.limit, 100);
  });
});

test('maintenance.listTickets -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'result', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      query: {},
    });
    const res = createRes();

    await maintenance.listTickets(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// getTicketById
// ============================================================================

test('maintenance.getTicketById -> 403 when tenantMunicipalityId is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      params: { id: '1' },
    });
    const res = createRes();

    await maintenance.getTicketById(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Belediye kapsamı bulunamadı/);
  });
});

test('maintenance.getTicketById -> 400 when id is invalid', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: 'abc' },
    });
    const res = createRes();

    await maintenance.getTicketById(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Geçersiz id/);
  });
});

test('maintenance.getTicketById -> 404 when ticket not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '999' },
    });
    const res = createRes();

    await maintenance.getTicketById(req, res);
    assert.equal(res.statusCode, 404);
    assert.match(res.body.message, /Kayıt bulunamadı/);
  });
});

test('maintenance.getTicketById -> returns ticket when found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{
    id: 1,
    municipality_id: 1,
    asset_id: 1,
    title: 'Test Ticket',
    description: 'Test Description',
    status: 'open',
    priority: 'medium',
    due_date: null,
    assigned_to_user_id: 20,
    created_by_user_id: 10,
    updated_by_user_id: 10,
    created_at: new Date(),
    updated_at: new Date(),
    asset_code: 'AS-1-001',
    asset_name: 'Asset 1',
    assigned_to_name: 'John Doe',
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '1' },
    });
    const res = createRes();

    await maintenance.getTicketById(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.id, 1);
    assert.equal(res.body.title, 'Test Ticket');
    assert.equal(res.body.asset_code, 'AS-1-001');
    assert.equal(res.body.assigned_to_name, 'John Doe');
  });
});

test('maintenance.getTicketById -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '1' },
    });
    const res = createRes();

    await maintenance.getTicketById(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// updateTicket
// ============================================================================

test('maintenance.updateTicket -> 403 when tenantMunicipalityId is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      params: { id: '1' },
      body: { title: 'Updated' },
    });
    const res = createRes();

    await maintenance.updateTicket(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Belediye kapsamı bulunamadı/);
  });
});

test('maintenance.updateTicket -> 401 when user is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '1' },
      body: { title: 'Updated' },
    });
    const res = createRes();

    await maintenance.updateTicket(req, res);
    assert.equal(res.statusCode, 401);
    assert.match(res.body.message, /Oturum bulunamadı/);
  });
});

test('maintenance.updateTicket -> 400 when id is invalid', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: 'abc' },
      body: { title: 'Updated' },
    });
    const res = createRes();

    await maintenance.updateTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Geçersiz id/);
  });
});

test('maintenance.updateTicket -> 404 when ticket not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: '999' },
      body: { title: 'Updated' },
    });
    const res = createRes();

    await maintenance.updateTicket(req, res);
    assert.equal(res.statusCode, 404);
    assert.match(res.body.message, /Kayıt bulunamadı/);
  });
});

test('maintenance.updateTicket -> 400 when ticket is already completed', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{
    id: 1,
    status: 'completed',
    municipality_id: 1,
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: '1' },
      body: { title: 'Updated' },
    });
    const res = createRes();

    await maintenance.updateTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Tamamlanmış kayıt güncellenemez/);
  });
});

test('maintenance.updateTicket -> 400 when no fields to update', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{
    id: 1,
    status: 'open',
    municipality_id: 1,
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: '1' },
      body: {},
    });
    const res = createRes();

    await maintenance.updateTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Güncellenecek alan bulunamadı/);
  });
});

test('maintenance.updateTicket -> 400 when title is empty', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{
    id: 1,
    status: 'open',
    municipality_id: 1,
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: '1' },
      body: { title: '   ' },
    });
    const res = createRes();

    await maintenance.updateTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /title boş olamaz/);
  });
});

test('maintenance.updateTicket -> 400 when priority is invalid', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{
    id: 1,
    status: 'open',
    municipality_id: 1,
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: '1' },
      body: { priority: 'invalid' },
    });
    const res = createRes();

    await maintenance.updateTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Geçersiz priority/);
  });
});

test('maintenance.updateTicket -> 400 when status is invalid', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{
    id: 1,
    status: 'open',
    municipality_id: 1,
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: '1' },
      body: { status: 'invalid' },
    });
    const res = createRes();

    await maintenance.updateTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Geçersiz status/);
  });
});

test('maintenance.updateTicket -> 400 when assigned_to_user_id is invalid', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{
    id: 1,
    status: 'open',
    municipality_id: 1,
  }]);
  mockKnex.__queue('users', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: '1' },
      body: { assigned_to_user_id: 999 },
    });
    const res = createRes();

    await maintenance.updateTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Atanan kullanıcı/);
  });
});

test('maintenance.updateTicket -> 400 when asset_id is invalid', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{
    id: 1,
    status: 'open',
    municipality_id: 1,
  }]);
  mockKnex.__queue('assets', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: '1' },
      body: { asset_id: 999 },
    });
    const res = createRes();

    await maintenance.updateTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Varlık bulunamadı/);
  });
});

test('maintenance.updateTicket -> updates ticket successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{
    id: 1,
    status: 'open',
    municipality_id: 1,
  }]);
  mockKnex.__queue('users', 'first', [{ id: 20, municipality_id: 1, is_active: true }]);
  mockKnex.__queue('maintenance_requests', 'update:returning', [[{
    id: 1,
    municipality_id: 1,
    asset_id: 1,
    title: 'Updated Title',
    description: 'Updated Description',
    status: 'in_progress',
    priority: 'high',
    due_date: '2025-12-31',
    assigned_to_user_id: 20,
    created_by_user_id: 10,
    updated_by_user_id: 10,
    created_at: new Date(),
    updated_at: new Date(),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: '1' },
      body: {
        title: 'Updated Title',
        description: 'Updated Description',
        status: 'in_progress',
        priority: 'high',
        due_date: '2025-12-31',
        assigned_to_user_id: 20,
      },
    });
    const res = createRes();

    await maintenance.updateTicket(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.title, 'Updated Title');
    assert.equal(res.body.status, 'in_progress');
    assert.equal(res.body.priority, 'high');
  });
});

test('maintenance.updateTicket -> allows setting assigned_to_user_id to null', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{
    id: 1,
    status: 'open',
    municipality_id: 1,
    assigned_to_user_id: 20,
  }]);
  mockKnex.__queue('maintenance_requests', 'update:returning', [[{
    id: 1,
    municipality_id: 1,
    asset_id: 1,
    title: 'Test',
    status: 'open',
    priority: 'medium',
    assigned_to_user_id: null,
    created_by_user_id: 10,
    updated_by_user_id: 10,
    created_at: new Date(),
    updated_at: new Date(),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: '1' },
      body: { assigned_to_user_id: null },
    });
    const res = createRes();

    await maintenance.updateTicket(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.assigned_to_user_id, null);
  });
});

test('maintenance.updateTicket -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: '1' },
      body: { title: 'Updated' },
    });
    const res = createRes();

    await maintenance.updateTicket(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// completeTicket
// ============================================================================

test('maintenance.completeTicket -> 403 when tenantMunicipalityId is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      params: { id: '1' },
    });
    const res = createRes();

    await maintenance.completeTicket(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Belediye kapsamı bulunamadı/);
  });
});

test('maintenance.completeTicket -> 401 when user is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '1' },
    });
    const res = createRes();

    await maintenance.completeTicket(req, res);
    assert.equal(res.statusCode, 401);
    assert.match(res.body.message, /Oturum bulunamadı/);
  });
});

test('maintenance.completeTicket -> 400 when id is invalid', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: 'abc' },
    });
    const res = createRes();

    await maintenance.completeTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Geçersiz id/);
  });
});

test('maintenance.completeTicket -> 404 when ticket not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: '999' },
    });
    const res = createRes();

    await maintenance.completeTicket(req, res);
    assert.equal(res.statusCode, 404);
    assert.match(res.body.message, /Kayıt bulunamadı/);
  });
});

test('maintenance.completeTicket -> 400 when ticket already completed', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{
    id: 1,
    status: 'completed',
    municipality_id: 1,
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: '1' },
    });
    const res = createRes();

    await maintenance.completeTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /zaten tamamlanmış/);
  });
});

test('maintenance.completeTicket -> completes ticket successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{
    id: 1,
    status: 'in_progress',
    municipality_id: 1,
  }]);
  mockKnex.__queue('maintenance_requests', 'update:returning', [[{
    id: 1,
    municipality_id: 1,
    asset_id: 1,
    title: 'Test Ticket',
    status: 'completed',
    priority: 'medium',
    completed_at: new Date(),
    completed_by_user_id: 10,
    resolution_note: 'Fixed successfully',
    created_by_user_id: 10,
    updated_by_user_id: 10,
    created_at: new Date(),
    updated_at: new Date(),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: '1' },
      body: { resolution_note: 'Fixed successfully' },
    });
    const res = createRes();

    await maintenance.completeTicket(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'completed');
    assert.equal(res.body.completed_by_user_id, 10);
    assert.equal(res.body.resolution_note, 'Fixed successfully');
  });
});

test('maintenance.completeTicket -> completes ticket without resolution_note', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{
    id: 1,
    status: 'open',
    municipality_id: 1,
  }]);
  mockKnex.__queue('maintenance_requests', 'update:returning', [[{
    id: 1,
    municipality_id: 1,
    asset_id: 1,
    title: 'Test Ticket',
    status: 'completed',
    priority: 'medium',
    completed_at: new Date(),
    completed_by_user_id: 10,
    resolution_note: null,
    created_by_user_id: 10,
    updated_by_user_id: 10,
    created_at: new Date(),
    updated_at: new Date(),
  }]]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: '1' },
      body: {},
    });
    const res = createRes();

    await maintenance.completeTicket(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'completed');
    assert.equal(res.body.resolution_note, null);
  });
});

test('maintenance.completeTicket -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      user: { id: 10 },
      params: { id: '1' },
    });
    const res = createRes();

    await maintenance.completeTicket(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

// ============================================================================
// deleteTicket
// ============================================================================

test('maintenance.deleteTicket -> 403 when tenantMunicipalityId is missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      params: { id: '1' },
    });
    const res = createRes();

    await maintenance.deleteTicket(req, res);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Belediye kapsamı bulunamadı/);
  });
});

test('maintenance.deleteTicket -> 400 when id is invalid', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: 'abc' },
    });
    const res = createRes();

    await maintenance.deleteTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Geçersiz id/);
  });
});

test('maintenance.deleteTicket -> 404 when ticket not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '999' },
    });
    const res = createRes();

    await maintenance.deleteTicket(req, res);
    assert.equal(res.statusCode, 404);
    assert.match(res.body.message, /Kayıt bulunamadı/);
  });
});

test('maintenance.deleteTicket -> 400 when ticket is completed', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{
    id: 1,
    status: 'completed',
    municipality_id: 1,
  }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '1' },
    });
    const res = createRes();

    await maintenance.deleteTicket(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Tamamlanmış bakım kayıtları silinemez/);
  });
});

test('maintenance.deleteTicket -> deletes ticket successfully', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [{
    id: 1,
    status: 'open',
    municipality_id: 1,
  }]);
  mockKnex.__queue('maintenance_requests', 'del', [1]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '1' },
    });
    const res = createRes();

    await maintenance.deleteTicket(req, res);
    assert.equal(res.statusCode, 204);
  });
});

test('maintenance.deleteTicket -> 500 on DB error', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('maintenance_requests', 'first', [Promise.reject(new Error('DB Error'))]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./maintenance.controller')];
    const maintenance = require('./maintenance.controller');

    const req = createReq({
      tenantMunicipalityId: 1,
      params: { id: '1' },
    });
    const res = createRes();

    await maintenance.deleteTicket(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.message, 'Sunucu hatası');
  });
});

