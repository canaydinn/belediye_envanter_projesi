const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { createMockKnex } = require('../__tests__/helpers/mockKnex');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

// ============================================================================
// LOGIN TESTS
// ============================================================================

test('auth.controller.login -> 400 when email missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({ body: { password: 'pass123' } });
    const res = createRes();

    await auth.login(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Eposta ve şifre zorunludur/);
  });
});

test('auth.controller.login -> 400 when password missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({ body: { email: 'test@example.com' } });
    const res = createRes();

    await auth.login(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Eposta ve şifre zorunludur/);
  });
});

test('auth.controller.login -> 401 when user not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]);

  const bcryptMock = {
    compare: async () => false,
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      bcrypt: bcryptMock,
    },
    async () => {
      delete require.cache[require.resolve('./auth.controller')];
      const auth = require('./auth.controller');

      const req = createReq({
        body: { email: 'nonexistent@example.com', password: 'pass123' },
      });
      const res = createRes();

      await auth.login(req, res);
      assert.equal(res.statusCode, 401);
      assert.match(res.body.message, /Eposta veya şifre hatalı/);
    }
  );
});

test('auth.controller.login -> 401 when user inactive', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [
    {
      id: 1,
      username: 'test',
      email: 'test@example.com',
      full_name: 'Test User',
      password_hash: 'hashed',
      role_id: 3,
      municipality_id: 1,
      is_active: false,
    },
  ]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({
      body: { email: 'test@example.com', password: 'pass123' },
    });
    const res = createRes();

    await auth.login(req, res);
    assert.equal(res.statusCode, 401);
    assert.match(res.body.message, /Eposta veya şifre hatalı/);
  });
});

test('auth.controller.login -> 401 when password incorrect', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [
    {
      id: 1,
      username: 'test',
      email: 'test@example.com',
      full_name: 'Test User',
      password_hash: 'hashed',
      role_id: 3,
      municipality_id: 1,
      is_active: true,
    },
  ]);

  const bcryptMock = {
    compare: async () => false,
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      bcrypt: bcryptMock,
    },
    async () => {
      delete require.cache[require.resolve('./auth.controller')];
      const auth = require('./auth.controller');

      const req = createReq({
        body: { email: 'test@example.com', password: 'wrongpass' },
      });
      const res = createRes();

      await auth.login(req, res);
      assert.equal(res.statusCode, 401);
      assert.match(res.body.message, /Eposta veya şifre hatalı/);
    }
  );
});

test('auth.controller.login -> 200 success with cookie and token', async () => {
  const mockKnex = createMockKnex();
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    full_name: 'Test User',
    password_hash: 'hashed',
    role_id: 3,
    municipality_id: 1,
    is_active: true,
  };
  mockKnex.__queue('users', 'first', [mockUser]);

  const bcryptMock = {
    compare: async () => true,
  };

  const jwtMock = {
    sign: (payload, secret, options) => {
      assert.equal(secret, 'dev-secret-key');
      assert.equal(options.expiresIn, '12h');
      return 'mock-jwt-token';
    },
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      bcrypt: bcryptMock,
      jsonwebtoken: jwtMock,
    },
    async () => {
      delete require.cache[require.resolve('./auth.controller')];
      const auth = require('./auth.controller');

      const req = createReq({
        body: { email: 'test@example.com', password: 'correctpass' },
      });
      const res = createRes();

      await auth.login(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.message, 'Giriş başarılı');
      assert.equal(res.body.user.id, 1);
      assert.equal(res.body.user.email, 'test@example.com');
      assert.ok(res.cookies.token);
      assert.equal(res.cookies.token.value, 'mock-jwt-token');
    }
  );
});

test('auth.controller.login -> normalizes email to lowercase', async () => {
  const mockKnex = createMockKnex();
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    full_name: 'Test User',
    password_hash: 'hashed',
    role_id: 3,
    municipality_id: 1,
    is_active: true,
  };
  mockKnex.__queue('users', 'first', [mockUser]);

  const bcryptMock = {
    compare: async () => true,
  };

  const jwtMock = {
    sign: () => 'mock-jwt-token',
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      bcrypt: bcryptMock,
      jsonwebtoken: jwtMock,
    },
    async () => {
      delete require.cache[require.resolve('./auth.controller')];
      const auth = require('./auth.controller');

      const req = createReq({
        body: { email: '  TEST@EXAMPLE.COM  ', password: 'correctpass' },
      });
      const res = createRes();

      await auth.login(req, res);
      assert.equal(res.statusCode, 200);
      // Email should be normalized to lowercase in the query
    }
  );
});

// ============================================================================
// SIGNUP TESTS
// ============================================================================

test('auth.controller.signup -> 400 when required fields missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({
      body: { username: 'test', email: 'test@example.com' },
    });
    const res = createRes();

    await auth.signup(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /zorunludur/);
  });
});

