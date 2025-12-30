/**
 * Maintenance Routes Integration Tests
 * 
 * Bu dosya maintenance endpoint'lerinin gerçek veritabanı ve Express app ile
 * entegrasyon testlerini içerir.
 * 
 * Test Senaryoları:
 * - CRUD işlemleri (Create, Read, Update, Delete)
 * - Tenant scope kontrolü
 * - Validation hataları
 * - Status ve priority kontrolleri
 * - Asset ile ilişki kontrolü
 * - Complete ticket işlemi
 * - Delete restrictions (completed tickets)
 * - Authorization kontrolleri
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { setupTestDb, teardownTestDb, cleanDatabase, getTestApp, getTestDb, runMigrations } = require('../helpers/testSetup');
const { getAuthHeader } = require('../helpers/authHelper');
const {
  createTestEnvironment,
  createTestAsset,
  createTestMaintenanceTicket,
  createTestMunicipality,
  createTestUser,
} = require('../helpers/dataFactory');

// Test başlamadan önce setup
test.before(async () => {
  await setupTestDb();
  // Migrasyonları çalıştır (tablolar yoksa oluşturur)
  try {
    await runMigrations();
  } catch (err) {
    console.warn('Warning: Migrations may have already been run:', err.message);
  }
  
  // purchase_price kolonunun decimal olduğundan emin ol
  const db = getTestDb();
  try {
    const columnInfo = await db.raw(`
      SELECT data_type, udt_name
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'assets' 
      AND column_name = 'purchase_price'
    `);
    
    if (columnInfo.rows && columnInfo.rows.length > 0) {
      const dataType = columnInfo.rows[0].data_type;
      const udtName = columnInfo.rows[0].udt_name;
      
      if (dataType === 'integer' || udtName === 'int4') {
        console.log('Fixing purchase_price column type from integer to decimal in test.before...');
        await db.raw(`
          ALTER TABLE assets 
          ALTER COLUMN purchase_price TYPE DECIMAL(14, 2) USING purchase_price::DECIMAL(14, 2)
        `);
        console.log('purchase_price column type fixed to DECIMAL(14, 2)');
      }
    }
  } catch (err) {
    console.warn('Warning: Could not check/fix purchase_price column type in test.before:', err.message);
  }
  
  await cleanDatabase();
});

// Test bittikten sonra cleanup
test.after(async () => {
  await cleanDatabase();
  await teardownTestDb();
});

// Her testten önce veritabanını temizle
test.beforeEach(async () => {
  await cleanDatabase();
});

// ============================================================================
// POST /api/maintenance - CREATE TICKET TESTS
// ============================================================================

test('POST /api/maintenance -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .post('/api/maintenance')
    .send({
      asset_id: 1,
      title: 'Test Ticket',
    })
    .expect(401);

  assert.ok(response.body);
});

test('POST /api/maintenance -> should return 403 when user role is not admin', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  
  const response = await request(app)
    .post('/api/maintenance')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .send({
      asset_id: asset.id,
      title: 'Test Ticket',
    })
    .expect(403);

  assert.ok(response.body);
});

test('POST /api/maintenance -> should return 400 when title is missing', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  const asset = await createTestAsset(db, municipality.id);
  
  const response = await request(app)
    .post('/api/maintenance')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      asset_id: asset.id,
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('Başlık') || response.body.message.includes('title'));
});

test('POST /api/maintenance -> should return 400 when asset_id is missing', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const response = await request(app)
    .post('/api/maintenance')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      title: 'Test Ticket',
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('asset_id'));
});

test('POST /api/maintenance -> should return 400 when asset not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const response = await request(app)
    .post('/api/maintenance')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      asset_id: 99999,
      title: 'Test Ticket',
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('bulunamadı') || response.body.message.includes('ait değil'));
});

test('POST /api/maintenance -> should return 400 when asset belongs to other municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  // Başka bir belediye ve asset oluştur
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherAsset = await createTestAsset(db, otherMunicipality.id);
  
  const response = await request(app)
    .post('/api/maintenance')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      asset_id: otherAsset.id,
      title: 'Test Ticket',
    })
    .expect(400);

  assert.ok(response.body);
});

test('POST /api/maintenance -> should return 400 when priority is invalid', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  const asset = await createTestAsset(db, municipality.id);
  
  const response = await request(app)
    .post('/api/maintenance')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      asset_id: asset.id,
      title: 'Test Ticket',
      priority: 'invalid_priority',
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('öncelik') || response.body.message.includes('priority'));
});

test('POST /api/maintenance -> should return 400 when status is invalid', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  const asset = await createTestAsset(db, municipality.id);
  
  const response = await request(app)
    .post('/api/maintenance')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      asset_id: asset.id,
      title: 'Test Ticket',
      status: 'invalid_status',
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('durum') || response.body.message.includes('status'));
});

test('POST /api/maintenance -> should return 400 when assigned_to_user_id does not belong to municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  const asset = await createTestAsset(db, municipality.id);
  
  // Başka bir belediye ve user oluştur
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherUser = await createTestUser(db, otherMunicipality.id, 3);
  
  const response = await request(app)
    .post('/api/maintenance')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      asset_id: asset.id,
      title: 'Test Ticket',
      assigned_to_user_id: otherUser.id,
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('ait değil') || response.body.message.includes('pasif'));
});

test('POST /api/maintenance -> should return 201 and create ticket successfully', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  try {
    const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
    const asset = await createTestAsset(db, municipality.id);
    
    const ticketData = {
      asset_id: asset.id,
      title: 'Test Maintenance Ticket',
      description: 'Test maintenance description',
      priority: 'high',
      status: 'open',
    };
    
    const response = await request(app)
      .post('/api/maintenance')
      .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
      .send(ticketData);

    if (response.status !== 201) {
      console.error('\n=== POST /api/maintenance FAILED ===');
      console.error('Status:', response.status);
      console.error('Expected: 201');
      console.error('Response body:', JSON.stringify(response.body, null, 2));
      console.error('Request data:', JSON.stringify(ticketData, null, 2));
      throw new Error(`Expected status 201, got ${response.status}. Response: ${JSON.stringify(response.body)}`);
    }

    if (!response.body || !response.body.id) {
      throw new Error('Response body or id is missing');
    }
    
    const ticket = response.body;
    
    if (Number(ticket.asset_id) !== Number(asset.id)) {
      throw new Error(`Asset ID mismatch. Expected: ${asset.id}, Got: ${ticket.asset_id}`);
    }
    
    if (ticket.title !== ticketData.title) {
      throw new Error(`Title mismatch. Expected: ${ticketData.title}, Got: ${ticket.title}`);
    }
    
    if (ticket.priority !== ticketData.priority) {
      throw new Error(`Priority mismatch. Expected: ${ticketData.priority}, Got: ${ticket.priority}`);
    }
    
    if (Number(ticket.municipality_id) !== Number(municipality.id)) {
      throw new Error(`Municipality ID mismatch. Expected: ${municipality.id}, Got: ${ticket.municipality_id}`);
    }
    
    // Veritabanında kaydın oluşturulduğunu doğrula
    const dbTicket = await db('maintenance_requests')
      .where({ id: ticket.id })
      .first();
    
    if (!dbTicket) {
      throw new Error(`Ticket not found in database with id: ${ticket.id}`);
    }
    
    if (Number(dbTicket.asset_id) !== Number(asset.id)) {
      throw new Error(`Database asset_id mismatch. Expected: ${asset.id}, Got: ${dbTicket.asset_id}`);
    }
  } catch (err) {
    console.error('\n=== TEST ERROR ===');
    console.error(err.message);
    console.error(err.stack);
    throw err;
  }
});

// ============================================================================
// GET /api/maintenance - LIST TICKETS TESTS
// ============================================================================

test('GET /api/maintenance -> should return 401 when no token provided', async () => {
  const app = getTestApp();
  const response = await request(app)
    .get('/api/maintenance')
    .expect(401);

  assert.ok(response.body);
});

test('GET /api/maintenance -> should return 200 and list tickets for municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  
  // Birkaç ticket oluştur
  const ticket1 = await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset.id,
    title: 'Ticket 1',
  });
  
  const ticket2 = await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset.id,
    title: 'Ticket 2',
  });
  
  // Başka bir belediye ve ticket oluştur (tenant scope testi için)
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherAsset = await createTestAsset(db, otherMunicipality.id);
  await createTestMaintenanceTicket(db, otherMunicipality.id, {
    asset_id: otherAsset.id,
    title: 'Other Ticket',
  });
  
  const response = await request(app)
    .get('/api/maintenance')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(response.body.data, 'Response should have data property');
  assert.ok(Array.isArray(response.body.data), 'Data should be an array');
  assert.equal(response.body.data.length, 2, 'Should return only tickets from user municipality');
  assert.ok(response.body.pagination, 'Response should have pagination');
  assert.equal(response.body.pagination.total, 2, 'Total should match data length');
  
  // Ticket ID'lerini kontrol et
  const ticketIds = response.body.data.map(t => Number(t.id));
  assert.ok(ticketIds.includes(Number(ticket1.id)), 'Ticket 1 should be in the list');
  assert.ok(ticketIds.includes(Number(ticket2.id)), 'Ticket 2 should be in the list');
});

test('GET /api/maintenance -> should return 200 with status filter', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  
  // Farklı status'larda ticket'lar oluştur
  const openTicket = await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset.id,
    title: 'Open Ticket',
    status: 'open',
  });
  
  await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset.id,
    title: 'In Progress Ticket',
    status: 'in_progress',
  });
  
  const response = await request(app)
    .get('/api/maintenance?status=open')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(Array.isArray(response.body.data));
  // Sadece open status'undaki ticket'ları görmeli
  response.body.data.forEach(ticket => {
    assert.equal(ticket.status, 'open', 'All tickets should have status=open');
  });
});

test('GET /api/maintenance -> should return 200 with priority filter', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  
  // Farklı priority'lerde ticket'lar oluştur
  await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset.id,
    title: 'High Priority Ticket',
    priority: 'high',
  });
  
  await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset.id,
    title: 'Low Priority Ticket',
    priority: 'low',
  });
  
  const response = await request(app)
    .get('/api/maintenance?priority=high')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(Array.isArray(response.body.data));
  // Sadece high priority'deki ticket'ları görmeli
  response.body.data.forEach(ticket => {
    assert.equal(ticket.priority, 'high', 'All tickets should have priority=high');
  });
});

test('GET /api/maintenance -> should return 200 with pagination', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  
  // Birkaç ticket oluştur
  for (let i = 1; i <= 5; i++) {
    await createTestMaintenanceTicket(db, municipality.id, {
      asset_id: asset.id,
      title: `Ticket ${i}`,
    });
  }
  
  const response = await request(app)
    .get('/api/maintenance?page=1&limit=2')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.ok(Array.isArray(response.body.data));
  assert.equal(response.body.data.length, 2, 'Should return 2 tickets');
  assert.equal(response.body.pagination.page, 1, 'Page should be 1');
  assert.equal(response.body.pagination.limit, 2, 'Limit should be 2');
  assert.ok(response.body.pagination.total >= 5, 'Total should be at least 5');
});

// ============================================================================
// GET /api/maintenance/:id - GET TICKET BY ID TESTS
// ============================================================================

test('GET /api/maintenance/:id -> should return 404 when ticket not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .get('/api/maintenance/99999')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(404);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('bulunamadı'));
});

test('GET /api/maintenance/:id -> should return 400 when id is not a number', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  const response = await request(app)
    .get('/api/maintenance/invalid')
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('Geçersiz'));
});

test('GET /api/maintenance/:id -> should return 404 when ticket belongs to other municipality', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  
  // Başka bir belediye ve ticket oluştur
  const otherMunicipality = await createTestMunicipality(db, { name: 'Other Municipality' });
  const otherAsset = await createTestAsset(db, otherMunicipality.id);
  const otherTicket = await createTestMaintenanceTicket(db, otherMunicipality.id, {
    asset_id: otherAsset.id,
  });
  
  // Başka belediyenin ticket'ına erişmeye çalış
  const response = await request(app)
    .get(`/api/maintenance/${otherTicket.id}`)
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(404);

  assert.ok(response.body);
});

test('GET /api/maintenance/:id -> should return 200 and get ticket by id', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user } = await createTestEnvironment(db, { userRoleId: 3 });
  const asset = await createTestAsset(db, municipality.id);
  const ticket = await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset.id,
    title: 'Test Ticket',
  });
  
  const response = await request(app)
    .get(`/api/maintenance/${ticket.id}`)
    .set(getAuthHeader({ id: user.id, role_id: user.role_id, municipality_id: municipality.id }))
    .expect(200);

  assert.ok(response.body);
  assert.equal(Number(response.body.id), Number(ticket.id));
  assert.equal(response.body.title, ticket.title);
  assert.equal(Number(response.body.municipality_id), Number(municipality.id));
});

// ============================================================================
// PATCH /api/maintenance/:id - UPDATE TICKET TESTS
// ============================================================================

test('PATCH /api/maintenance/:id -> should return 404 when ticket not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const response = await request(app)
    .patch('/api/maintenance/99999')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      title: 'Updated Ticket',
    })
    .expect(404);

  assert.ok(response.body);
});

test('PATCH /api/maintenance/:id -> should return 400 when id is not a number', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const response = await request(app)
    .patch('/api/maintenance/invalid')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      title: 'Updated Ticket',
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('Geçersiz'));
});

test('PATCH /api/maintenance/:id -> should return 400 when no fields to update', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  const asset = await createTestAsset(db, municipality.id);
  const ticket = await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset.id,
  });
  
  const response = await request(app)
    .patch(`/api/maintenance/${ticket.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({})
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('alan bulunamadı'));
});

test('PATCH /api/maintenance/:id -> should return 400 when completed ticket cannot be updated', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  const asset = await createTestAsset(db, municipality.id);
  const ticket = await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset.id,
    status: 'completed',
  });
  
  const response = await request(app)
    .patch(`/api/maintenance/${ticket.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      title: 'Updated Title',
    })
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('Tamamlanmış') || response.body.message.includes('güncellenemez'));
});

test('PATCH /api/maintenance/:id -> should return 200 and update ticket successfully', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  try {
    const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
    const asset = await createTestAsset(db, municipality.id);
    const ticket = await createTestMaintenanceTicket(db, municipality.id, {
      asset_id: asset.id,
      title: 'Original Title',
      priority: 'medium',
    });
    
    const updateData = {
      title: 'Updated Title',
      priority: 'high',
      status: 'in_progress',
    };
    
    const response = await request(app)
      .patch(`/api/maintenance/${ticket.id}`)
      .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
      .send(updateData);

    if (response.status !== 200) {
      console.error('\n=== PATCH /api/maintenance/:id FAILED ===');
      console.error('Status:', response.status);
      console.error('Expected: 200');
      console.error('Response body:', JSON.stringify(response.body, null, 2));
      console.error('Request data:', JSON.stringify(updateData, null, 2));
      throw new Error(`Expected status 200, got ${response.status}. Response: ${JSON.stringify(response.body)}`);
    }

    if (!response.body || !response.body.id) {
      throw new Error('Response body or id is missing');
    }
    
    const updatedTicket = response.body;
    
    if (updatedTicket.title !== updateData.title) {
      throw new Error(`Title mismatch. Expected: ${updateData.title}, Got: ${updatedTicket.title}`);
    }
    
    if (updatedTicket.priority !== updateData.priority) {
      throw new Error(`Priority mismatch. Expected: ${updateData.priority}, Got: ${updatedTicket.priority}`);
    }
    
    // Veritabanında güncellendiğini doğrula
    const dbTicket = await db('maintenance_requests')
      .where({ id: ticket.id })
      .first();
    
    if (!dbTicket) {
      throw new Error(`Ticket not found in database with id: ${ticket.id}`);
    }
    
    if (dbTicket.title !== updateData.title) {
      throw new Error(`Database title mismatch. Expected: ${updateData.title}, Got: ${dbTicket.title}`);
    }
  } catch (err) {
    console.error('\n=== TEST ERROR ===');
    console.error(err.message);
    console.error(err.stack);
    throw err;
  }
});

// ============================================================================
// POST /api/maintenance/:id/complete - COMPLETE TICKET TESTS
// ============================================================================

test('POST /api/maintenance/:id/complete -> should return 404 when ticket not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const response = await request(app)
    .post('/api/maintenance/99999/complete')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({})
    .expect(404);

  assert.ok(response.body);
});

test('POST /api/maintenance/:id/complete -> should return 400 when ticket is already completed', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  const asset = await createTestAsset(db, municipality.id);
  const ticket = await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset.id,
    status: 'completed',
  });
  
  const response = await request(app)
    .post(`/api/maintenance/${ticket.id}/complete`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({})
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('tamamlanmış'));
});

test('POST /api/maintenance/:id/complete -> should return 200 and complete ticket successfully', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  const asset = await createTestAsset(db, municipality.id);
  const ticket = await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset.id,
    status: 'open',
  });
  
  const response = await request(app)
    .post(`/api/maintenance/${ticket.id}/complete`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .send({
      resolution_note: 'Fixed successfully',
    })
    .expect(200);

  assert.ok(response.body);
  assert.equal(response.body.status, 'completed');
  assert.ok(response.body.completed_at);
  assert.equal(Number(response.body.completed_by_user_id), Number(adminUser.id));
  assert.equal(response.body.resolution_note, 'Fixed successfully');
});

// ============================================================================
// DELETE /api/maintenance/:id - DELETE TICKET TESTS
// ============================================================================

test('DELETE /api/maintenance/:id -> should return 404 when ticket not found', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const response = await request(app)
    .delete('/api/maintenance/99999')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .expect(404);

  assert.ok(response.body);
});

test('DELETE /api/maintenance/:id -> should return 400 when id is not a number', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  
  const response = await request(app)
    .delete('/api/maintenance/invalid')
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('Geçersiz'));
});

test('DELETE /api/maintenance/:id -> should return 400 when completed ticket cannot be deleted', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  const asset = await createTestAsset(db, municipality.id);
  const ticket = await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset.id,
    status: 'completed',
  });
  
  const response = await request(app)
    .delete(`/api/maintenance/${ticket.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .expect(400);

  assert.ok(response.body);
  assert.ok(response.body.message.includes('Tamamlanmış') || response.body.message.includes('silinemez'));
});

test('DELETE /api/maintenance/:id -> should return 204 and delete ticket successfully', async () => {
  const app = getTestApp();
  const db = getTestDb();
  
  const { municipality, user: adminUser } = await createTestEnvironment(db, { userRoleId: 2 });
  const asset = await createTestAsset(db, municipality.id);
  const ticket = await createTestMaintenanceTicket(db, municipality.id, {
    asset_id: asset.id,
    status: 'open',
  });
  
  const response = await request(app)
    .delete(`/api/maintenance/${ticket.id}`)
    .set(getAuthHeader({ id: adminUser.id, role_id: adminUser.role_id, municipality_id: municipality.id }))
    .expect(204);

  // 204 No Content - body olmamalı veya boş olmalı
  if (response.body && Object.keys(response.body).length > 0) {
    throw new Error(`Response body should be empty for 204, got: ${JSON.stringify(response.body)}`);
  }
  
  // Veritabanında silindiğini doğrula
  const dbTicket = await db('maintenance_requests')
    .where({ id: ticket.id })
    .first();
  
  assert.equal(dbTicket, undefined, 'Ticket should be deleted from database');
});

