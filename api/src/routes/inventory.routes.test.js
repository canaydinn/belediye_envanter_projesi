const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');
const ROLES = require('../constants/roles');

// ============================================================================
// Route Configuration Tests for Inventory Routes
// ============================================================================

/**
 * Helper function to create mock authorize middleware factory
 */
function createMockAuthorize() {
  const capturedRoles = [];
  const authorizeFactory = (...roles) => {
    capturedRoles.push(roles);
    const middleware = (req, res, next) => {
      middleware.called = true;
      middleware.allowedRoles = roles;
      next();
    };
    middleware.called = false;
    return middleware;
  };
  authorizeFactory.capturedRoles = capturedRoles;
  return authorizeFactory;
}

// ============================================================================
// READ ROUTES TESTS
// ============================================================================

test('inventory.routes -> GET / route is configured correctly', async () => {
  const mockController = {
    listInventory: async () => {},
    getInventoryById: async () => {},
    createInventoryItem: async () => {},
    updateInventory: async () => {},
    deleteInventory: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/inventory.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./inventory.routes')];
      const router = require('./inventory.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET / route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.listInventory);
    }
  );
});

test('inventory.routes -> GET /:id route is configured correctly', async () => {
  const mockController = {
    listInventory: async () => {},
    getInventoryById: async () => {},
    createInventoryItem: async () => {},
    updateInventory: async () => {},
    deleteInventory: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/inventory.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./inventory.routes')];
      const router = require('./inventory.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.getInventoryById);
    }
  );
});

// ============================================================================
// WRITE ROUTES TESTS
// ============================================================================

test('inventory.routes -> POST / route is configured correctly', async () => {
  const mockController = {
    listInventory: async () => {},
    getInventoryById: async () => {},
    createInventoryItem: async () => {},
    updateInventory: async () => {},
    deleteInventory: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/inventory.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./inventory.routes')];
      const router = require('./inventory.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST / route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.createInventoryItem);
    }
  );
});

test('inventory.routes -> PATCH /:id route is configured correctly', async () => {
  const mockController = {
    listInventory: async () => {},
    getInventoryById: async () => {},
    createInventoryItem: async () => {},
    updateInventory: async () => {},
    deleteInventory: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/inventory.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./inventory.routes')];
      const router = require('./inventory.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.patch
      );

      assert.ok(route, 'PATCH /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.updateInventory);
    }
  );
});

test('inventory.routes -> DELETE /:id route is configured correctly', async () => {
  const mockController = {
    listInventory: async () => {},
    getInventoryById: async () => {},
    createInventoryItem: async () => {},
    updateInventory: async () => {},
    deleteInventory: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/inventory.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./inventory.routes')];
      const router = require('./inventory.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.delete
      );

      assert.ok(route, 'DELETE /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.deleteInventory);
    }
  );
});

// ============================================================================
// AUTHORIZATION TESTS
// ============================================================================

test('inventory.routes -> GET / route uses authorize with MUNICIPALITY_ADMIN and USER roles', async () => {
  const mockController = {
    listInventory: async () => {},
    getInventoryById: async () => {},
    createInventoryItem: async () => {},
    updateInventory: async () => {},
    deleteInventory: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/inventory.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./inventory.routes')];
      require('./inventory.routes');

      // Verify authorize was called with correct roles for GET /
      const getRouteCall = mockAuthorize.capturedRoles.find(
        (roles) => roles.includes(ROLES.MUNICIPALITY_ADMIN) && roles.includes(ROLES.USER)
      );

      assert.ok(getRouteCall, 'Authorize should be called with MUNICIPALITY_ADMIN and USER for GET /');
      assert.deepEqual(
        getRouteCall,
        [ROLES.MUNICIPALITY_ADMIN, ROLES.USER],
        'Authorize should be called with [MUNICIPALITY_ADMIN, USER]'
      );
    }
  );
});

test('inventory.routes -> GET /:id route uses authorize with MUNICIPALITY_ADMIN and USER roles', async () => {
  const mockController = {
    listInventory: async () => {},
    getInventoryById: async () => {},
    createInventoryItem: async () => {},
    updateInventory: async () => {},
    deleteInventory: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/inventory.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./inventory.routes')];
      require('./inventory.routes');

      // Verify authorize was called with correct roles
      // Since all routes use the same roles, we check that it was called at least once
      const callsWithBothRoles = mockAuthorize.capturedRoles.filter(
        (roles) => roles.includes(ROLES.MUNICIPALITY_ADMIN) && roles.includes(ROLES.USER)
      );

      assert.ok(
        callsWithBothRoles.length >= 2,
        'Authorize should be called with MUNICIPALITY_ADMIN and USER for GET routes'
      );
    }
  );
});

test('inventory.routes -> POST / route uses authorize with MUNICIPALITY_ADMIN and USER roles', async () => {
  const mockController = {
    listInventory: async () => {},
    getInventoryById: async () => {},
    createInventoryItem: async () => {},
    updateInventory: async () => {},
    deleteInventory: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/inventory.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./inventory.routes')];
      require('./inventory.routes');

      // Verify authorize was called with correct roles
      const callsWithBothRoles = mockAuthorize.capturedRoles.filter(
        (roles) => roles.includes(ROLES.MUNICIPALITY_ADMIN) && roles.includes(ROLES.USER)
      );

      assert.ok(
        callsWithBothRoles.length >= 1,
        'Authorize should be called with MUNICIPALITY_ADMIN and USER for POST /'
      );
    }
  );
});