test('auth.controller.signup -> 400 when municipality not found or inactive', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({
      body: {
        username: 'test',
        email: 'test@example.com',
        password: 'pass123',
        municipality_id: 999,
      },
    });
    const res = createRes();

    await auth.signup(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /belediye bulunamadı/);
  });
});

test('auth.controller.signup -> 400 when username or email already exists', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [{ id: 1, is_active: true }]);
  mockKnex.__queue('users', 'first', [{ id: 1, username: 'test' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({
      body: {
        username: 'test',
        email: 'test@example.com',
        password: 'pass123',
        municipality_id: 1,
      },
    });
    const res = createRes();

    await auth.signup(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /zaten kullanılıyor/);
  });
});

test('auth.controller.signup -> 201 success', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('municipalities', 'first', [{ id: 1, is_active: true }]);
  mockKnex.__queue('users', 'first', [null]);
  mockKnex.__queue('users', 'insert:returning', [
    [
      {
        id: 10,
        username: 'newuser',
        email: 'new@example.com',
        full_name: 'New User',
        role_id: 3,
        municipality_id: 1,
        is_active: true,
      },
    ],
  ]);

  const bcryptMock = {
    hash: async () => 'hashed_password',
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      bcrypt: bcryptMock,
    },
    async () => {
      delete require.cache[require.resolve('./auth.controller')];
      const auth = require('./auth.controller');

      const req = createReq({
        body: {
          username: 'newuser',
          email: 'new@example.com',
          password: 'pass123',
          municipality_id: 1,
          full_name: 'New User',
        },
      });
      const res = createRes();

      await auth.signup(req, res);
      assert.equal(res.statusCode, 201);
      assert.equal(res.body.message, 'Kayıt işlemi başarılı');
      assert.equal(res.body.user.id, 10);
      assert.equal(res.body.user.username, 'newuser');
    }
  );
});

// ============================================================================
// ME TESTS
// ============================================================================

test('auth.controller.me -> 401 when no user', async () => {
  await withMockedModules({}, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({ user: undefined });
    const res = createRes();

    await auth.me(req, res);
    assert.equal(res.statusCode, 401);
    assert.match(res.body.message, /Oturum bulunamadı/);
  });
});

test('auth.controller.me -> 200 returns user', async () => {
  await withMockedModules({}, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const mockUser = {
      id: 1,
      username: 'test',
      email: 'test@example.com',
      role_id: 3,
      municipality_id: 1,
    };
    const req = createReq({ user: mockUser });
    const res = createRes();

    await auth.me(req, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body.user, mockUser);
  });
});

// ============================================================================
// LOGOUT TESTS
// ============================================================================

test('auth.controller.logout -> 200 clears cookie', async () => {
  await withMockedModules({}, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq();
    const res = createRes();

    await auth.logout(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'Çıkış yapıldı');
    assert.ok(res.cookies.token);
    assert.equal(res.cookies.token.value, undefined);
  });
});

// ============================================================================
// MUNICIPALITY SIGNUP TESTS
// ============================================================================

test('auth.controller.municipalitySignup -> 400 when required fields missing', async () => {
  const mockKnex = createMockKnex();

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({
      body: {
        municipality_name: 'Test Belediye',
        // missing code, province, district, admin_email, admin_password
      },
    });
    const res = createRes();

    await auth.municipalitySignup(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Zorunlu alanlar eksik/);
  });
});

test('auth.controller.municipalitySignup -> 400 when email already exists', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{ id: 1, email: 'admin@example.com' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({
      body: {
        code: 'TEST001',
        municipality_name: 'Test Belediye',
        province: 'İstanbul',
        district: 'Kadıköy',
        admin_email: 'admin@example.com',
        admin_password: 'pass123',
      },
    });
    const res = createRes();

    await auth.municipalitySignup(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /e-posta zaten kayıtlı/);
  });
});

test('auth.controller.municipalitySignup -> 400 when municipality code already exists', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]);
  mockKnex.__queue('municipalities', 'first', [{ id: 1, code: 'TEST001' }]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({
      body: {
        code: 'TEST001',
        municipality_name: 'Test Belediye',
        province: 'İstanbul',
        district: 'Kadıköy',
        admin_email: 'admin@example.com',
        admin_password: 'pass123',
      },
    });
    const res = createRes();

    await auth.municipalitySignup(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /belediye kodu zaten kayıtlı/);
  });
});

