const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');
const ROLES = require('../constants/roles');

// ============================================================================
// Route Configuration Tests for Maintenance Routes
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

test('maintenance.routes -> GET / route is configured correctly', async () => {
  const mockController = {
    listTickets: async () => {},
    getTicketById: async () => {},
    createTicket: async () => {},
    updateTicket: async () => {},
    completeTicket: async () => {},
    deleteTicket: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/maintenance.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./maintenance.routes')];
      const router = require('./maintenance.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET / route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.listTickets);
    }
  );
});

test('maintenance.routes -> GET /:id route is configured correctly', async () => {
  const mockController = {
    listTickets: async () => {},
    getTicketById: async () => {},
    createTicket: async () => {},
    updateTicket: async () => {},
    completeTicket: async () => {},
    deleteTicket: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/maintenance.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./maintenance.routes')];
      const router = require('./maintenance.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.getTicketById);
    }
  );
});

// ============================================================================
// WRITE ROUTES TESTS
// ============================================================================

test('maintenance.routes -> POST / route is configured correctly', async () => {
  const mockController = {
    listTickets: async () => {},
    getTicketById: async () => {},
    createTicket: async () => {},
    updateTicket: async () => {},
    completeTicket: async () => {},
    deleteTicket: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/maintenance.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./maintenance.routes')];
      const router = require('./maintenance.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST / route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.createTicket);
    }
  );
});

test('maintenance.routes -> PATCH /:id route is configured correctly', async () => {
  const mockController = {
    listTickets: async () => {},
    getTicketById: async () => {},
    createTicket: async () => {},
    updateTicket: async () => {},
    completeTicket: async () => {},
    deleteTicket: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/maintenance.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./maintenance.routes')];
      const router = require('./maintenance.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.patch
      );

      assert.ok(route, 'PATCH /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.updateTicket);
    }
  );
});

test('maintenance.routes -> POST /:id/complete route is configured correctly', async () => {
  const mockController = {
    listTickets: async () => {},
    getTicketById: async () => {},
    createTicket: async () => {},
    updateTicket: async () => {},
    completeTicket: async () => {},
    deleteTicket: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/maintenance.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./maintenance.routes')];
      const router = require('./maintenance.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id/complete' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST /:id/complete route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.completeTicket);
    }
  );
});

test('maintenance.routes -> DELETE /:id route is configured correctly', async () => {
  const mockController = {
    listTickets: async () => {},
    getTicketById: async () => {},
    createTicket: async () => {},
    updateTicket: async () => {},
    completeTicket: async () => {},
    deleteTicket: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/maintenance.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./maintenance.routes')];
      const router = require('./maintenance.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.delete
      );

      assert.ok(route, 'DELETE /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.equal(route.route.stack[1].handle, mockController.deleteTicket);
    }
  );
});

// ============================================================================
// AUTHORIZATION TESTS
// ============================================================================