test('inventory.routes -> PATCH /:id route uses authorize with MUNICIPALITY_ADMIN and USER roles', async () => {
  const mockController = {
    listInventory: async () => {},
    getInventoryById: async () => {},
    createInventoryItem: async () => {},
    updateInventory: async () => {},
    deleteInventory: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/inventory.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./inventory.routes')];
      require('./inventory.routes');

      // Verify authorize was called with correct roles
      const callsWithBothRoles = mockAuthorize.capturedRoles.filter(
        (roles) => roles.includes(ROLES.MUNICIPALITY_ADMIN) && roles.includes(ROLES.USER)
      );

      assert.ok(
        callsWithBothRoles.length >= 1,
        'Authorize should be called with MUNICIPALITY_ADMIN and USER for PATCH /:id'
      );
    }
  );
});

test('inventory.routes -> DELETE /:id route uses authorize with MUNICIPALITY_ADMIN and USER roles', async () => {
  const mockController = {
    listInventory: async () => {},
    getInventoryById: async () => {},
    createInventoryItem: async () => {},
    updateInventory: async () => {},
    deleteInventory: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/inventory.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./inventory.routes')];
      require('./inventory.routes');

      // Verify authorize was called with correct roles
      const callsWithBothRoles = mockAuthorize.capturedRoles.filter(
        (roles) => roles.includes(ROLES.MUNICIPALITY_ADMIN) && roles.includes(ROLES.USER)
      );

      assert.ok(
        callsWithBothRoles.length >= 1,
        'Authorize should be called with MUNICIPALITY_ADMIN and USER for DELETE /:id'
      );
    }
  );
});

// ============================================================================
// COMPREHENSIVE ROUTE REGISTRATION TESTS
// ============================================================================

test('inventory.routes -> all routes are properly registered', async () => {
  const mockController = {
    listInventory: async () => {},
    getInventoryById: async () => {},
    createInventoryItem: async () => {},
    updateInventory: async () => {},
    deleteInventory: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/inventory.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./inventory.routes')];
      const router = require('./inventory.routes');

      // Count all routes
      const allRoutes = router.stack.filter((layer) => layer.route);
      
      assert.equal(allRoutes.length, 5, 'Should have exactly 5 routes');
      
      // Verify route paths and methods
      const routePaths = allRoutes.map((layer) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
      }));

      const expectedRoutes = [
        { path: '/', method: 'GET' },
        { path: '/:id', method: 'GET' },
        { path: '/', method: 'POST' },
        { path: '/:id', method: 'PATCH' },
        { path: '/:id', method: 'DELETE' },
      ];

      expectedRoutes.forEach((expected) => {
        const found = routePaths.find((r) => r.path === expected.path && r.method === expected.method);
        assert.ok(found, `Route ${expected.method} ${expected.path} should exist`);
      });
    }
  );
});

test('inventory.routes -> all routes use authorize middleware', async () => {
  const mockController = {
    listInventory: async () => {},
    getInventoryById: async () => {},
    createInventoryItem: async () => {},
    updateInventory: async () => {},
    deleteInventory: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/inventory.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./inventory.routes')];
      const router = require('./inventory.routes');

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

test('inventory.routes -> all routes have correct handler assignments', async () => {
  const mockController = {
    listInventory: async () => {},
    getInventoryById: async () => {},
    createInventoryItem: async () => {},
    updateInventory: async () => {},
    deleteInventory: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/inventory.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./inventory.routes')];
      const router = require('./inventory.routes');

      // Verify handler assignments
      const getListRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/' && layer.route.methods.get
      );
      assert.equal(getListRoute.route.stack[1].handle, mockController.listInventory);

      const getByIdRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/:id' && layer.route.methods.get
      );
      assert.equal(getByIdRoute.route.stack[1].handle, mockController.getInventoryById);

      const postRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/' && layer.route.methods.post
      );
      assert.equal(postRoute.route.stack[1].handle, mockController.createInventoryItem);

      const patchRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/:id' && layer.route.methods.patch
      );
      assert.equal(patchRoute.route.stack[1].handle, mockController.updateInventory);

      const deleteRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/:id' && layer.route.methods.delete
      );
      assert.equal(deleteRoute.route.stack[1].handle, mockController.deleteInventory);
    }
  );
});

test('inventory.routes -> all routes use authorize with MUNICIPALITY_ADMIN and USER roles', async () => {
  const mockController = {
    listInventory: async () => {},
    getInventoryById: async () => {},
    createInventoryItem: async () => {},
    updateInventory: async () => {},
    deleteInventory: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/inventory.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./inventory.routes')];
      require('./inventory.routes');

      // Verify all authorize calls use the same roles
      const expectedRoles = [ROLES.MUNICIPALITY_ADMIN, ROLES.USER];
      
      assert.equal(
        mockAuthorize.capturedRoles.length,
        5,
        'Authorize should be called exactly 5 times (once per route)'
      );

      mockAuthorize.capturedRoles.forEach((roles, index) => {
        assert.deepEqual(
          roles,
          expectedRoles,
          `Authorize call ${index + 1} should use [MUNICIPALITY_ADMIN, USER] roles`
        );
      });
    }
  );
});




