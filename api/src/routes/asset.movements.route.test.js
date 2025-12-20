const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');
const ROLES = require('../constants/roles');

// ============================================================================
// Route Configuration Tests
// ============================================================================

test('asset.movements.route -> GET / route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssetMovements: async () => {},
    getMovementStats: async () => {},
    getMovementTypeDistribution: async () => {},
    getRecentAssetMovements: async () => {},
    filterMovements: async () => {},
    getLastThirtyDaysMovementsTotal: async () => {},
    getTodayMovementsTotal: async () => {},
    getMaintenanceMovementsTotal: async () => {},
    getZimmetMovementsTotal: async () => {},
    createAssetMovement: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetMovements.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.movements.route')];
      const router = require('./asset.movements.route');

      // Check router stack for GET / route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET / route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET / is the first route, so it should be the first captured role
      assert.deepEqual(capturedRoles[0], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.listAssetMovements);
    }
  );
});

test('asset.movements.route -> GET /stats route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssetMovements: async () => {},
    getMovementStats: async () => {},
    getMovementTypeDistribution: async () => {},
    getRecentAssetMovements: async () => {},
    filterMovements: async () => {},
    getLastThirtyDaysMovementsTotal: async () => {},
    getTodayMovementsTotal: async () => {},
    getMaintenanceMovementsTotal: async () => {},
    getZimmetMovementsTotal: async () => {},
    createAssetMovement: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetMovements.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.movements.route')];
      const router = require('./asset.movements.route');

      // Check router stack for GET /stats route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/stats' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /stats route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET /stats is the second route, so it should be the second captured role
      assert.deepEqual(capturedRoles[1], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getMovementStats);
    }
  );
});

test('asset.movements.route -> GET /movement-type-distribution route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssetMovements: async () => {},
    getMovementStats: async () => {},
    getMovementTypeDistribution: async () => {},
    getRecentAssetMovements: async () => {},
    filterMovements: async () => {},
    getLastThirtyDaysMovementsTotal: async () => {},
    getTodayMovementsTotal: async () => {},
    getMaintenanceMovementsTotal: async () => {},
    getZimmetMovementsTotal: async () => {},
    createAssetMovement: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetMovements.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.movements.route')];
      const router = require('./asset.movements.route');

      // Check router stack for GET /movement-type-distribution route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/movement-type-distribution' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /movement-type-distribution route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET /movement-type-distribution is the third route, so it should be the third captured role
      assert.deepEqual(capturedRoles[2], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getMovementTypeDistribution);
    }
  );
});

test('asset.movements.route -> GET /recent route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssetMovements: async () => {},
    getMovementStats: async () => {},
    getMovementTypeDistribution: async () => {},
    getRecentAssetMovements: async () => {},
    filterMovements: async () => {},
    getLastThirtyDaysMovementsTotal: async () => {},
    getTodayMovementsTotal: async () => {},
    getMaintenanceMovementsTotal: async () => {},
    getZimmetMovementsTotal: async () => {},
    createAssetMovement: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetMovements.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.movements.route')];
      const router = require('./asset.movements.route');

      // Check router stack for GET /recent route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/recent' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /recent route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET /recent is the fourth route, so it should be the fourth captured role
      assert.deepEqual(capturedRoles[3], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getRecentAssetMovements);
    }
  );
});

test('asset.movements.route -> GET /filter route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssetMovements: async () => {},
    getMovementStats: async () => {},
    getMovementTypeDistribution: async () => {},
    getRecentAssetMovements: async () => {},
    filterMovements: async () => {},
    getLastThirtyDaysMovementsTotal: async () => {},
    getTodayMovementsTotal: async () => {},
    getMaintenanceMovementsTotal: async () => {},
    getZimmetMovementsTotal: async () => {},
    createAssetMovement: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetMovements.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.movements.route')];
      const router = require('./asset.movements.route');

      // Check router stack for GET /filter route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/filter' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /filter route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET /filter is the fifth route, so it should be the fifth captured role
      assert.deepEqual(capturedRoles[4], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.filterMovements);
    }
  );
});

