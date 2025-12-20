const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');
const ROLES = require('../constants/roles');

// ============================================================================
// Route Configuration Tests
// ============================================================================

test('department.routes -> GET / route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getAll: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    remove: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/departments.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./department.routes')];
      const router = require('./department.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET / route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[0], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getAll);
    }
  );
});

test('department.routes -> GET /:id route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getAll: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    remove: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/departments.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./department.routes')];
      const router = require('./department.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[1], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getById);
    }
  );
});

test('department.routes -> POST / route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getAll: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    remove: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/departments.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./department.routes')];
      const router = require('./department.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST / route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[2], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.create);
    }
  );
});

test('department.routes -> PUT /:id route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getAll: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    remove: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/departments.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./department.routes')];
      const router = require('./department.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.put
      );

      assert.ok(route, 'PUT /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[3], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.update);
    }
  );
});

test('department.routes -> DELETE /:id route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getAll: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    remove: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/departments.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./department.routes')];
      const router = require('./department.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.delete
      );

      assert.ok(route, 'DELETE /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      assert.deepEqual(capturedRoles[4], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.remove);
    }
  );
});

test('department.routes -> all routes are properly registered', async () => {
  const mockAuthorize = () => (req, res, next) => next();

  const mockController = {
    getAll: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    remove: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/departments.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./department.routes')];
      const router = require('./department.routes');

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

test('department.routes -> READ routes use authorize middleware with MUNICIPALITY_ADMIN and USER roles', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getAll: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    remove: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/departments.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./department.routes')];
      const router = require('./department.routes');

      // GET / and GET /:id should use MUNICIPALITY_ADMIN and USER roles
      assert.equal(capturedRoles.length, 5, 'Should have 5 authorize calls');
      assert.deepEqual(capturedRoles[0], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER], 
        'GET / route should allow MUNICIPALITY_ADMIN and USER roles');
      assert.deepEqual(capturedRoles[1], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER], 
        'GET /:id route should allow MUNICIPALITY_ADMIN and USER roles');
    }
  );
});

test('department.routes -> WRITE routes use authorize middleware with only MUNICIPALITY_ADMIN role', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    getAll: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    remove: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/departments.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./department.routes')];
      const router = require('./department.routes');

      // POST /, PUT /:id, DELETE /:id should use only MUNICIPALITY_ADMIN role
      assert.equal(capturedRoles.length, 5, 'Should have 5 authorize calls');
      assert.deepEqual(capturedRoles[2], [ROLES.MUNICIPALITY_ADMIN], 
        'POST / route should allow only MUNICIPALITY_ADMIN role');
      assert.deepEqual(capturedRoles[3], [ROLES.MUNICIPALITY_ADMIN], 
        'PUT /:id route should allow only MUNICIPALITY_ADMIN role');
      assert.deepEqual(capturedRoles[4], [ROLES.MUNICIPALITY_ADMIN], 
        'DELETE /:id route should allow only MUNICIPALITY_ADMIN role');
    }
  );
});

test('department.routes -> all routes have correct handler assignments', async () => {
  const mockAuthorize = () => (req, res, next) => next();

  const mockController = {
    getAll: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    remove: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/departments.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./department.routes')];
      const router = require('./department.routes');

      // Verify handler assignments
      const getAllRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/' && layer.route.methods.get
      );
      assert.equal(getAllRoute.route.stack[1].handle, mockController.getAll);

      const getByIdRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/:id' && layer.route.methods.get
      );
      assert.equal(getByIdRoute.route.stack[1].handle, mockController.getById);

      const createRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/' && layer.route.methods.post
      );
      assert.equal(createRoute.route.stack[1].handle, mockController.create);

      const updateRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/:id' && layer.route.methods.put
      );
      assert.equal(updateRoute.route.stack[1].handle, mockController.update);

      const removeRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/:id' && layer.route.methods.delete
      );
      assert.equal(removeRoute.route.stack[1].handle, mockController.remove);
    }
  );
});

test('department.routes -> all routes have authorize middleware as first handler', async () => {
  let authorizeMiddlewareInstance = null;
  const mockAuthorize = (...roles) => {
    const middleware = (req, res, next) => next();
    if (!authorizeMiddlewareInstance) {
      authorizeMiddlewareInstance = middleware;
    }
    return middleware;
  };

  const mockController = {
    getAll: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    remove: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/departments.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./department.routes')];
      const router = require('./department.routes');

      const allRoutes = router.stack.filter((layer) => layer.route);
      
      allRoutes.forEach((route) => {
        assert.equal(route.route.stack.length, 2, 
          `Route ${route.route.path} (${Object.keys(route.route.methods)[0].toUpperCase()}) should have 2 handlers (authorize + controller)`);
        assert.ok(route.route.stack[0].handle, 
          `Route ${route.route.path} (${Object.keys(route.route.methods)[0].toUpperCase()}) should have authorize middleware as first handler`);
      });
    }
  );
});

test('department.routes -> route order is correct (GET before POST, POST before PUT/DELETE)', async () => {
  const mockAuthorize = () => (req, res, next) => next();

  const mockController = {
    getAll: async () => {},
    getById: async () => {},
    create: async () => {},
    update: async () => {},
    remove: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/departments.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./department.routes')];
      const router = require('./department.routes');

      const allRoutes = router.stack.filter((layer) => layer.route);
      
      // Express routes are registered in order, so we can verify the order
      const routeOrder = allRoutes.map((layer) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
      }));

      // Expected order: GET /, GET /:id, POST /, PUT /:id, DELETE /:id
      assert.equal(routeOrder[0].method, 'GET', 'First route should be GET /');
      assert.equal(routeOrder[0].path, '/', 'First route should be GET /');
      assert.equal(routeOrder[1].method, 'GET', 'Second route should be GET /:id');
      assert.equal(routeOrder[1].path, '/:id', 'Second route should be GET /:id');
      assert.equal(routeOrder[2].method, 'POST', 'Third route should be POST /');
      assert.equal(routeOrder[2].path, '/', 'Third route should be POST /');
      assert.equal(routeOrder[3].method, 'PUT', 'Fourth route should be PUT /:id');
      assert.equal(routeOrder[3].path, '/:id', 'Fourth route should be PUT /:id');
      assert.equal(routeOrder[4].method, 'DELETE', 'Fifth route should be DELETE /:id');
      assert.equal(routeOrder[4].path, '/:id', 'Fifth route should be DELETE /:id');
    }
  );
});

