const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');

// ============================================================================
// Route Configuration Tests
// ============================================================================

test('auth.routes -> POST /login route is configured correctly (public)', async () => {
  const mockController = {
    login: async () => {},
    signup: async () => {},
    municipalitySignup: async () => {},
    requestPasswordReset: async () => {},
    resetPassword: async () => {},
    me: async () => {},
    changePassword: async () => {},
    refreshToken: async () => {},
    logout: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/auth.controller')]: mockController,
      [require.resolve('../middleware/auth')]: (req, res, next) => next(),
      [require.resolve('../middleware/softAuth')]: (req, res, next) => next(),
    },
    async () => {
      delete require.cache[require.resolve('./auth.routes')];
      const router = require('./auth.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/login' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST /login route should exist');
      assert.equal(route.route.stack.length, 1, 'Route should have 1 handler (no middleware)');
      assert.equal(route.route.stack[0].handle, mockController.login);
    }
  );
});

test('auth.routes -> POST /signup route is configured correctly (public)', async () => {
  const mockController = {
    login: async () => {},
    signup: async () => {},
    municipalitySignup: async () => {},
    requestPasswordReset: async () => {},
    resetPassword: async () => {},
    me: async () => {},
    changePassword: async () => {},
    refreshToken: async () => {},
    logout: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/auth.controller')]: mockController,
      [require.resolve('../middleware/auth')]: (req, res, next) => next(),
      [require.resolve('../middleware/softAuth')]: (req, res, next) => next(),
    },
    async () => {
      delete require.cache[require.resolve('./auth.routes')];
      const router = require('./auth.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/signup' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST /signup route should exist');
      assert.equal(route.route.stack.length, 1, 'Route should have 1 handler (no middleware)');
      assert.equal(route.route.stack[0].handle, mockController.signup);
    }
  );
});

test('auth.routes -> POST /municipality-signup route is configured correctly (public)', async () => {
  const mockController = {
    login: async () => {},
    signup: async () => {},
    municipalitySignup: async () => {},
    requestPasswordReset: async () => {},
    resetPassword: async () => {},
    me: async () => {},
    changePassword: async () => {},
    refreshToken: async () => {},
    logout: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/auth.controller')]: mockController,
      [require.resolve('../middleware/auth')]: (req, res, next) => next(),
      [require.resolve('../middleware/softAuth')]: (req, res, next) => next(),
    },
    async () => {
      delete require.cache[require.resolve('./auth.routes')];
      const router = require('./auth.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipality-signup' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST /municipality-signup route should exist');
      assert.equal(route.route.stack.length, 1, 'Route should have 1 handler (no middleware)');
      assert.equal(route.route.stack[0].handle, mockController.municipalitySignup);
    }
  );
});

test('auth.routes -> POST /request-password-reset route is configured correctly (public)', async () => {
  const mockController = {
    login: async () => {},
    signup: async () => {},
    municipalitySignup: async () => {},
    requestPasswordReset: async () => {},
    resetPassword: async () => {},
    me: async () => {},
    changePassword: async () => {},
    refreshToken: async () => {},
    logout: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/auth.controller')]: mockController,
      [require.resolve('../middleware/auth')]: (req, res, next) => next(),
      [require.resolve('../middleware/softAuth')]: (req, res, next) => next(),
    },
    async () => {
      delete require.cache[require.resolve('./auth.routes')];
      const router = require('./auth.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/request-password-reset' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST /request-password-reset route should exist');
      assert.equal(route.route.stack.length, 1, 'Route should have 1 handler (no middleware)');
      assert.equal(route.route.stack[0].handle, mockController.requestPasswordReset);
    }
  );
});

test('auth.routes -> POST /reset-password route is configured correctly (public)', async () => {
  const mockController = {
    login: async () => {},
    signup: async () => {},
    municipalitySignup: async () => {},
    requestPasswordReset: async () => {},
    resetPassword: async () => {},
    me: async () => {},
    changePassword: async () => {},
    refreshToken: async () => {},
    logout: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/auth.controller')]: mockController,
      [require.resolve('../middleware/auth')]: (req, res, next) => next(),
      [require.resolve('../middleware/softAuth')]: (req, res, next) => next(),
    },
    async () => {
      delete require.cache[require.resolve('./auth.routes')];
      const router = require('./auth.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/reset-password' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST /reset-password route should exist');
      assert.equal(route.route.stack.length, 1, 'Route should have 1 handler (no middleware)');
      assert.equal(route.route.stack[0].handle, mockController.resetPassword);
    }
  );
});

test('auth.routes -> GET /me route is configured with auth middleware', async () => {
  let authMiddlewareCalled = false;
  const mockAuth = (req, res, next) => {
    authMiddlewareCalled = true;
    next();
  };

  const mockController = {
    login: async () => {},
    signup: async () => {},
    municipalitySignup: async () => {},
    requestPasswordReset: async () => {},
    resetPassword: async () => {},
    me: async () => {},
    changePassword: async () => {},
    refreshToken: async () => {},
    logout: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/auth.controller')]: mockController,
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/softAuth')]: (req, res, next) => next(),
    },
    async () => {
      delete require.cache[require.resolve('./auth.routes')];
      const router = require('./auth.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/me' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /me route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (auth + controller)');
      assert.equal(route.route.stack[0].handle, mockAuth);
      assert.equal(route.route.stack[1].handle, mockController.me);
    }
  );
});