test('maintenance.routes -> GET / route uses authorize with MUNICIPALITY_ADMIN and USER roles', async () => {
  const mockController = {
    listTickets: async () => {},
    getTicketById: async () => {},
    createTicket: async () => {},
    updateTicket: async () => {},
    completeTicket: async () => {},
    deleteTicket: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/maintenance.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./maintenance.routes')];
      require('./maintenance.routes');

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

test('maintenance.routes -> GET /:id route uses authorize with MUNICIPALITY_ADMIN and USER roles', async () => {
  const mockController = {
    listTickets: async () => {},
    getTicketById: async () => {},
    createTicket: async () => {},
    updateTicket: async () => {},
    completeTicket: async () => {},
    deleteTicket: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/maintenance.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./maintenance.routes')];
      require('./maintenance.routes');

      // Verify authorize was called with correct roles
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

test('maintenance.routes -> POST / route uses authorize with MUNICIPALITY_ADMIN only', async () => {
  const mockController = {
    listTickets: async () => {},
    getTicketById: async () => {},
    createTicket: async () => {},
    updateTicket: async () => {},
    completeTicket: async () => {},
    deleteTicket: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/maintenance.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./maintenance.routes')];
      require('./maintenance.routes');

      // Verify authorize was called with MUNICIPALITY_ADMIN only
      const postRouteCall = mockAuthorize.capturedRoles.find(
        (roles) => roles.length === 1 && roles[0] === ROLES.MUNICIPALITY_ADMIN
      );

      assert.ok(
        postRouteCall,
        'Authorize should be called with MUNICIPALITY_ADMIN only for POST /'
      );
      assert.deepEqual(
        postRouteCall,
        [ROLES.MUNICIPALITY_ADMIN],
        'Authorize should be called with [MUNICIPALITY_ADMIN]'
      );
    }
  );
});

test('maintenance.routes -> PATCH /:id route uses authorize with MUNICIPALITY_ADMIN only', async () => {
  const mockController = {
    listTickets: async () => {},
    getTicketById: async () => {},
    createTicket: async () => {},
    updateTicket: async () => {},
    completeTicket: async () => {},
    deleteTicket: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/maintenance.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./maintenance.routes')];
      require('./maintenance.routes');

      // Verify authorize was called with MUNICIPALITY_ADMIN only
      const callsWithMunicipalityAdminOnly = mockAuthorize.capturedRoles.filter(
        (roles) => roles.length === 1 && roles[0] === ROLES.MUNICIPALITY_ADMIN
      );

      assert.ok(
        callsWithMunicipalityAdminOnly.length >= 1,
        'Authorize should be called with MUNICIPALITY_ADMIN only for PATCH /:id'
      );
    }
  );
});

test('maintenance.routes -> POST /:id/complete route uses authorize with MUNICIPALITY_ADMIN only', async () => {
  const mockController = {
    listTickets: async () => {},
    getTicketById: async () => {},
    createTicket: async () => {},
    updateTicket: async () => {},
    completeTicket: async () => {},
    deleteTicket: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/maintenance.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./maintenance.routes')];
      require('./maintenance.routes');

      // Verify authorize was called with MUNICIPALITY_ADMIN only
      const callsWithMunicipalityAdminOnly = mockAuthorize.capturedRoles.filter(
        (roles) => roles.length === 1 && roles[0] === ROLES.MUNICIPALITY_ADMIN
      );

      assert.ok(
        callsWithMunicipalityAdminOnly.length >= 1,
        'Authorize should be called with MUNICIPALITY_ADMIN only for POST /:id/complete'
      );
    }
  );
});

test('maintenance.routes -> DELETE /:id route uses authorize with MUNICIPALITY_ADMIN only', async () => {
  const mockController = {
    listTickets: async () => {},
    getTicketById: async () => {},
    createTicket: async () => {},
    updateTicket: async () => {},
    completeTicket: async () => {},
    deleteTicket: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/maintenance.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./maintenance.routes')];
      require('./maintenance.routes');

      // Verify authorize was called with MUNICIPALITY_ADMIN only
      const callsWithMunicipalityAdminOnly = mockAuthorize.capturedRoles.filter(
        (roles) => roles.length === 1 && roles[0] === ROLES.MUNICIPALITY_ADMIN
      );

      assert.ok(
        callsWithMunicipalityAdminOnly.length >= 1,
        'Authorize should be called with MUNICIPALITY_ADMIN only for DELETE /:id'
      );
    }
  );
});

// ============================================================================
// COMPREHENSIVE ROUTE REGISTRATION TESTS
// ============================================================================

test('maintenance.routes -> all routes are properly registered', async () => {
  const mockController = {
    listTickets: async () => {},
    getTicketById: async () => {},
    createTicket: async () => {},
    updateTicket: async () => {},
    completeTicket: async () => {},
    deleteTicket: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/maintenance.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./maintenance.routes')];
      const router = require('./maintenance.routes');

      // Count all routes
      const allRoutes = router.stack.filter((layer) => layer.route);
      
      assert.equal(allRoutes.length, 6, 'Should have exactly 6 routes');
      
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
        { path: '/:id/complete', method: 'POST' },
        { path: '/:id', method: 'DELETE' },
      ];

      expectedRoutes.forEach((expected) => {
        const found = routePaths.find((r) => r.path === expected.path && r.method === expected.method);
        assert.ok(found, `Route ${expected.method} ${expected.path} should exist`);
      });
    }
  );
});

