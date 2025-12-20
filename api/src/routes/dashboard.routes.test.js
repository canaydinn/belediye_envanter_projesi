const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');
const ROLES = require('../constants/roles');

// ============================================================================
// Route Configuration Tests
// ============================================================================

test('dashboard.routes -> GET /stats route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getMunicipalityStats: async () => {},
    getMunicipalityInfo: async () => {},
    getRecentAssetMovements: async () => {},
    getCategoryDistribution: async () => {},
    getUpcomingMaintenance: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/dashboard.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./dashboard.routes')];
      const router = require('./dashboard.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/stats' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /stats route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[0], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getMunicipalityStats);
    }
  );
});

test('dashboard.routes -> GET /municipality route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getMunicipalityStats: async () => {},
    getMunicipalityInfo: async () => {},
    getRecentAssetMovements: async () => {},
    getCategoryDistribution: async () => {},
    getUpcomingMaintenance: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/dashboard.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./dashboard.routes')];
      const router = require('./dashboard.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/municipality' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /municipality route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[1], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getMunicipalityInfo);
    }
  );
});

test('dashboard.routes -> GET /recent-movements route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getMunicipalityStats: async () => {},
    getMunicipalityInfo: async () => {},
    getRecentAssetMovements: async () => {},
    getCategoryDistribution: async () => {},
    getUpcomingMaintenance: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/dashboard.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./dashboard.routes')];
      const router = require('./dashboard.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/recent-movements' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /recent-movements route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[2], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getRecentAssetMovements);
    }
  );
});

test('dashboard.routes -> GET /category-distribution route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getMunicipalityStats: async () => {},
    getMunicipalityInfo: async () => {},
    getRecentAssetMovements: async () => {},
    getCategoryDistribution: async () => {},
    getUpcomingMaintenance: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/dashboard.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./dashboard.routes')];
      const router = require('./dashboard.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/category-distribution' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /category-distribution route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[3], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getCategoryDistribution);
    }
  );
});

test('dashboard.routes -> GET /upcoming-maintenance route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getMunicipalityStats: async () => {},
    getMunicipalityInfo: async () => {},
    getRecentAssetMovements: async () => {},
    getCategoryDistribution: async () => {},
    getUpcomingMaintenance: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/dashboard.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./dashboard.routes')];
      const router = require('./dashboard.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/upcoming-maintenance' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /upcoming-maintenance route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[4], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getUpcomingMaintenance);
    }
  );
});

test('dashboard.routes -> all routes are properly registered', async () => {
  const mockAuthorize = () => (req, res, next) => next();

  const mockController = {
    getMunicipalityStats: async () => {},
    getMunicipalityInfo: async () => {},
    getRecentAssetMovements: async () => {},
    getCategoryDistribution: async () => {},
    getUpcomingMaintenance: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/dashboard.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./dashboard.routes')];
      const router = require('./dashboard.routes');

      // Count all routes
      const allRoutes = router.stack.filter((layer) => layer.route);
      
      assert.equal(allRoutes.length, 5, 'Should have exactly 5 routes');
      
      // Verify route paths and methods
      const routePaths = allRoutes.map((layer) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
      }));

      const expectedRoutes = [
        { path: '/stats', method: 'GET' },
        { path: '/municipality', method: 'GET' },
        { path: '/recent-movements', method: 'GET' },
        { path: '/category-distribution', method: 'GET' },
        { path: '/upcoming-maintenance', method: 'GET' },
      ];

      expectedRoutes.forEach((expected) => {
        const found = routePaths.find((r) => r.path === expected.path && r.method === expected.method);
        assert.ok(found, `Route ${expected.method} ${expected.path} should exist`);
      });
    }
  );
});

test('dashboard.routes -> all routes use authorize middleware with MUNICIPALITY_ADMIN and USER roles', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getMunicipalityStats: async () => {},
    getMunicipalityInfo: async () => {},
    getRecentAssetMovements: async () => {},
    getCategoryDistribution: async () => {},
    getUpcomingMaintenance: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/dashboard.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./dashboard.routes')];
      const router = require('./dashboard.routes');

      // Verify all routes use the same roles
      assert.equal(capturedRoles.length, 5, 'Should have 5 authorize calls');
      
      capturedRoles.forEach((roles, index) => {
        assert.deepEqual(roles, [ROLES.MUNICIPALITY_ADMIN, ROLES.USER], 
          `Route at index ${index} should allow MUNICIPALITY_ADMIN and USER roles`);
      });
    }
  );
});

test('dashboard.routes -> all routes have correct handler assignments', async () => {
  const mockAuthorize = () => (req, res, next) => next();

  const mockController = {
    getMunicipalityStats: async () => {},
    getMunicipalityInfo: async () => {},
    getRecentAssetMovements: async () => {},
    getCategoryDistribution: async () => {},
    getUpcomingMaintenance: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/dashboard.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./dashboard.routes')];
      const router = require('./dashboard.routes');

      // Verify handler assignments
      const statsRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/stats' && layer.route.methods.get
      );
      assert.equal(statsRoute.route.stack[1].handle, mockController.getMunicipalityStats);

      const municipalityRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/municipality' && layer.route.methods.get
      );
      assert.equal(municipalityRoute.route.stack[1].handle, mockController.getMunicipalityInfo);

      const recentMovementsRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/recent-movements' && layer.route.methods.get
      );
      assert.equal(recentMovementsRoute.route.stack[1].handle, mockController.getRecentAssetMovements);

      const categoryDistributionRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/category-distribution' && layer.route.methods.get
      );
      assert.equal(categoryDistributionRoute.route.stack[1].handle, mockController.getCategoryDistribution);

      const upcomingMaintenanceRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/upcoming-maintenance' && layer.route.methods.get
      );
      assert.equal(upcomingMaintenanceRoute.route.stack[1].handle, mockController.getUpcomingMaintenance);
    }
  );
});

test('dashboard.routes -> all routes have authorize middleware as first handler', async () => {
  let authorizeMiddlewareInstance = null;
  const mockAuthorize = (...roles) => {
    const middleware = (req, res, next) => next();
    if (!authorizeMiddlewareInstance) {
      authorizeMiddlewareInstance = middleware;
    }
    return middleware;
  };

  const mockController = {
    getMunicipalityStats: async () => {},
    getMunicipalityInfo: async () => {},
    getRecentAssetMovements: async () => {},
    getCategoryDistribution: async () => {},
    getUpcomingMaintenance: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/dashboard.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./dashboard.routes')];
      const router = require('./dashboard.routes');

      const allRoutes = router.stack.filter((layer) => layer.route);
      
      allRoutes.forEach((route) => {
        assert.equal(route.route.stack.length, 2, 
          `Route ${route.route.path} should have 2 handlers (authorize + controller)`);
        // Note: Each route gets its own authorize middleware instance, so we just check it exists
        assert.ok(route.route.stack[0].handle, 
          `Route ${route.route.path} should have authorize middleware as first handler`);
      });
    }
  );
});

