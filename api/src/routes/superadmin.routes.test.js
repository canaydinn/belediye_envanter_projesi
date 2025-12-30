const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');
const ROLES = require('../constants/roles');

// ============================================================================
// Route Configuration Tests for Superadmin Routes
// ============================================================================

/**
 * Helper function to create mock authorize middleware factory
 */
function createMockAuthorize() {
  const capturedRoles = [];
  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };
  mockAuthorize.capturedRoles = capturedRoles;
  return mockAuthorize;
}

/**
 * Helper function to create mock controller with all methods
 */
function createMockController() {
  return {
    getMunicipalityCount: async () => {},
    getActiveCount: async () => {},
    getPendingMunicipalitiesCount: async () => {},
    getTotalCount: async () => {},
    listMunicipalities: async () => {},
    listActiveMunicipalities: async () => {},
    listPendingMunicipalities: async () => {},
    getStandardPlanMunicipalityCount: async () => {},
    getProPlanMunicipalityCount: async () => {},
    getDenemePlanMunicipalityCount: async () => {},
    listRecentLogs: async () => {},
    listUsersByMunicipality: async () => {},
    listAllUsers: async () => {},
    createMunicipality: async () => {},
    updateMunicipalityStatus: async () => {},
    deactivateMunicipality: async () => {},
    updateMunicipality: async () => {},
    createUser: async () => {},
    getLogStats: async () => {},
    getMunicipalityById: async () => {},
    getUserById: async () => {},
  };
}

// ============================================================================
// Count Routes Tests
// ============================================================================

test('superadmin.routes -> GET /municipalities/count route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities/count' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /municipalities/count route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(mockAuthorize.capturedRoles[0], [ROLES.SUPERADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.getMunicipalityCount);
    }
  );
});

test('superadmin.routes -> GET /municipalities/active/count route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities/active/count' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /municipalities/active/count route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.getActiveCount);
    }
  );
});

test('superadmin.routes -> GET /municipalities/pending/count route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities/pending/count' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /municipalities/pending/count route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.getPendingMunicipalitiesCount);
    }
  );
});

test('superadmin.routes -> GET /users/count route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/users/count' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /users/count route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.getTotalCount);
    }
  );
});

// ============================================================================
// List Routes Tests
// ============================================================================

test('superadmin.routes -> GET /municipalities route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /municipalities route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.listMunicipalities);
    }
  );
});

test('superadmin.routes -> GET /municipalities/active route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities/active' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /municipalities/active route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.listActiveMunicipalities);
    }
  );
});

test('superadmin.routes -> GET /municipalities/pending route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities/pending' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /municipalities/pending route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.listPendingMunicipalities);
    }
  );
});

// ============================================================================
// Plan-based Routes Tests
// ============================================================================

test('superadmin.routes -> GET /municipalities/plan/standard route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities/plan/standard' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /municipalities/plan/standard route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.getStandardPlanMunicipalityCount);
    }
  );
});

test('superadmin.routes -> GET /municipalities/plan/pro route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities/plan/pro' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /municipalities/plan/pro route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.getProPlanMunicipalityCount);
    }
  );
});

test('superadmin.routes -> GET /municipalities/plan/deneme route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities/plan/deneme' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /municipalities/plan/deneme route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.getDenemePlanMunicipalityCount);
    }
  );
});

// ============================================================================
// Log Routes Tests
// ============================================================================

test('superadmin.routes -> GET /logs/recent route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/logs/recent' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /logs/recent route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.listRecentLogs);
    }
  );
});

test('superadmin.routes -> GET /logs/stats route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/logs/stats' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /logs/stats route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.getLogStats);
    }
  );
});

// ============================================================================
// User Routes Tests
// ============================================================================

test('superadmin.routes -> GET /users route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/users' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /users route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.listUsersByMunicipality);
    }
  );
});

test('superadmin.routes -> GET /users/all route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/users/all' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /users/all route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.listAllUsers);
    }
  );
});

test('superadmin.routes -> GET /users/:id route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/users/:id' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /users/:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.getUserById);
    }
  );
});

test('superadmin.routes -> POST /users route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/users' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST /users route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.createUser);
    }
  );
});

// ============================================================================
// Municipality CRUD Routes Tests
// ============================================================================

test('superadmin.routes -> POST /municipalities/create route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities/create' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST /municipalities/create route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.createMunicipality);
    }
  );
});

test('superadmin.routes -> PATCH /municipalities/:id/status route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities/:id/status' && 
        layer.route.methods.patch
      );

      assert.ok(route, 'PATCH /municipalities/:id/status route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.updateMunicipalityStatus);
    }
  );
});

test('superadmin.routes -> PATCH /municipalities/:id/deactivate route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities/:id/deactivate' && 
        layer.route.methods.patch
      );

      assert.ok(route, 'PATCH /municipalities/:id/deactivate route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.deactivateMunicipality);
    }
  );
});

test('superadmin.routes -> PUT /municipalities/:id route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities/:id' && 
        layer.route.methods.put
      );

      assert.ok(route, 'PUT /municipalities/:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.updateMunicipality);
    }
  );
});

test('superadmin.routes -> GET /municipalities/:id route is configured correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities/:id' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /municipalities/:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.getMunicipalityById);
    }
  );
});

// ============================================================================
// Comprehensive Route Registration Tests
// ============================================================================