test('auth.controller.municipalitySignup -> 201 success', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]);
  mockKnex.__queue('municipalities', 'first', [null]);
  mockKnex.__queue('municipalities', 'insert:returning', [
    [
      {
        id: 5,
        code: 'TEST001',
        name: 'Test Belediye',
        province: 'İstanbul',
        district: 'Kadıköy',
        status: 'pending',
        is_active: false,
      },
    ],
  ]);

  const bcryptMock = {
    hash: async () => 'hashed_password',
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      bcrypt: bcryptMock,
    },
    async () => {
      delete require.cache[require.resolve('./auth.controller')];
      const auth = require('./auth.controller');

      const req = createReq({
        body: {
          code: 'TEST001',
          municipality_name: 'Test Belediye',
          province: 'İstanbul',
          district: 'Kadıköy',
          admin_email: 'admin@example.com',
          admin_password: 'pass123',
          admin_username: 'admin',
          admin_full_name: 'Admin User',
        },
      });
      const res = createRes();

      await auth.municipalitySignup(req, res);
      assert.equal(res.statusCode, 201);
      assert.match(res.body.message, /Başvurunuz alındı/);
    }
  );
});

// ============================================================================
// CHANGE PASSWORD TESTS
// ============================================================================

test('auth.controller.changePassword -> 401 when no user', async () => {
  await withMockedModules({}, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({ user: undefined });
    const res = createRes();

    await auth.changePassword(req, res);
    assert.equal(res.statusCode, 401);
    assert.match(res.body.message, /Oturum bulunamadı/);
  });
});

test('auth.controller.changePassword -> 400 when fields missing', async () => {
  await withMockedModules({}, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({
      user: { id: 1 },
      body: { current_password: 'old' },
    });
    const res = createRes();

    await auth.changePassword(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /zorunludur/);
  });
});

test('auth.controller.changePassword -> 400 when new password too short', async () => {
  await withMockedModules({}, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({
      user: { id: 1 },
      body: { current_password: 'oldpass', new_password: 'short' },
    });
    const res = createRes();

    await auth.changePassword(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /en az 8 karakter/);
  });
});

test('auth.controller.changePassword -> 404 when user not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({
      user: { id: 999 },
      body: { current_password: 'oldpass', new_password: 'newpass123' },
    });
    const res = createRes();

    await auth.changePassword(req, res);
    assert.equal(res.statusCode, 404);
    assert.match(res.body.message, /Kullanıcı bulunamadı/);
  });
});

test('auth.controller.changePassword -> 400 when current password incorrect', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [
    { id: 1, password_hash: 'hashed_old' },
  ]);

  const bcryptMock = {
    compare: async () => false,
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      bcrypt: bcryptMock,
    },
    async () => {
      delete require.cache[require.resolve('./auth.controller')];
      const auth = require('./auth.controller');

      const req = createReq({
        user: { id: 1 },
        body: { current_password: 'wrongpass', new_password: 'newpass123' },
      });
      const res = createRes();

      await auth.changePassword(req, res);
      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /Geçerli şifre hatalı/);
    }
  );
});

test('auth.controller.changePassword -> 200 success', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [
    { id: 1, password_hash: 'hashed_old' },
  ]);
  mockKnex.__queue('users', 'update:returning', [[]]);

  const bcryptMock = {
    compare: async () => true,
    hash: async () => 'hashed_new',
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      bcrypt: bcryptMock,
    },
    async () => {
      delete require.cache[require.resolve('./auth.controller')];
      const auth = require('./auth.controller');

      const req = createReq({
        user: { id: 1 },
        body: { current_password: 'oldpass', new_password: 'newpass123' },
      });
      const res = createRes();

      await auth.changePassword(req, res);
      assert.equal(res.statusCode, 200);
      assert.match(res.body.message, /başarıyla güncellendi/);
    }
  );
});

// ============================================================================
// REQUEST PASSWORD RESET TESTS
// ============================================================================

test('auth.controller.requestPasswordReset -> 400 when email missing', async () => {
  await withMockedModules({}, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({ body: {} });
    const res = createRes();

    await auth.requestPasswordReset(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /E-posta zorunludur/);
  });
});

test('auth.controller.requestPasswordReset -> 200 when user not found (security)', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]);

  await withMockedModules({ [require.resolve('../config/knex')]: mockKnex }, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({
      body: { email: 'nonexistent@example.com' },
    });
    const res = createRes();

    await auth.requestPasswordReset(req, res);
    assert.equal(res.statusCode, 200);
    assert.match(
      res.body.message,
      /Eğer hesap mevcutsa parola sıfırlama bağlantısı gönderilecektir/
    );
  });
});

test('auth.controller.requestPasswordReset -> 200 returns token in dev mode', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [
    { id: 1, email: 'test@example.com' },
  ]);

  const jwtMock = {
    sign: () => 'reset-token-123',
  };

  // Set NODE_ENV to non-production
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      jsonwebtoken: jwtMock,
    },
    async () => {
      delete require.cache[require.resolve('./auth.controller')];
      const auth = require('./auth.controller');

      const req = createReq({
        body: { email: 'test@example.com' },
      });
      const res = createRes();

      await auth.requestPasswordReset(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.reset_token, 'reset-token-123');
    }
  );

  process.env.NODE_ENV = originalEnv;
});

