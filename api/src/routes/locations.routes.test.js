const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');
const ROLES = require('../constants/roles');

// ============================================================================
// Route Configuration Tests
// ============================================================================

test('locations.routes -> GET /stats route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getLocationStats: async () => {},
    getLocationTypeDistribution: async () => {},
    listLocations: async () => {},
    getLocationById: async () => {},
    listLocationsFiltered: async () => {},
    createLocation: async () => {},
    updateLocation: async () => {},
    deleteLocation: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/locations.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./locations.routes')];
      const router = require('./locations.routes');

      // Check router stack for GET /stats route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/stats' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /stats route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[0], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getLocationStats);
    }
  );
});

test('locations.routes -> GET /type-distribution route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getLocationStats: async () => {},
    getLocationTypeDistribution: async () => {},
    listLocations: async () => {},
    getLocationById: async () => {},
    listLocationsFiltered: async () => {},
    createLocation: async () => {},
    updateLocation: async () => {},
    deleteLocation: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/locations.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./locations.routes')];
      const router = require('./locations.routes');

      // Check router stack for GET /type-distribution route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/type-distribution' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /type-distribution route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[1], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getLocationTypeDistribution);
    }
  );
});

test('locations.routes -> GET / route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getLocationStats: async () => {},
    getLocationTypeDistribution: async () => {},
    listLocations: async () => {},
    getLocationById: async () => {},
    listLocationsFiltered: async () => {},
    createLocation: async () => {},
    updateLocation: async () => {},
    deleteLocation: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/locations.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./locations.routes')];
      const router = require('./locations.routes');

      // Check router stack for GET / route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET / route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[2], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.listLocations);
    }
  );
});

test('locations.routes -> GET /:id route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getLocationStats: async () => {},
    getLocationTypeDistribution: async () => {},
    listLocations: async () => {},
    getLocationById: async () => {},
    listLocationsFiltered: async () => {},
    createLocation: async () => {},
    updateLocation: async () => {},
    deleteLocation: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/locations.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./locations.routes')];
      const router = require('./locations.routes');

      // Check router stack for GET /:id route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[3], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getLocationById);
    }
  );
});

test('locations.routes -> GET /search route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getLocationStats: async () => {},
    getLocationTypeDistribution: async () => {},
    listLocations: async () => {},
    getLocationById: async () => {},
    listLocationsFiltered: async () => {},
    createLocation: async () => {},
    updateLocation: async () => {},
    deleteLocation: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/locations.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./locations.routes')];
      const router = require('./locations.routes');

      // Check router stack for GET /search route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/search' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /search route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[4], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.listLocationsFiltered);
    }
  );
});

test('locations.routes -> POST / route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getLocationStats: async () => {},
    getLocationTypeDistribution: async () => {},
    listLocations: async () => {},
    getLocationById: async () => {},
    listLocationsFiltered: async () => {},
    createLocation: async () => {},
    updateLocation: async () => {},
    deleteLocation: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/locations.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./locations.routes')];
      const router = require('./locations.routes');

      // Check router stack for POST / route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST / route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[5], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.createLocation);
    }
  );
});

test('locations.routes -> PUT /:id route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getLocationStats: async () => {},
    getLocationTypeDistribution: async () => {},
    listLocations: async () => {},
    getLocationById: async () => {},
    listLocationsFiltered: async () => {},
    createLocation: async () => {},
    updateLocation: async () => {},
    deleteLocation: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/locations.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./locations.routes')];
      const router = require('./locations.routes');

      // Check router stack for PUT /:id route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.put
      );

      assert.ok(route, 'PUT /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[6], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.updateLocation);
    }
  );
});

test('locations.routes -> DELETE /:id route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getLocationStats: async () => {},
    getLocationTypeDistribution: async () => {},
    listLocations: async () => {},
    getLocationById: async () => {},
    listLocationsFiltered: async () => {},
    createLocation: async () => {},
    updateLocation: async () => {},
    deleteLocation: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/locations.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./locations.routes')];
      const router = require('./locations.routes');

      // Check router stack for DELETE /:id route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.delete
      );

      assert.ok(route, 'DELETE /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[7], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.deleteLocation);
    }
  );
});