test('maintenance.routes -> all routes use authorize middleware', async () => {
  const mockController = {
    listTickets: async () => {},
    getTicketById: async () => {},
    createTicket: async () => {},
    updateTicket: async () => {},
    completeTicket: async () => {},
    deleteTicket: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/maintenance.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./maintenance.routes')];
      const router = require('./maintenance.routes');

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

test('maintenance.routes -> all routes have correct handler assignments', async () => {
  const mockController = {
    listTickets: async () => {},
    getTicketById: async () => {},
    createTicket: async () => {},
    updateTicket: async () => {},
    completeTicket: async () => {},
    deleteTicket: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/maintenance.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./maintenance.routes')];
      const router = require('./maintenance.routes');

      // Verify handler assignments
      const getListRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/' && layer.route.methods.get
      );
      assert.equal(getListRoute.route.stack[1].handle, mockController.listTickets);

      const getByIdRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/:id' && layer.route.methods.get
      );
      assert.equal(getByIdRoute.route.stack[1].handle, mockController.getTicketById);

      const postRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/' && layer.route.methods.post
      );
      assert.equal(postRoute.route.stack[1].handle, mockController.createTicket);

      const patchRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/:id' && layer.route.methods.patch
      );
      assert.equal(patchRoute.route.stack[1].handle, mockController.updateTicket);

      const completeRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/:id/complete' && layer.route.methods.post
      );
      assert.equal(completeRoute.route.stack[1].handle, mockController.completeTicket);

      const deleteRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/:id' && layer.route.methods.delete
      );
      assert.equal(deleteRoute.route.stack[1].handle, mockController.deleteTicket);
    }
  );
});

test('maintenance.routes -> READ routes use MUNICIPALITY_ADMIN and USER, WRITE routes use MUNICIPALITY_ADMIN only', async () => {
  const mockController = {
    listTickets: async () => {},
    getTicketById: async () => {},
    createTicket: async () => {},
    updateTicket: async () => {},
    completeTicket: async () => {},
    deleteTicket: async () => {},
  };

  const mockAuthorize = createMockAuthorize();

  await withMockedModules(
    {
      [require.resolve('../controllers/maintenance.controller')]: mockController,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
    },
    async () => {
      delete require.cache[require.resolve('./maintenance.routes')];
      require('./maintenance.routes');

      // Verify authorize was called exactly 6 times
      assert.equal(
        mockAuthorize.capturedRoles.length,
        6,
        'Authorize should be called exactly 6 times (once per route)'
      );

      // Count READ routes (should have MUNICIPALITY_ADMIN and USER)
      const readRoutes = mockAuthorize.capturedRoles.filter(
        (roles) => roles.length === 2 && 
        roles.includes(ROLES.MUNICIPALITY_ADMIN) && 
        roles.includes(ROLES.USER)
      );
      assert.equal(readRoutes.length, 2, 'Should have 2 READ routes with MUNICIPALITY_ADMIN and USER');

      // Count WRITE routes (should have MUNICIPALITY_ADMIN only)
      const writeRoutes = mockAuthorize.capturedRoles.filter(
        (roles) => roles.length === 1 && roles[0] === ROLES.MUNICIPALITY_ADMIN
      );
      assert.equal(writeRoutes.length, 4, 'Should have 4 WRITE routes with MUNICIPALITY_ADMIN only');
    }
  );
});

