const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');

test('utils/jwt -> generateToken signs with id and role_id', async () => {
  const calls = [];
  const jwtMock = {
    sign: (payload, secret, opts) => {
      calls.push({ payload, secret, opts });
      return 'TOKEN';
    },
    verify: () => ({ id: 1, role_id: 3 }),
  };

  await withMockedModules({ jsonwebtoken: jwtMock }, async () => {
    // re-require after mocking jsonwebtoken
    delete require.cache[require.resolve('./jwt')];
    const { generateToken } = require('./jwt');
    const token = generateToken({ id: 5, role_id: 1 });
    assert.equal(token, 'TOKEN');
    assert.deepEqual(calls[0].payload, { id: 5, role_id: 1 });
    assert.deepEqual(calls[0].opts, { expiresIn: '1d' });
  });
});

test('utils/jwt -> verifyToken delegates to jwt.verify', async () => {
  let verifyArgs;
  const jwtMock = {
    sign: () => 'TOKEN',
    verify: (token, secret) => {
      verifyArgs = { token, secret };
      return { id: 99, role_id: 1 };
    },
  };

  await withMockedModules({ jsonwebtoken: jwtMock }, async () => {
    delete require.cache[require.resolve('./jwt')];
    const { verifyToken } = require('./jwt');
    const payload = verifyToken('abc');
    assert.equal(verifyArgs.token, 'abc');
    assert.ok(typeof verifyArgs.secret === 'string');
    assert.deepEqual(payload, { id: 99, role_id: 1 });
  });
});