test('auth.routes -> POST /change-password route is configured with auth middleware', async () => {
  const mockAuth = (req, res, next) => next();

  const mockController = {
    login: async () => {},
    signup: async () => {},
    municipalitySignup: async () => {},
    requestPasswordReset: async () => {},
    resetPassword: async () => {},
    me: async () => {},
    changePassword: async () => {},
    refreshToken: async () => {},
    logout: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/auth.controller')]: mockController,
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/softAuth')]: (req, res, next) => next(),
    },
    async () => {
      delete require.cache[require.resolve('./auth.routes')];
      const router = require('./auth.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/change-password' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST /change-password route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (auth + controller)');
      assert.equal(route.route.stack[0].handle, mockAuth);
      assert.equal(route.route.stack[1].handle, mockController.changePassword);
    }
  );
});

test('auth.routes -> POST /refresh route is configured with softAuth middleware', async () => {
  const mockSoftAuth = (req, res, next) => next();

  const mockController = {
    login: async () => {},
    signup: async () => {},
    municipalitySignup: async () => {},
    requestPasswordReset: async () => {},
    resetPassword: async () => {},
    me: async () => {},
    changePassword: async () => {},
    refreshToken: async () => {},
    logout: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/auth.controller')]: mockController,
      [require.resolve('../middleware/auth')]: (req, res, next) => next(),
      [require.resolve('../middleware/softAuth')]: mockSoftAuth,
    },
    async () => {
      delete require.cache[require.resolve('./auth.routes')];
      const router = require('./auth.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/refresh' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST /refresh route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (softAuth + controller)');
      assert.equal(route.route.stack[0].handle, mockSoftAuth);
      assert.equal(route.route.stack[1].handle, mockController.refreshToken);
    }
  );
});

test('auth.routes -> POST /logout route is configured with auth middleware', async () => {
  const mockAuth = (req, res, next) => next();

  const mockController = {
    login: async () => {},
    signup: async () => {},
    municipalitySignup: async () => {},
    requestPasswordReset: async () => {},
    resetPassword: async () => {},
    me: async () => {},
    changePassword: async () => {},
    refreshToken: async () => {},
    logout: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/auth.controller')]: mockController,
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/softAuth')]: (req, res, next) => next(),
    },
    async () => {
      delete require.cache[require.resolve('./auth.routes')];
      const router = require('./auth.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/logout' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST /logout route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (auth + controller)');
      assert.equal(route.route.stack[0].handle, mockAuth);
      assert.equal(route.route.stack[1].handle, mockController.logout);
    }
  );
});

test('auth.routes -> all routes are properly registered', async () => {
  const mockController = {
    login: async () => {},
    signup: async () => {},
    municipalitySignup: async () => {},
    requestPasswordReset: async () => {},
    resetPassword: async () => {},
    me: async () => {},
    changePassword: async () => {},
    refreshToken: async () => {},
    logout: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/auth.controller')]: mockController,
      [require.resolve('../middleware/auth')]: (req, res, next) => next(),
      [require.resolve('../middleware/softAuth')]: (req, res, next) => next(),
    },
    async () => {
      delete require.cache[require.resolve('./auth.routes')];
      const router = require('./auth.routes');

      // Count all routes
      const allRoutes = router.stack.filter((layer) => layer.route);
      
      assert.equal(allRoutes.length, 9, 'Should have exactly 9 routes');
      
      // Verify route paths and methods
      const routePaths = allRoutes.map((layer) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
      }));

      const expectedRoutes = [
        { path: '/login', method: 'POST' },
        { path: '/signup', method: 'POST' },
        { path: '/municipality-signup', method: 'POST' },
        { path: '/request-password-reset', method: 'POST' },
        { path: '/reset-password', method: 'POST' },
        { path: '/me', method: 'GET' },
        { path: '/change-password', method: 'POST' },
        { path: '/refresh', method: 'POST' },
        { path: '/logout', method: 'POST' },
      ];

      expectedRoutes.forEach((expected) => {
        const found = routePaths.find((r) => r.path === expected.path && r.method === expected.method);
        assert.ok(found, `Route ${expected.method} ${expected.path} should exist`);
      });
    }
  );
});

test('auth.routes -> public routes have no middleware', async () => {
  const mockController = {
    login: async () => {},
    signup: async () => {},
    municipalitySignup: async () => {},
    requestPasswordReset: async () => {},
    resetPassword: async () => {},
    me: async () => {},
    changePassword: async () => {},
    refreshToken: async () => {},
    logout: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/auth.controller')]: mockController,
      [require.resolve('../middleware/auth')]: (req, res, next) => next(),
      [require.resolve('../middleware/softAuth')]: (req, res, next) => next(),
    },
    async () => {
      delete require.cache[require.resolve('./auth.routes')];
      const router = require('./auth.routes');

      const publicRoutes = [
        '/login',
        '/signup',
        '/municipality-signup',
        '/request-password-reset',
        '/reset-password',
      ];

      publicRoutes.forEach((path) => {
        const route = router.stack.find((layer) => 
          layer.route && 
          layer.route.path === path && 
          layer.route.methods.post
        );

        assert.ok(route, `Route ${path} should exist`);
        assert.equal(
          route.route.stack.length, 
          1, 
          `Public route ${path} should have only 1 handler (no middleware)`
        );
      });
    }
  );
});

