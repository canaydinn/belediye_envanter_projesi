const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes, createNext } = require('../__tests__/helpers/httpMocks');

test('middleware/tenantScope -> allows superadmin when allowSuperadmin=true', () => {
  const tenantScope = require('./tenantScope');
  const mw = tenantScope({ allowSuperadmin: true });

  const req = createReq({ user: { role_id: 1, municipality_id: null } });
  const res = createRes();
  const next = createNext();

  mw(req, res, next);
  assert.equal(next.called, true);
});

test('middleware/tenantScope -> blocks tenant user without municipality_id', () => {
  const tenantScope = require('./tenantScope');
  const mw = tenantScope();

  const req = createReq({ user: { role_id: 3, municipality_id: null } });
  const res = createRes();
  const next = createNext();

  mw(req, res, next);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { message: 'Belediye kapsamı bulunamadı' });
  assert.equal(next.called, false);
});

test('middleware/tenantScope -> sets tenantMunicipalityId', () => {
  const tenantScope = require('./tenantScope');
  const mw = tenantScope();

  const req = createReq({ user: { role_id: 3, municipality_id: 42 } });
  const res = createRes();
  const next = createNext();

  mw(req, res, next);
  assert.equal(req.tenantMunicipalityId, 42);
  assert.equal(next.called, true);
});