test('asset.movements.route -> GET /stats/last-30-days route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssetMovements: async () => {},
    getMovementStats: async () => {},
    getMovementTypeDistribution: async () => {},
    getRecentAssetMovements: async () => {},
    filterMovements: async () => {},
    getLastThirtyDaysMovementsTotal: async () => {},
    getTodayMovementsTotal: async () => {},
    getMaintenanceMovementsTotal: async () => {},
    getZimmetMovementsTotal: async () => {},
    createAssetMovement: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetMovements.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.movements.route')];
      const router = require('./asset.movements.route');

      // Check router stack for GET /stats/last-30-days route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/stats/last-30-days' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /stats/last-30-days route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET /stats/last-30-days is the sixth route, so it should be the sixth captured role
      assert.deepEqual(capturedRoles[5], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getLastThirtyDaysMovementsTotal);
    }
  );
});

test('asset.movements.route -> GET /stats/today route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssetMovements: async () => {},
    getMovementStats: async () => {},
    getMovementTypeDistribution: async () => {},
    getRecentAssetMovements: async () => {},
    filterMovements: async () => {},
    getLastThirtyDaysMovementsTotal: async () => {},
    getTodayMovementsTotal: async () => {},
    getMaintenanceMovementsTotal: async () => {},
    getZimmetMovementsTotal: async () => {},
    createAssetMovement: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetMovements.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.movements.route')];
      const router = require('./asset.movements.route');

      // Check router stack for GET /stats/today route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/stats/today' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /stats/today route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET /stats/today is the seventh route, so it should be the seventh captured role
      assert.deepEqual(capturedRoles[6], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getTodayMovementsTotal);
    }
  );
});

test('asset.movements.route -> GET /stats/maintenance route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssetMovements: async () => {},
    getMovementStats: async () => {},
    getMovementTypeDistribution: async () => {},
    getRecentAssetMovements: async () => {},
    filterMovements: async () => {},
    getLastThirtyDaysMovementsTotal: async () => {},
    getTodayMovementsTotal: async () => {},
    getMaintenanceMovementsTotal: async () => {},
    getZimmetMovementsTotal: async () => {},
    createAssetMovement: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetMovements.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.movements.route')];
      const router = require('./asset.movements.route');

      // Check router stack for GET /stats/maintenance route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/stats/maintenance' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /stats/maintenance route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET /stats/maintenance is the eighth route, so it should be the eighth captured role
      assert.deepEqual(capturedRoles[7], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getMaintenanceMovementsTotal);
    }
  );
});

test('asset.movements.route -> GET /stats/zimmet route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssetMovements: async () => {},
    getMovementStats: async () => {},
    getMovementTypeDistribution: async () => {},
    getRecentAssetMovements: async () => {},
    filterMovements: async () => {},
    getLastThirtyDaysMovementsTotal: async () => {},
    getTodayMovementsTotal: async () => {},
    getMaintenanceMovementsTotal: async () => {},
    getZimmetMovementsTotal: async () => {},
    createAssetMovement: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetMovements.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.movements.route')];
      const router = require('./asset.movements.route');

      // Check router stack for GET /stats/zimmet route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/stats/zimmet' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /stats/zimmet route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET /stats/zimmet is the ninth route, so it should be the ninth captured role
      assert.deepEqual(capturedRoles[8], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getZimmetMovementsTotal);
    }
  );
});

test('asset.movements.route -> POST / route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssetMovements: async () => {},
    getMovementStats: async () => {},
    getMovementTypeDistribution: async () => {},
    getRecentAssetMovements: async () => {},
    filterMovements: async () => {},
    getLastThirtyDaysMovementsTotal: async () => {},
    getTodayMovementsTotal: async () => {},
    getMaintenanceMovementsTotal: async () => {},
    getZimmetMovementsTotal: async () => {},
    createAssetMovement: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetMovements.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.movements.route')];
      const router = require('./asset.movements.route');

      // Check router stack for POST / route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST / route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // POST / is the tenth route, so it should be the tenth captured role
      assert.deepEqual(capturedRoles[9], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.createAssetMovement);
    }
  );
});

