const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');
const ROLES = require('../constants/roles');

// ============================================================================
// Route Configuration Tests for User Routes
// ============================================================================

test('user.routes -> GET /stats route is configured correctly', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getSummaryStats: async () => {},
    getDetailedList: async () => {},
    getTodayLogins: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    toggleStatus: async () => {},
    resetPassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/users.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./user.routes')];
      const router = require('./user.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/stats' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /stats route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[0], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.getSummaryStats);
    }
  );
});

test('user.routes -> GET /detailed route is configured correctly', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getSummaryStats: async () => {},
    getDetailedList: async () => {},
    getTodayLogins: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    toggleStatus: async () => {},
    resetPassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/users.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./user.routes')];
      const router = require('./user.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/detailed' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /detailed route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[1], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.getDetailedList);
    }
  );
});

test('user.routes -> GET /today-logins route is configured correctly', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getSummaryStats: async () => {},
    getDetailedList: async () => {},
    getTodayLogins: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    toggleStatus: async () => {},
    resetPassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/users.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./user.routes')];
      const router = require('./user.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/today-logins' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /today-logins route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[2], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.getTodayLogins);
    }
  );
});

test('user.routes -> GET /:id route is configured correctly', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getSummaryStats: async () => {},
    getDetailedList: async () => {},
    getTodayLogins: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    toggleStatus: async () => {},
    resetPassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/users.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./user.routes')];
      const router = require('./user.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[3], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.getById);
    }
  );
});

test('user.routes -> POST / route is configured correctly', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getSummaryStats: async () => {},
    getDetailedList: async () => {},
    getTodayLogins: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    toggleStatus: async () => {},
    resetPassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/users.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./user.routes')];
      const router = require('./user.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST / route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[4], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.create);
    }
  );
});

test('user.routes -> PUT /:id route is configured correctly', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getSummaryStats: async () => {},
    getDetailedList: async () => {},
    getTodayLogins: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    toggleStatus: async () => {},
    resetPassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/users.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./user.routes')];
      const router = require('./user.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.put
      );

      assert.ok(route, 'PUT /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[5], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.update);
    }
  );
});

test('user.routes -> PATCH /:id/toggle-status route is configured correctly', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getSummaryStats: async () => {},
    getDetailedList: async () => {},
    getTodayLogins: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    toggleStatus: async () => {},
    resetPassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/users.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./user.routes')];
      const router = require('./user.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id/toggle-status' && 
        layer.route.methods.patch
      );

      assert.ok(route, 'PATCH /:id/toggle-status route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[6], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.toggleStatus);
    }
  );
});

test('user.routes -> POST /:id/reset-password route is configured correctly', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getSummaryStats: async () => {},
    getDetailedList: async () => {},
    getTodayLogins: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    toggleStatus: async () => {},
    resetPassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/users.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./user.routes')];
      const router = require('./user.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id/reset-password' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST /:id/reset-password route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[7], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.resetPassword);
    }
  );
});

// ============================================================================
// Comprehensive Route Registration Tests
// ============================================================================

test('user.routes -> all routes are properly registered', async () => {
  const mockAuthorize = () => (req, res, next) => next();

  const mockController = {
    getSummaryStats: async () => {},
    getDetailedList: async () => {},
    getTodayLogins: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    toggleStatus: async () => {},
    resetPassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/users.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./user.routes')];
      const router = require('./user.routes');

      // Count all routes
      const allRoutes = router.stack.filter((layer) => layer.route);
      
      assert.equal(allRoutes.length, 8, 'Should have exactly 8 routes');
      
      // Verify route paths and methods
      const routePaths = allRoutes.map((layer) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
      }));

      const expectedRoutes = [
        { path: '/stats', method: 'GET' },
        { path: '/detailed', method: 'GET' },
        { path: '/today-logins', method: 'GET' },
        { path: '/:id', method: 'GET' },
        { path: '/', method: 'POST' },
        { path: '/:id', method: 'PUT' },
        { path: '/:id/toggle-status', method: 'PATCH' },
        { path: '/:id/reset-password', method: 'POST' },
      ];

      expectedRoutes.forEach((expected) => {
        const found = routePaths.find((r) => r.path === expected.path && r.method === expected.method);
        assert.ok(found, `Route ${expected.method} ${expected.path} should exist`);
      });
    }
  );
});