test('auth.routes -> protected routes use auth middleware', async () => {
  const mockAuth = (req, res, next) => next();

  const mockController = {
    login: async () => {},
    signup: async () => {},
    municipalitySignup: async () => {},
    requestPasswordReset: async () => {},
    resetPassword: async () => {},
    me: async () => {},
    changePassword: async () => {},
    refreshToken: async () => {},
    logout: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/auth.controller')]: mockController,
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/softAuth')]: (req, res, next) => next(),
    },
    async () => {
      delete require.cache[require.resolve('./auth.routes')];
      const router = require('./auth.routes');

      const protectedRoutes = [
        { path: '/me', method: 'GET' },
        { path: '/change-password', method: 'POST' },
        { path: '/logout', method: 'POST' },
      ];

      protectedRoutes.forEach(({ path, method }) => {
        const route = router.stack.find((layer) => 
          layer.route && 
          layer.route.path === path && 
          layer.route.methods[method.toLowerCase()]
        );

        assert.ok(route, `Route ${method} ${path} should exist`);
        assert.equal(
          route.route.stack.length, 
          2, 
          `Protected route ${path} should have 2 handlers (auth + controller)`
        );
        assert.equal(
          route.route.stack[0].handle, 
          mockAuth, 
          `Protected route ${path} should use auth middleware`
        );
      });
    }
  );
});

test('auth.routes -> refresh route uses softAuth middleware', async () => {
  const mockSoftAuth = (req, res, next) => next();

  const mockController = {
    login: async () => {},
    signup: async () => {},
    municipalitySignup: async () => {},
    requestPasswordReset: async () => {},
    resetPassword: async () => {},
    me: async () => {},
    changePassword: async () => {},
    refreshToken: async () => {},
    logout: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/auth.controller')]: mockController,
      [require.resolve('../middleware/auth')]: (req, res, next) => next(),
      [require.resolve('../middleware/softAuth')]: mockSoftAuth,
    },
    async () => {
      delete require.cache[require.resolve('./auth.routes')];
      const router = require('./auth.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/refresh' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST /refresh route should exist');
      assert.equal(
        route.route.stack.length, 
        2, 
        'Refresh route should have 2 handlers (softAuth + controller)'
      );
      assert.equal(
        route.route.stack[0].handle, 
        mockSoftAuth, 
        'Refresh route should use softAuth middleware'
      );
      assert.equal(
        route.route.stack[1].handle, 
        mockController.refreshToken, 
        'Refresh route should use refreshToken controller'
      );
    }
  );
});

test('auth.routes -> all routes have correct handler assignments', async () => {
  const mockController = {
    login: async () => {},
    signup: async () => {},
    municipalitySignup: async () => {},
    requestPasswordReset: async () => {},
    resetPassword: async () => {},
    me: async () => {},
    changePassword: async () => {},
    refreshToken: async () => {},
    logout: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/auth.controller')]: mockController,
      [require.resolve('../middleware/auth')]: (req, res, next) => next(),
      [require.resolve('../middleware/softAuth')]: (req, res, next) => next(),
    },
    async () => {
      delete require.cache[require.resolve('./auth.routes')];
      const router = require('./auth.routes');

      // Verify handler assignments for public routes
      const loginRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/login' && layer.route.methods.post
      );
      assert.equal(loginRoute.route.stack[0].handle, mockController.login);

      const signupRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/signup' && layer.route.methods.post
      );
      assert.equal(signupRoute.route.stack[0].handle, mockController.signup);

      const municipalitySignupRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/municipality-signup' && layer.route.methods.post
      );
      assert.equal(municipalitySignupRoute.route.stack[0].handle, mockController.municipalitySignup);

      const requestPasswordResetRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/request-password-reset' && layer.route.methods.post
      );
      assert.equal(requestPasswordResetRoute.route.stack[0].handle, mockController.requestPasswordReset);

      const resetPasswordRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/reset-password' && layer.route.methods.post
      );
      assert.equal(resetPasswordRoute.route.stack[0].handle, mockController.resetPassword);

      // Verify handler assignments for protected routes
      const meRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/me' && layer.route.methods.get
      );
      assert.equal(meRoute.route.stack[1].handle, mockController.me);

      const changePasswordRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/change-password' && layer.route.methods.post
      );
      assert.equal(changePasswordRoute.route.stack[1].handle, mockController.changePassword);

      const refreshRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/refresh' && layer.route.methods.post
      );
      assert.equal(refreshRoute.route.stack[1].handle, mockController.refreshToken);

      const logoutRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/logout' && layer.route.methods.post
      );
      assert.equal(logoutRoute.route.stack[1].handle, mockController.logout);
    }
  );
});

