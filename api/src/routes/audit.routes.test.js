const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');
const ROLES = require('../constants/roles');

// ============================================================================
// Route Configuration Tests
// ============================================================================

test('audit.routes -> GET / route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getAuditLogs: async () => {},
    getAuditLogById: async () => {},
    createAuditLog: async () => {},
    updateAuditLog: async () => {},
    deleteAuditLog: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/audit.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./audit.routes')];
      const router = require('./audit.routes');

      // Check router stack for GET / route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET / route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET / is the first route, so it should be the first captured role
      assert.deepEqual(capturedRoles[0], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.getAuditLogs);
    }
  );
});

test('audit.routes -> GET /:id route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getAuditLogs: async () => {},
    getAuditLogById: async () => {},
    createAuditLog: async () => {},
    updateAuditLog: async () => {},
    deleteAuditLog: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/audit.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./audit.routes')];
      const router = require('./audit.routes');

      // Check router stack for GET /:id route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET /:id is the second route, so it should be the second captured role
      assert.deepEqual(capturedRoles[1], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.getAuditLogById);
    }
  );
});

test('audit.routes -> POST / route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getAuditLogs: async () => {},
    getAuditLogById: async () => {},
    createAuditLog: async () => {},
    updateAuditLog: async () => {},
    deleteAuditLog: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/audit.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./audit.routes')];
      const router = require('./audit.routes');

      // Check router stack for POST / route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST / route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // POST / is the third route, so it should be the third captured role
      assert.deepEqual(capturedRoles[2], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.createAuditLog);
    }
  );
});

test('audit.routes -> PUT /:id route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getAuditLogs: async () => {},
    getAuditLogById: async () => {},
    createAuditLog: async () => {},
    updateAuditLog: async () => {},
    deleteAuditLog: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/audit.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./audit.routes')];
      const router = require('./audit.routes');

      // Check router stack for PUT /:id route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.put
      );

      assert.ok(route, 'PUT /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // PUT /:id is the fourth route, so it should be the fourth captured role
      assert.deepEqual(capturedRoles[3], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.updateAuditLog);
    }
  );
});

test('audit.routes -> DELETE /:id route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getAuditLogs: async () => {},
    getAuditLogById: async () => {},
    createAuditLog: async () => {},
    updateAuditLog: async () => {},
    deleteAuditLog: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/audit.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./audit.routes')];
      const router = require('./audit.routes');

      // Check router stack for DELETE /:id route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.delete
      );

      assert.ok(route, 'DELETE /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // DELETE /:id is the fifth route, so it should be the fifth captured role
      assert.deepEqual(capturedRoles[4], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.deleteAuditLog);
    }
  );
});

test('audit.routes -> all routes are properly registered', async () => {
  const mockAuthorize = () => (req, res, next) => next();

  const mockController = {
    getAuditLogs: async () => {},
    getAuditLogById: async () => {},
    createAuditLog: async () => {},
    updateAuditLog: async () => {},
    deleteAuditLog: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/audit.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./audit.routes')];
      const router = require('./audit.routes');

      // Count all routes
      const allRoutes = router.stack.filter((layer) => layer.route);
      
      assert.equal(allRoutes.length, 5, 'Should have exactly 5 routes');
      
      // Verify route paths
      const routePaths = allRoutes.map((layer) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
      }));

      const expectedRoutes = [
        { path: '/', method: 'GET' },
        { path: '/:id', method: 'GET' },
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

test('audit.routes -> all endpoints require MUNICIPALITY_ADMIN role', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getAuditLogs: async () => {},
    getAuditLogById: async () => {},
    createAuditLog: async () => {},
    updateAuditLog: async () => {},
    deleteAuditLog: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/audit.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./audit.routes')];
      const router = require('./audit.routes');

      // Verify all routes use MUNICIPALITY_ADMIN role
      const allRoutes = router.stack.filter((layer) => layer.route);
      
      assert.equal(allRoutes.length, 5, 'Should have exactly 5 routes');
      assert.equal(capturedRoles.length, 5, 'Should have captured 5 role configurations');
      
      // All routes should require MUNICIPALITY_ADMIN only
      capturedRoles.forEach((roles, index) => {
        assert.deepEqual(
          roles, 
          [ROLES.MUNICIPALITY_ADMIN],
          `Route at index ${index} should require only MUNICIPALITY_ADMIN role`
        );
      });
    }
  );
});

test('audit.routes -> all routes have correct handler assignments', async () => {
  const mockAuthorize = () => (req, res, next) => next();

  const mockController = {
    getAuditLogs: async () => {},
    getAuditLogById: async () => {},
    createAuditLog: async () => {},
    updateAuditLog: async () => {},
    deleteAuditLog: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/audit.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./audit.routes')];
      const router = require('./audit.routes');

      // Verify handler assignments
      const getRootRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/' && layer.route.methods.get
      );
      assert.equal(getRootRoute.route.stack[1].handle, mockController.getAuditLogs);

      const getIdRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/:id' && layer.route.methods.get
      );
      assert.equal(getIdRoute.route.stack[1].handle, mockController.getAuditLogById);

      const postRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/' && layer.route.methods.post
      );
      assert.equal(postRoute.route.stack[1].handle, mockController.createAuditLog);

      const putRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/:id' && layer.route.methods.put
      );
      assert.equal(putRoute.route.stack[1].handle, mockController.updateAuditLog);

      const deleteRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/:id' && layer.route.methods.delete
      );
      assert.equal(deleteRoute.route.stack[1].handle, mockController.deleteAuditLog);
    }
  );
});