test('user.routes -> all routes have correct handler assignments', async () => {
  const mockAuthorize = () => (req, res, next) => next();

  const mockController = {
    getSummaryStats: async () => {},
    getDetailedList: async () => {},
    getTodayLogins: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    toggleStatus: async () => {},
    resetPassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/users.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./user.routes')];
      const router = require('./user.routes');

      // Verify handler assignments
      const getStatsRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/stats' && 
        layer.route.methods.get
      );
      assert.ok(getStatsRoute, 'GET /stats route should exist');
      assert.equal(
        getStatsRoute.route.stack[1].handle, 
        mockController.getSummaryStats,
        'GET /stats should use getSummaryStats controller'
      );

      const getDetailedRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/detailed' && 
        layer.route.methods.get
      );
      assert.ok(getDetailedRoute, 'GET /detailed route should exist');
      assert.equal(
        getDetailedRoute.route.stack[1].handle, 
        mockController.getDetailedList,
        'GET /detailed should use getDetailedList controller'
      );

      const getTodayLoginsRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/today-logins' && 
        layer.route.methods.get
      );
      assert.ok(getTodayLoginsRoute, 'GET /today-logins route should exist');
      assert.equal(
        getTodayLoginsRoute.route.stack[1].handle, 
        mockController.getTodayLogins,
        'GET /today-logins should use getTodayLogins controller'
      );

      const getByIdRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.get
      );
      assert.ok(getByIdRoute, 'GET /:id route should exist');
      assert.equal(
        getByIdRoute.route.stack[1].handle, 
        mockController.getById,
        'GET /:id should use getById controller'
      );

      const postRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.post
      );
      assert.ok(postRoute, 'POST / route should exist');
      assert.equal(
        postRoute.route.stack[1].handle, 
        mockController.create,
        'POST / should use create controller'
      );

      const putRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.put
      );
      assert.ok(putRoute, 'PUT /:id route should exist');
      assert.equal(
        putRoute.route.stack[1].handle, 
        mockController.update,
        'PUT /:id should use update controller'
      );

      const patchToggleRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id/toggle-status' && 
        layer.route.methods.patch
      );
      assert.ok(patchToggleRoute, 'PATCH /:id/toggle-status route should exist');
      assert.equal(
        patchToggleRoute.route.stack[1].handle, 
        mockController.toggleStatus,
        'PATCH /:id/toggle-status should use toggleStatus controller'
      );

      const postResetRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id/reset-password' && 
        layer.route.methods.post
      );
      assert.ok(postResetRoute, 'POST /:id/reset-password route should exist');
      assert.equal(
        postResetRoute.route.stack[1].handle, 
        mockController.resetPassword,
        'POST /:id/reset-password should use resetPassword controller'
      );
    }
  );
});

test('user.routes -> all routes require MUNICIPALITY_ADMIN role', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getSummaryStats: async () => {},
    getDetailedList: async () => {},
    getTodayLogins: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    toggleStatus: async () => {},
    resetPassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/users.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./user.routes')];
      const router = require('./user.routes');

      const allRoutes = router.stack.filter((layer) => layer.route);
      
      assert.equal(allRoutes.length, 8, 'Should have exactly 8 routes');
      
      // Verify all routes use MUNICIPALITY_ADMIN role
      capturedRoles.forEach((roles, index) => {
        assert.deepEqual(roles, [ROLES.MUNICIPALITY_ADMIN], 
          `Route at index ${index} should require MUNICIPALITY_ADMIN role`);
      });
    }
  );
});

test('user.routes -> all routes have authorize middleware', async () => {
  const mockAuthorize = () => (req, res, next) => next();

  const mockController = {
    getSummaryStats: async () => {},
    getDetailedList: async () => {},
    getTodayLogins: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    toggleStatus: async () => {},
    resetPassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/users.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./user.routes')];
      const router = require('./user.routes');

      const allRoutes = router.stack.filter((layer) => layer.route);

      allRoutes.forEach((route) => {
        assert.equal(
          route.route.stack.length,
          2,
          `Route ${Object.keys(route.route.methods)[0].toUpperCase()} ${route.route.path} should have 2 handlers (authorize + controller)`
        );
      });
    }
  );
});

