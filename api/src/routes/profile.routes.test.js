const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');

// ============================================================================
// Route Configuration Tests
// ============================================================================

test('profile.routes -> GET / route is configured correctly', async () => {
  const mockController = {
    getProfile: async () => {},
    updateProfile: async () => {},
    updatePassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/profile.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./profile.routes')];
      const router = require('./profile.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET / route should exist');
      assert.equal(route.route.stack.length, 1, 'Route should have 1 handler (controller only)');
      assert.equal(route.route.stack[0].handle, mockController.getProfile);
    }
  );
});

test('profile.routes -> PUT / route is configured correctly', async () => {
  const mockController = {
    getProfile: async () => {},
    updateProfile: async () => {},
    updatePassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/profile.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./profile.routes')];
      const router = require('./profile.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.put
      );

      assert.ok(route, 'PUT / route should exist');
      assert.equal(route.route.stack.length, 1, 'Route should have 1 handler (controller only)');
      assert.equal(route.route.stack[0].handle, mockController.updateProfile);
    }
  );
});

test('profile.routes -> PUT /password route is configured correctly', async () => {
  const mockController = {
    getProfile: async () => {},
    updateProfile: async () => {},
    updatePassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/profile.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./profile.routes')];
      const router = require('./profile.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/password' && 
        layer.route.methods.put
      );

      assert.ok(route, 'PUT /password route should exist');
      assert.equal(route.route.stack.length, 1, 'Route should have 1 handler (controller only)');
      assert.equal(route.route.stack[0].handle, mockController.updatePassword);
    }
  );
});

test('profile.routes -> all routes are properly registered', async () => {
  const mockController = {
    getProfile: async () => {},
    updateProfile: async () => {},
    updatePassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/profile.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./profile.routes')];
      const router = require('./profile.routes');

      // Count all routes
      const allRoutes = router.stack.filter((layer) => layer.route);
      
      assert.equal(allRoutes.length, 3, 'Should have exactly 3 routes');
      
      // Verify route paths and methods
      const routePaths = allRoutes.map((layer) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
      }));

      const expectedRoutes = [
        { path: '/', method: 'GET' },
        { path: '/', method: 'PUT' },
        { path: '/password', method: 'PUT' },
      ];

      expectedRoutes.forEach((expected) => {
        const found = routePaths.find((r) => r.path === expected.path && r.method === expected.method);
        assert.ok(found, `Route ${expected.method} ${expected.path} should exist`);
      });
    }
  );
});

test('profile.routes -> all routes have correct handler assignments', async () => {
  const mockController = {
    getProfile: async () => {},
    updateProfile: async () => {},
    updatePassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/profile.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./profile.routes')];
      const router = require('./profile.routes');

      // Verify handler assignments
      const getProfileRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/' && layer.route.methods.get
      );
      assert.equal(getProfileRoute.route.stack[0].handle, mockController.getProfile);

      const updateProfileRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/' && layer.route.methods.put
      );
      assert.equal(updateProfileRoute.route.stack[0].handle, mockController.updateProfile);

      const updatePasswordRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/password' && layer.route.methods.put
      );
      assert.equal(updatePasswordRoute.route.stack[0].handle, mockController.updatePassword);
    }
  );
});

test('profile.routes -> all routes have only controller handlers (no middleware in route file)', async () => {
  const mockController = {
    getProfile: async () => {},
    updateProfile: async () => {},
    updatePassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/profile.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./profile.routes')];
      const router = require('./profile.routes');

      const allRoutes = router.stack.filter((layer) => layer.route);
      
      allRoutes.forEach((route) => {
        assert.equal(
          route.route.stack.length, 
          1, 
          `Route ${route.route.path} (${Object.keys(route.route.methods)[0].toUpperCase()}) should have only 1 handler (controller, middleware is applied in index.js)`
        );
      });
    }
  );
});

test('profile.routes -> route order is correct', async () => {
  const mockController = {
    getProfile: async () => {},
    updateProfile: async () => {},
    updatePassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/profile.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./profile.routes')];
      const router = require('./profile.routes');

      const allRoutes = router.stack.filter((layer) => layer.route);
      
      // Express routes are registered in order, so we can verify the order
      const routeOrder = allRoutes.map((layer) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
      }));

      // Expected order: GET /, PUT /, PUT /password
      assert.equal(routeOrder[0].method, 'GET', 'First route should be GET /');
      assert.equal(routeOrder[0].path, '/', 'First route should be GET /');
      assert.equal(routeOrder[1].method, 'PUT', 'Second route should be PUT /');
      assert.equal(routeOrder[1].path, '/', 'Second route should be PUT /');
      assert.equal(routeOrder[2].method, 'PUT', 'Third route should be PUT /password');
      assert.equal(routeOrder[2].path, '/password', 'Third route should be PUT /password');
    }
  );
});

test('profile.routes -> routes use correct HTTP methods', async () => {
  const mockController = {
    getProfile: async () => {},
    updateProfile: async () => {},
    updatePassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/profile.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./profile.routes')];
      const router = require('./profile.routes');

      // Verify GET / uses GET method
      const getRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/' && layer.route.methods.get
      );
      assert.ok(getRoute, 'GET / route should exist');
      assert.ok(getRoute.route.methods.get, 'GET / should use GET method');
      assert.ok(!getRoute.route.methods.post, 'GET / should not use POST method');
      assert.ok(!getRoute.route.methods.put, 'GET / should not use PUT method');

      // Verify PUT / uses PUT method
      const putRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/' && layer.route.methods.put
      );
      assert.ok(putRoute, 'PUT / route should exist');
      assert.ok(putRoute.route.methods.put, 'PUT / should use PUT method');
      assert.ok(!putRoute.route.methods.get, 'PUT / should not use GET method');
      assert.ok(!putRoute.route.methods.post, 'PUT / should not use POST method');

      // Verify PUT /password uses PUT method
      const putPasswordRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/password' && layer.route.methods.put
      );
      assert.ok(putPasswordRoute, 'PUT /password route should exist');
      assert.ok(putPasswordRoute.route.methods.put, 'PUT /password should use PUT method');
      assert.ok(!putPasswordRoute.route.methods.get, 'PUT /password should not use GET method');
      assert.ok(!putPasswordRoute.route.methods.post, 'PUT /password should not use POST method');
    }
  );
});

test('profile.routes -> no duplicate routes exist', async () => {
  const mockController = {
    getProfile: async () => {},
    updateProfile: async () => {},
    updatePassword: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/profile.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./profile.routes')];
      const router = require('./profile.routes');

      const allRoutes = router.stack.filter((layer) => layer.route);
      
      // Check for duplicates by path and method combination
      const routeKeys = allRoutes.map((layer) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
      }));

      const uniqueRoutes = new Set(routeKeys.map((r) => `${r.method} ${r.path}`));
      assert.equal(uniqueRoutes.size, routeKeys.length, 'No duplicate routes should exist');
    }
  );
});

