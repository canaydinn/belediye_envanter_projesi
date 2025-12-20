const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');
const ROLES = require('../constants/roles');

// ============================================================================
// Route Configuration Tests
// ============================================================================

test('asset.categories.routes -> GET / route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listCategories: async () => {},
    getCategoryStats: async () => {},
    getCategoryDistribution: async () => {},
    getCategoryById: async () => {},
    createCategory: async () => {},
    updateCategory: async () => {},
    deleteCategory: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetCategories.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.categories.routes')];
      const router = require('./asset.categories.routes');

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
      assert.equal(route.route.stack[1].handle, mockController.listCategories);
    }
  );
});

test('asset.categories.routes -> GET /stats route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listCategories: async () => {},
    getCategoryStats: async () => {},
    getCategoryDistribution: async () => {},
    getCategoryById: async () => {},
    createCategory: async () => {},
    updateCategory: async () => {},
    deleteCategory: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetCategories.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.categories.routes')];
      const router = require('./asset.categories.routes');

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
      assert.equal(route.route.stack[1].handle, mockController.getCategoryStats);
    }
  );
});

test('asset.categories.routes -> GET /distribution route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listCategories: async () => {},
    getCategoryStats: async () => {},
    getCategoryDistribution: async () => {},
    getCategoryById: async () => {},
    createCategory: async () => {},
    updateCategory: async () => {},
    deleteCategory: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetCategories.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.categories.routes')];
      const router = require('./asset.categories.routes');

      // Check router stack for GET /distribution route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/distribution' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /distribution route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET /distribution is the third route, so it should be the third captured role
      assert.deepEqual(capturedRoles[2], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getCategoryDistribution);
    }
  );
});

test('asset.categories.routes -> GET /:id route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listCategories: async () => {},
    getCategoryStats: async () => {},
    getCategoryDistribution: async () => {},
    getCategoryById: async () => {},
    createCategory: async () => {},
    updateCategory: async () => {},
    deleteCategory: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetCategories.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.categories.routes')];
      const router = require('./asset.categories.routes');

      // Check router stack for GET /:id route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET /:id is the fourth route, so it should be the fourth captured role
      assert.deepEqual(capturedRoles[3], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getCategoryById);
    }
  );
});

test('asset.categories.routes -> POST / route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listCategories: async () => {},
    getCategoryStats: async () => {},
    getCategoryDistribution: async () => {},
    getCategoryById: async () => {},
    createCategory: async () => {},
    updateCategory: async () => {},
    deleteCategory: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetCategories.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.categories.routes')];
      const router = require('./asset.categories.routes');

      // Check router stack for POST / route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST / route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // POST / is the fifth route, so it should be the fifth captured role
      assert.deepEqual(capturedRoles[4], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.createCategory);
    }
  );
});

test('asset.categories.routes -> PUT /:id route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listCategories: async () => {},
    getCategoryStats: async () => {},
    getCategoryDistribution: async () => {},
    getCategoryById: async () => {},
    createCategory: async () => {},
    updateCategory: async () => {},
    deleteCategory: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetCategories.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.categories.routes')];
      const router = require('./asset.categories.routes');

      // Check router stack for PUT /:id route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.put
      );

      assert.ok(route, 'PUT /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // PUT /:id is the sixth route, so it should be the sixth captured role
      assert.deepEqual(capturedRoles[5], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.updateCategory);
    }
  );
});

test('asset.categories.routes -> DELETE /:id route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listCategories: async () => {},
    getCategoryStats: async () => {},
    getCategoryDistribution: async () => {},
    getCategoryById: async () => {},
    createCategory: async () => {},
    updateCategory: async () => {},
    deleteCategory: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetCategories.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.categories.routes')];
      const router = require('./asset.categories.routes');

      // Check router stack for DELETE /:id route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.delete
      );

      assert.ok(route, 'DELETE /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // DELETE /:id is the seventh route, so it should be the seventh captured role
      assert.deepEqual(capturedRoles[6], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.deleteCategory);
    }
  );
});

test('asset.categories.routes -> READ endpoints allow MUNICIPALITY_ADMIN and USER roles', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listCategories: async () => {},
    getCategoryStats: async () => {},
    getCategoryDistribution: async () => {},
    getCategoryById: async () => {},
    createCategory: async () => {},
    updateCategory: async () => {},
    deleteCategory: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetCategories.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.categories.routes')];
      const router = require('./asset.categories.routes');

      // Check all READ routes
      const readRoutes = router.stack.filter((layer) => 
        layer.route && 
        layer.route.methods.get
      );

      assert.ok(readRoutes.length >= 4, 'Should have at least 4 READ routes');
      
      // Verify all READ routes use the same roles
      readRoutes.forEach(() => {
        const roles = capturedRoles.shift();
        assert.deepEqual(roles, [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      });
    }
  );
});

test('asset.categories.routes -> WRITE endpoints allow only MUNICIPALITY_ADMIN role', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listCategories: async () => {},
    getCategoryStats: async () => {},
    getCategoryDistribution: async () => {},
    getCategoryById: async () => {},
    createCategory: async () => {},
    updateCategory: async () => {},
    deleteCategory: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assetCategories.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./asset.categories.routes')];
      const router = require('./asset.categories.routes');

      // Check all WRITE routes
      const writeRoutes = router.stack.filter((layer) => 
        layer.route && 
        (layer.route.methods.post || layer.route.methods.put || layer.route.methods.delete)
      );

      assert.ok(writeRoutes.length >= 3, 'Should have at least 3 WRITE routes');
      
      // Find the indices of WRITE routes in the captured roles array
      // WRITE routes are POST / (index 4), PUT /:id (index 5), DELETE /:id (index 6)
      const writeRouteIndices = [4, 5, 6];
      
      // Verify all WRITE routes use only MUNICIPALITY_ADMIN role
      writeRouteIndices.forEach((index) => {
        assert.deepEqual(capturedRoles[index], [ROLES.MUNICIPALITY_ADMIN]);
      });
    }
  );
});