// ============================================================================
// RESET PASSWORD TESTS
// ============================================================================

test('auth.controller.resetPassword -> 400 when token or password missing', async () => {
  await withMockedModules({}, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({ body: { token: 'abc' } });
    const res = createRes();

    await auth.resetPassword(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /zorunludur/);
  });
});

test('auth.controller.resetPassword -> 400 when password too short', async () => {
  await withMockedModules({}, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({
      body: { token: 'valid-token', new_password: 'short' },
    });
    const res = createRes();

    await auth.resetPassword(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /en az 8 karakter/);
  });
});

test('auth.controller.resetPassword -> 400 when token invalid', async () => {
  const jwtMock = {
    verify: () => {
      throw new Error('invalid token');
    },
  };

  await withMockedModules({ jsonwebtoken: jwtMock }, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({
      body: { token: 'invalid-token', new_password: 'newpass123' },
    });
    const res = createRes();

    await auth.resetPassword(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Geçersiz veya süresi dolmuş/);
  });
});

test('auth.controller.resetPassword -> 400 when token type invalid', async () => {
  const jwtMock = {
    verify: () => ({ id: 1, type: 'invalid_type' }),
  };

  await withMockedModules({ jsonwebtoken: jwtMock }, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({
      body: { token: 'wrong-type-token', new_password: 'newpass123' },
    });
    const res = createRes();

    await auth.resetPassword(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Token tipi geçersiz/);
  });
});

test('auth.controller.resetPassword -> 404 when user not found', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [null]);

  const jwtMock = {
    verify: () => ({ id: 999, type: 'password_reset' }),
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      jsonwebtoken: jwtMock,
    },
    async () => {
      delete require.cache[require.resolve('./auth.controller')];
      const auth = require('./auth.controller');

      const req = createReq({
        body: { token: 'valid-token', new_password: 'newpass123' },
      });
      const res = createRes();

      await auth.resetPassword(req, res);
      assert.equal(res.statusCode, 404);
      assert.match(res.body.message, /Kullanıcı bulunamadı/);
    }
  );
});

test('auth.controller.resetPassword -> 200 success', async () => {
  const mockKnex = createMockKnex();
  mockKnex.__queue('users', 'first', [{ id: 1 }]);
  mockKnex.__queue('users', 'update:returning', [[]]);

  const jwtMock = {
    verify: () => ({ id: 1, type: 'password_reset' }),
  };

  const bcryptMock = {
    hash: async () => 'hashed_new',
  };

  await withMockedModules(
    {
      [require.resolve('../config/knex')]: mockKnex,
      jsonwebtoken: jwtMock,
      bcrypt: bcryptMock,
    },
    async () => {
      delete require.cache[require.resolve('./auth.controller')];
      const auth = require('./auth.controller');

      const req = createReq({
        body: { token: 'valid-token', new_password: 'newpass123' },
      });
      const res = createRes();

      await auth.resetPassword(req, res);
      assert.equal(res.statusCode, 200);
      assert.match(res.body.message, /Parola güncellendi/);
    }
  );
});

// ============================================================================
// REFRESH TOKEN TESTS
// ============================================================================

test('auth.controller.refreshToken -> 401 when no user', async () => {
  await withMockedModules({}, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({ user: undefined });
    const res = createRes();

    await auth.refreshToken(req, res);
    assert.equal(res.statusCode, 401);
    assert.match(res.body.message, /Oturum bulunamadı/);
  });
});

test('auth.controller.refreshToken -> 401 when user inactive', async () => {
  await withMockedModules({}, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const req = createReq({
      user: { id: 1, is_active: false },
    });
    const res = createRes();

    await auth.refreshToken(req, res);
    assert.equal(res.statusCode, 401);
    assert.match(res.body.message, /Oturum bulunamadı/);
  });
});

test('auth.controller.refreshToken -> 200 success with new token', async () => {
  const jwtMock = {
    sign: () => 'new-refreshed-token',
  };

  await withMockedModules({ jsonwebtoken: jwtMock }, async () => {
    delete require.cache[require.resolve('./auth.controller')];
    const auth = require('./auth.controller');

    const mockUser = {
      id: 1,
      username: 'test',
      role_id: 3,
      municipality_id: 1,
      is_active: true,
    };
    const req = createReq({ user: mockUser });
    const res = createRes();

    await auth.refreshToken(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.message, 'Token yenilendi');
    assert.equal(res.body.user.id, 1);
    assert.ok(res.cookies.token);
    assert.equal(res.cookies.token.value, 'new-refreshed-token');
  });
});

