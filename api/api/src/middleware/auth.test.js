const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes, createNext } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

test('middleware/auth -> 401 if no token in cookie nor Bearer header', async () => {
  const mockKnex = createMockKnex();
  const jwtMock = { verify: () => ({ id: 1 }) };

  await withMockedModules(
    {
      jsonwebtoken: jwtMock,
      [require.resolve('../config/knex')]: mockKnex,
    },
    async () => {
      const auth = require('./auth');
      const req = createReq({ cookies: {}, headers: {} });
      const res = createRes();
      const next = createNext();

      await auth(req, res, next);

      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.body, { message: 'Oturum bulunamadı' });
      assert.equal(next.called, false);
    }
  );
});

test('middleware/auth -> prefers Bearer token over cookie token', async () => {
  const mockKnex = createMockKnex();

  // ✅ createMockKnex'in beklediği şekilde users.first yanıtı sıraya al
  mockKnex.__queue('users', 'first', [
    { id: 1, is_active: true, role_id: 3, municipality_id: 1, username: 'u', email: 'e' },
  ]);

  const jwtMock = {
    verify: (token) => {
      assert.equal(token, 'HEADER');
      return { id: 1 };
    },
  };

  await withMockedModules(
    {
      jsonwebtoken: jwtMock,
      [require.resolve('../config/knex')]: mockKnex, // ✅ doğru anahtar
    },
    async () => {
      delete require.cache[require.resolve('./auth')];

      const auth = require('./auth');
      const req = createReq({
        originalUrl: '/api/test',
        cookies: { token: 'COOKIE' },
        headers: { authorization: 'Bearer HEADER' },
      });
      const res = createRes();
      const next = createNext();

      await auth(req, res, next);

      assert.equal(next.called, true);
      assert.ok(req.user);
      assert.equal(req.user.id, 1);
    }
  );
});

test('middleware/auth -> 401 if token invalid/expired', async () => {
  const mockKnex = createMockKnex();

  // Invalid token senaryosunda DB'ye düşmemeli; düşerse test bozulur
  // (createMockKnex çağrılır ama kuyruklanmış yanıt yok -> çoğu mock yapısında hata/undefined üreterek yakalar)

  const jwtMock = {
    verify: () => {
      throw new Error('jwt expired');
    },
  };

  await withMockedModules(
    {
      jsonwebtoken: jwtMock,
      [require.resolve('../config/knex')]: mockKnex,
    },
    async () => {
      delete require.cache[require.resolve('./auth')];

      const auth = require('./auth');

      const req = createReq({
        originalUrl: '/test',
        cookies: {},
        headers: { authorization: 'Bearer BAD' },
      });
      const res = createRes();
      const next = createNext();

      await auth(req, res, next);

      assert.equal(next.called, false);
      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.body, { message: 'Geçersiz veya süresi dolmuş token' });
    }
  );
});

test('middleware/auth -> 401 if user not found/inactive', async () => {
  const mockKnex = createMockKnex();
  const jwtMock = { verify: () => ({ id: 99 }) };

  // DB: user bulunamadı
  mockKnex.__queue('users', 'first', [null]);

  await withMockedModules(
    {
      jsonwebtoken: jwtMock,
      [require.resolve('../config/knex')]: mockKnex,
    },
    async () => {
      delete require.cache[require.resolve('./auth')];

      const auth = require('./auth');
      const req = createReq({ headers: { authorization: 'Bearer OK' } });
      const res = createRes();
      const next = createNext();

      await auth(req, res, next);

      assert.equal(res.statusCode, 401);
      assert.deepEqual(res.body, { message: 'Kullanıcı pasif veya bulunamadı' });
      assert.equal(next.called, false);
    }
  );
});