test('locations.routes -> READ endpoints allow MUNICIPALITY_ADMIN and USER roles', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getLocationStats: async () => {},
    getLocationTypeDistribution: async () => {},
    listLocations: async () => {},
    getLocationById: async () => {},
    listLocationsFiltered: async () => {},
    createLocation: async () => {},
    updateLocation: async () => {},
    deleteLocation: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/locations.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./locations.routes')];
      const router = require('./locations.routes');

      // Check all READ routes
      const readRoutes = router.stack.filter((layer) => 
        layer.route && 
        layer.route.methods.get
      );

      assert.ok(readRoutes.length >= 5, 'Should have at least 5 READ routes');
      
      // Verify all READ routes use the same roles
      // READ routes are indices 0-4 in capturedRoles
      for (let i = 0; i < 5; i++) {
        assert.deepEqual(capturedRoles[i], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER], 
          `READ route at index ${i} should allow MUNICIPALITY_ADMIN and USER roles`);
      }
    }
  );
});

test('locations.routes -> WRITE endpoints allow only MUNICIPALITY_ADMIN role', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getLocationStats: async () => {},
    getLocationTypeDistribution: async () => {},
    listLocations: async () => {},
    getLocationById: async () => {},
    listLocationsFiltered: async () => {},
    createLocation: async () => {},
    updateLocation: async () => {},
    deleteLocation: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/locations.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./locations.routes')];
      const router = require('./locations.routes');

      // Check all WRITE routes
      const writeRoutes = router.stack.filter((layer) => 
        layer.route && 
        (layer.route.methods.post || layer.route.methods.put || layer.route.methods.delete)
      );

      assert.ok(writeRoutes.length >= 3, 'Should have at least 3 WRITE routes');
      
      // Find the indices of WRITE routes in the captured roles array
      // WRITE routes are POST / (index 5), PUT /:id (index 6), DELETE /:id (index 7)
      const writeRouteIndices = [5, 6, 7];
      
      // Verify all WRITE routes use only MUNICIPALITY_ADMIN role
      writeRouteIndices.forEach((index) => {
        assert.deepEqual(capturedRoles[index], [ROLES.MUNICIPALITY_ADMIN],
          `WRITE route at index ${index} should allow only MUNICIPALITY_ADMIN role`);
      });
    }
  );
});

test('locations.routes -> all routes are properly registered', async () => {
  const mockAuthorize = () => (req, res, next) => next();

  const mockController = {
    getLocationStats: async () => {},
    getLocationTypeDistribution: async () => {},
    listLocations: async () => {},
    getLocationById: async () => {},
    listLocationsFiltered: async () => {},
    createLocation: async () => {},
    updateLocation: async () => {},
    deleteLocation: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/locations.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./locations.routes')];
      const router = require('./locations.routes');

      // Count all routes
      const allRoutes = router.stack.filter((layer) => layer.route);
      
      assert.equal(allRoutes.length, 8, 'Should have exactly 8 routes');
      
      // Verify route paths
      const routePaths = allRoutes.map((layer) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
      }));

      const expectedRoutes = [
        { path: '/stats', method: 'GET' },
        { path: '/type-distribution', method: 'GET' },
        { path: '/', method: 'GET' },
        { path: '/:id', method: 'GET' },
        { path: '/search', method: 'GET' },
        { path: '/', method: 'POST' },
        { path: '/:id', method: 'PUT' },
        { path: '/:id', method: 'DELETE' },
      ];

      expectedRoutes.forEach((expected) => {
        const found = routePaths.find((r) => r.path === expected.path && r.method === expected.method);
        assert.ok(found, `Route ${expected.method} ${expected.path} should exist`);
      });
    }
  );
});