test('asset.movements.route -> READ endpoints allow MUNICIPALITY_ADMIN and USER roles', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssetMovements: async () => {},
    getMovementStats: async () => {},
    getMovementTypeDistribution: async () => {},
    getRecentAssetMovements: async () => {},
    filterMovements: async () => {},
    getLastThirtyDaysMovementsTotal: async () => {},
    getTodayMovementsTotal: async () => {},
    getMaintenanceMovementsTotal: async () => {},
    getZimmetMovementsTotal: async () => {},
    createAssetMovement: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetMovements.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.movements.route')];
      const router = require('./asset.movements.route');

      // Check all READ routes
      const readRoutes = router.stack.filter((layer) => 
        layer.route && 
        layer.route.methods.get
      );

      assert.ok(readRoutes.length >= 9, 'Should have at least 9 READ routes');
      
      // Verify all READ routes use the same roles
      // READ routes are indices 0-8 in capturedRoles
      for (let i = 0; i < 9; i++) {
        assert.deepEqual(capturedRoles[i], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER], 
          `READ route at index ${i} should allow MUNICIPALITY_ADMIN and USER roles`);
      }
    }
  );
});

test('asset.movements.route -> WRITE endpoints allow only MUNICIPALITY_ADMIN role', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssetMovements: async () => {},
    getMovementStats: async () => {},
    getMovementTypeDistribution: async () => {},
    getRecentAssetMovements: async () => {},
    filterMovements: async () => {},
    getLastThirtyDaysMovementsTotal: async () => {},
    getTodayMovementsTotal: async () => {},
    getMaintenanceMovementsTotal: async () => {},
    getZimmetMovementsTotal: async () => {},
    createAssetMovement: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetMovements.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.movements.route')];
      const router = require('./asset.movements.route');

      // Check all WRITE routes
      const writeRoutes = router.stack.filter((layer) => 
        layer.route && 
        (layer.route.methods.post || layer.route.methods.put || layer.route.methods.delete)
      );

      assert.ok(writeRoutes.length >= 1, 'Should have at least 1 WRITE route');
      
      // Find the indices of WRITE routes in the captured roles array
      // WRITE route is POST / (index 9)
      const writeRouteIndices = [9];
      
      // Verify all WRITE routes use only MUNICIPALITY_ADMIN role
      writeRouteIndices.forEach((index) => {
        assert.deepEqual(capturedRoles[index], [ROLES.MUNICIPALITY_ADMIN],
          `WRITE route at index ${index} should allow only MUNICIPALITY_ADMIN role`);
      });
    }
  );
});

test('asset.movements.route -> all routes are properly registered', async () => {
  const mockAuthorize = () => (req, res, next) => next();

  const mockController = {
    listAssetMovements: async () => {},
    getMovementStats: async () => {},
    getMovementTypeDistribution: async () => {},
    getRecentAssetMovements: async () => {},
    filterMovements: async () => {},
    getLastThirtyDaysMovementsTotal: async () => {},
    getTodayMovementsTotal: async () => {},
    getMaintenanceMovementsTotal: async () => {},
    getZimmetMovementsTotal: async () => {},
    createAssetMovement: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetMovements.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.movements.route')];
      const router = require('./asset.movements.route');

      // Count all routes
      const allRoutes = router.stack.filter((layer) => layer.route);
      
      assert.equal(allRoutes.length, 10, 'Should have exactly 10 routes');
      
      // Verify route paths
      const routePaths = allRoutes.map((layer) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
      }));

      const expectedRoutes = [
        { path: '/', method: 'GET' },
        { path: '/stats', method: 'GET' },
        { path: '/movement-type-distribution', method: 'GET' },
        { path: '/recent', method: 'GET' },
        { path: '/filter', method: 'GET' },
        { path: '/stats/last-30-days', method: 'GET' },
        { path: '/stats/today', method: 'GET' },
        { path: '/stats/maintenance', method: 'GET' },
        { path: '/stats/zimmet', method: 'GET' },
        { path: '/', method: 'POST' },
      ];

      expectedRoutes.forEach((expected) => {
        const found = routePaths.find((r) => r.path === expected.path && r.method === expected.method);
        assert.ok(found, `Route ${expected.method} ${expected.path} should exist`);
      });
    }
  );
});

