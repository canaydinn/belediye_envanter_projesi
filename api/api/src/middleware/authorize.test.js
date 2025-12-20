const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes, createNext } = require('../__tests__/helpers/httpMocks');

test('middleware/authorize -> 403 when role not allowed', () => {
  const authorize = require('./authorize');
  const mw = authorize(1);

  const req = createReq({ user: { role_id: 3 }, originalUrl: '/api/x' });
  const res = createRes();
  const next = createNext();

  mw(req, res, next);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { message: 'Bu işlem için yetkiniz yok' });
  assert.equal(next.called, false);
});

test('middleware/authorize -> next when allowed', () => {
  const authorize = require('./authorize');
  const mw = authorize(1, 3);

  const req = createReq({ user: { role_id: 3 }, originalUrl: '/api/x' });
  const res = createRes();
  const next = createNext();

  mw(req, res, next);
  assert.equal(next.called, true);
});