test('superadmin.routes -> all routes are properly registered', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      // Count all routes
      const allRoutes = router.stack.filter((layer) => layer.route);
      
      assert.equal(allRoutes.length, 21, 'Should have exactly 21 routes');
      
      // Verify route paths and methods
      const routePaths = allRoutes.map((layer) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
      }));

      const expectedRoutes = [
        { path: '/municipalities/count', method: 'GET' },
        { path: '/municipalities/active/count', method: 'GET' },
        { path: '/municipalities/pending/count', method: 'GET' },
        { path: '/users/count', method: 'GET' },
        { path: '/municipalities', method: 'GET' },
        { path: '/municipalities/active', method: 'GET' },
        { path: '/municipalities/pending', method: 'GET' },
        { path: '/municipalities/plan/standard', method: 'GET' },
        { path: '/municipalities/plan/pro', method: 'GET' },
        { path: '/municipalities/plan/deneme', method: 'GET' },
        { path: '/logs/recent', method: 'GET' },
        { path: '/users', method: 'GET' },
        { path: '/users/all', method: 'GET' },
        { path: '/municipalities/create', method: 'POST' },
        { path: '/municipalities/:id/status', method: 'PATCH' },
        { path: '/municipalities/:id/deactivate', method: 'PATCH' },
        { path: '/municipalities/:id', method: 'PUT' },
        { path: '/users', method: 'POST' },
        { path: '/logs/stats', method: 'GET' },
        { path: '/municipalities/:id', method: 'GET' },
        { path: '/users/:id', method: 'GET' },
      ];

      expectedRoutes.forEach((expected) => {
        const found = routePaths.find((r) => r.path === expected.path && r.method === expected.method);
        assert.ok(found, `Route ${expected.method} ${expected.path} should exist`);
      });
    }
  );
});

test('superadmin.routes -> all routes have correct handler assignments', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      // Verify handler assignments for key routes
      const getMunicipalityCountRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities/count' && 
        layer.route.methods.get
      );
      assert.ok(getMunicipalityCountRoute, 'GET /municipalities/count route should exist');
      assert.equal(
        getMunicipalityCountRoute.route.stack[1].handle, 
        mockController.getMunicipalityCount,
        'GET /municipalities/count should use getMunicipalityCount controller'
      );

      const listMunicipalitiesRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities' && 
        layer.route.methods.get
      );
      assert.ok(listMunicipalitiesRoute, 'GET /municipalities route should exist');
      assert.equal(
        listMunicipalitiesRoute.route.stack[1].handle, 
        mockController.listMunicipalities,
        'GET /municipalities should use listMunicipalities controller'
      );

      const createMunicipalityRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities/create' && 
        layer.route.methods.post
      );
      assert.ok(createMunicipalityRoute, 'POST /municipalities/create route should exist');
      assert.equal(
        createMunicipalityRoute.route.stack[1].handle, 
        mockController.createMunicipality,
        'POST /municipalities/create should use createMunicipality controller'
      );

      const getMunicipalityByIdRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipalities/:id' && 
        layer.route.methods.get
      );
      assert.ok(getMunicipalityByIdRoute, 'GET /municipalities/:id route should exist');
      assert.equal(
        getMunicipalityByIdRoute.route.stack[1].handle, 
        mockController.getMunicipalityById,
        'GET /municipalities/:id should use getMunicipalityById controller'
      );

      const createUserRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/users' && 
        layer.route.methods.post
      );
      assert.ok(createUserRoute, 'POST /users route should exist');
      assert.equal(
        createUserRoute.route.stack[1].handle, 
        mockController.createUser,
        'POST /users should use createUser controller'
      );
    }
  );
});

test('superadmin.routes -> all routes have authorize middleware with SUPERADMIN role', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const allRoutes = router.stack.filter((layer) => layer.route);

      // Verify that authorize was called 21 times (once for each route)
      assert.equal(
        mockAuthorize.capturedRoles.length, 
        21, 
        'authorize should be called 21 times (once for each route)'
      );

      // Verify that all routes use SUPERADMIN role
      mockAuthorize.capturedRoles.forEach((roles, index) => {
        assert.deepEqual(
          roles, 
          [ROLES.SUPERADMIN],
          `Route ${index + 1} should use SUPERADMIN role authorization`
        );
      });

      // Verify that all routes have exactly 2 handlers (authorize middleware + controller)
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

test('superadmin.routes -> route order is correct (specific routes before parameterized routes)', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockController = createMockController();

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/superadmin.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./superadmin.routes')];
      const router = require('./superadmin.routes');

      const allRoutes = router.stack.filter((layer) => layer.route);
      const routePaths = allRoutes.map((layer) => layer.route.path);

      // Verify that specific routes come before parameterized routes
      const municipalitiesIndex = routePaths.indexOf('/municipalities');
      const municipalitiesByIdIndex = routePaths.indexOf('/municipalities/:id');
      
      assert.ok(municipalitiesIndex !== -1, '/municipalities route should exist');
      assert.ok(municipalitiesByIdIndex !== -1, '/municipalities/:id route should exist');
      assert.ok(
        municipalitiesIndex < municipalitiesByIdIndex,
        'Specific route /municipalities should come before parameterized route /municipalities/:id'
      );

      // Verify that /users/all comes before /users/:id
      const usersAllIndex = routePaths.indexOf('/users/all');
      const usersByIdIndex = routePaths.indexOf('/users/:id');
      
      assert.ok(usersAllIndex !== -1, '/users/all route should exist');
      assert.ok(usersByIdIndex !== -1, '/users/:id route should exist');
      assert.ok(
        usersAllIndex < usersByIdIndex,
        'Specific route /users/all should come before parameterized route /users/:id'
      );
    }
  );
});

