const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');
const ROLES = require('../constants/roles');

// ============================================================================
// Route Configuration Tests
// ============================================================================

test('assets.route -> GET / route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssets: async () => {},
    getFilterOptions: async () => {},
    getStatusDistribution: async () => {},
    getRecentAssets: async () => {},
    getAssetByQRCode: async () => {},
    generateAssetQRCode: async () => {},
    getAssetById: async () => {},
    createAsset: async () => {},
    updateAsset: async () => {},
    deleteAsset: async () => {},
  };

  const mockBulkImportController = {
    bulkImportAssets: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assets.controller')]: mockController,
      [require.resolve('../controllers/bulk-import.controller')]: mockBulkImportController,
    },
    async () => {
      delete require.cache[require.resolve('./assets.route')];
      const router = require('./assets.route');

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
      assert.equal(route.route.stack[1].handle, mockController.listAssets);
    }
  );
});

test('assets.route -> GET /filters route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssets: async () => {},
    getFilterOptions: async () => {},
    getStatusDistribution: async () => {},
    getRecentAssets: async () => {},
    getAssetByQRCode: async () => {},
    generateAssetQRCode: async () => {},
    getAssetById: async () => {},
    createAsset: async () => {},
    updateAsset: async () => {},
    deleteAsset: async () => {},
  };

  const mockBulkImportController = {
    bulkImportAssets: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assets.controller')]: mockController,
      [require.resolve('../controllers/bulk-import.controller')]: mockBulkImportController,
    },
    async () => {
      delete require.cache[require.resolve('./assets.route')];
      const router = require('./assets.route');

      // Check router stack for GET /filters route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/filters' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /filters route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET /filters is the second route, so it should be the second captured role
      assert.deepEqual(capturedRoles[1], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getFilterOptions);
    }
  );
});

test('assets.route -> GET /status-distribution route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssets: async () => {},
    getFilterOptions: async () => {},
    getStatusDistribution: async () => {},
    getRecentAssets: async () => {},
    getAssetByQRCode: async () => {},
    generateAssetQRCode: async () => {},
    getAssetById: async () => {},
    createAsset: async () => {},
    updateAsset: async () => {},
    deleteAsset: async () => {},
  };

  const mockBulkImportController = {
    bulkImportAssets: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assets.controller')]: mockController,
      [require.resolve('../controllers/bulk-import.controller')]: mockBulkImportController,
    },
    async () => {
      delete require.cache[require.resolve('./assets.route')];
      const router = require('./assets.route');

      // Check router stack for GET /status-distribution route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/status-distribution' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /status-distribution route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET /status-distribution is the third route, so it should be the third captured role
      assert.deepEqual(capturedRoles[2], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getStatusDistribution);
    }
  );
});

test('assets.route -> GET /recent-assets route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssets: async () => {},
    getFilterOptions: async () => {},
    getStatusDistribution: async () => {},
    getRecentAssets: async () => {},
    getAssetByQRCode: async () => {},
    generateAssetQRCode: async () => {},
    getAssetById: async () => {},
    createAsset: async () => {},
    updateAsset: async () => {},
    deleteAsset: async () => {},
  };

  const mockBulkImportController = {
    bulkImportAssets: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assets.controller')]: mockController,
      [require.resolve('../controllers/bulk-import.controller')]: mockBulkImportController,
    },
    async () => {
      delete require.cache[require.resolve('./assets.route')];
      const router = require('./assets.route');

      // Check router stack for GET /recent-assets route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/recent-assets' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /recent-assets route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET /recent-assets is the fourth route, so it should be the fourth captured role
      assert.deepEqual(capturedRoles[3], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getRecentAssets);
    }
  );
});

test('assets.route -> GET /qr/:code route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssets: async () => {},
    getFilterOptions: async () => {},
    getStatusDistribution: async () => {},
    getRecentAssets: async () => {},
    getAssetByQRCode: async () => {},
    generateAssetQRCode: async () => {},
    getAssetById: async () => {},
    createAsset: async () => {},
    updateAsset: async () => {},
    deleteAsset: async () => {},
  };

  const mockBulkImportController = {
    bulkImportAssets: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assets.controller')]: mockController,
      [require.resolve('../controllers/bulk-import.controller')]: mockBulkImportController,
    },
    async () => {
      delete require.cache[require.resolve('./assets.route')];
      const router = require('./assets.route');

      // Check router stack for GET /qr/:code route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/qr/:code' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /qr/:code route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET /qr/:code is the fifth route, so it should be the fifth captured role
      assert.deepEqual(capturedRoles[4], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getAssetByQRCode);
    }
  );
});

test('assets.route -> GET /:id/qrcode route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssets: async () => {},
    getFilterOptions: async () => {},
    getStatusDistribution: async () => {},
    getRecentAssets: async () => {},
    getAssetByQRCode: async () => {},
    generateAssetQRCode: async () => {},
    getAssetById: async () => {},
    createAsset: async () => {},
    updateAsset: async () => {},
    deleteAsset: async () => {},
  };

  const mockBulkImportController = {
    bulkImportAssets: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assets.controller')]: mockController,
      [require.resolve('../controllers/bulk-import.controller')]: mockBulkImportController,
    },
    async () => {
      delete require.cache[require.resolve('./assets.route')];
      const router = require('./assets.route');

      // Check router stack for GET /:id/qrcode route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id/qrcode' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /:id/qrcode route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET /:id/qrcode is the sixth route, so it should be the sixth captured role
      assert.deepEqual(capturedRoles[5], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.generateAssetQRCode);
    }
  );
});

test('assets.route -> GET /:id route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssets: async () => {},
    getFilterOptions: async () => {},
    getStatusDistribution: async () => {},
    getRecentAssets: async () => {},
    getAssetByQRCode: async () => {},
    generateAssetQRCode: async () => {},
    getAssetById: async () => {},
    createAsset: async () => {},
    updateAsset: async () => {},
    deleteAsset: async () => {},
  };

  const mockBulkImportController = {
    bulkImportAssets: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assets.controller')]: mockController,
      [require.resolve('../controllers/bulk-import.controller')]: mockBulkImportController,
    },
    async () => {
      delete require.cache[require.resolve('./assets.route')];
      const router = require('./assets.route');

      // Check router stack for GET /:id route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // GET /:id is the seventh route, so it should be the seventh captured role
      assert.deepEqual(capturedRoles[6], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER]);
      assert.equal(route.route.stack[1].handle, mockController.getAssetById);
    }
  );
});

test('assets.route -> POST / route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssets: async () => {},
    getFilterOptions: async () => {},
    getStatusDistribution: async () => {},
    getRecentAssets: async () => {},
    getAssetByQRCode: async () => {},
    generateAssetQRCode: async () => {},
    getAssetById: async () => {},
    createAsset: async () => {},
    updateAsset: async () => {},
    deleteAsset: async () => {},
  };

  const mockBulkImportController = {
    bulkImportAssets: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assets.controller')]: mockController,
      [require.resolve('../controllers/bulk-import.controller')]: mockBulkImportController,
    },
    async () => {
      delete require.cache[require.resolve('./assets.route')];
      const router = require('./assets.route');

      // Check router stack for POST / route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST / route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // POST / is the eighth route, so it should be the eighth captured role
      assert.deepEqual(capturedRoles[7], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.createAsset);
    }
  );
});

test('assets.route -> POST /bulk-import route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssets: async () => {},
    getFilterOptions: async () => {},
    getStatusDistribution: async () => {},
    getRecentAssets: async () => {},
    getAssetByQRCode: async () => {},
    generateAssetQRCode: async () => {},
    getAssetById: async () => {},
    createAsset: async () => {},
    updateAsset: async () => {},
    deleteAsset: async () => {},
  };

  const mockBulkImportController = {
    bulkImportAssets: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assets.controller')]: mockController,
      [require.resolve('../controllers/bulk-import.controller')]: mockBulkImportController,
    },
    async () => {
      delete require.cache[require.resolve('./assets.route')];
      const router = require('./assets.route');

      // Check router stack for POST /bulk-import route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/bulk-import' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST /bulk-import route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // POST /bulk-import is the ninth route, so it should be the ninth captured role
      assert.deepEqual(capturedRoles[8], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockBulkImportController.bulkImportAssets);
    }
  );
});

test('assets.route -> PUT /:id route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssets: async () => {},
    getFilterOptions: async () => {},
    getStatusDistribution: async () => {},
    getRecentAssets: async () => {},
    getAssetByQRCode: async () => {},
    generateAssetQRCode: async () => {},
    getAssetById: async () => {},
    createAsset: async () => {},
    updateAsset: async () => {},
    deleteAsset: async () => {},
  };

  const mockBulkImportController = {
    bulkImportAssets: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assets.controller')]: mockController,
      [require.resolve('../controllers/bulk-import.controller')]: mockBulkImportController,
    },
    async () => {
      delete require.cache[require.resolve('./assets.route')];
      const router = require('./assets.route');

      // Check router stack for PUT /:id route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.put
      );

      assert.ok(route, 'PUT /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // PUT /:id is the tenth route, so it should be the tenth captured role
      assert.deepEqual(capturedRoles[9], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.updateAsset);
    }
  );
});

test('assets.route -> DELETE /:id route is configured with correct middleware and handler', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssets: async () => {},
    getFilterOptions: async () => {},
    getStatusDistribution: async () => {},
    getRecentAssets: async () => {},
    getAssetByQRCode: async () => {},
    generateAssetQRCode: async () => {},
    getAssetById: async () => {},
    createAsset: async () => {},
    updateAsset: async () => {},
    deleteAsset: async () => {},
  };

  const mockBulkImportController = {
    bulkImportAssets: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assets.controller')]: mockController,
      [require.resolve('../controllers/bulk-import.controller')]: mockBulkImportController,
    },
    async () => {
      delete require.cache[require.resolve('./assets.route')];
      const router = require('./assets.route');

      // Check router stack for DELETE /:id route
      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:id' && 
        layer.route.methods.delete
      );

      assert.ok(route, 'DELETE /:id route should exist');
      assert.equal(route.route.stack.length, 2, 'Route should have 2 handlers (authorize + controller)');
      // DELETE /:id is the eleventh route, so it should be the eleventh captured role
      assert.deepEqual(capturedRoles[10], [ROLES.MUNICIPALITY_ADMIN]);
      assert.equal(route.route.stack[1].handle, mockController.deleteAsset);
    }
  );
});

test('assets.route -> READ endpoints allow MUNICIPALITY_ADMIN and USER roles', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssets: async () => {},
    getFilterOptions: async () => {},
    getStatusDistribution: async () => {},
    getRecentAssets: async () => {},
    getAssetByQRCode: async () => {},
    generateAssetQRCode: async () => {},
    getAssetById: async () => {},
    createAsset: async () => {},
    updateAsset: async () => {},
    deleteAsset: async () => {},
  };

  const mockBulkImportController = {
    bulkImportAssets: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assets.controller')]: mockController,
      [require.resolve('../controllers/bulk-import.controller')]: mockBulkImportController,
    },
    async () => {
      delete require.cache[require.resolve('./assets.route')];
      const router = require('./assets.route');

      // Check all READ routes
      const readRoutes = router.stack.filter((layer) => 
        layer.route && 
        layer.route.methods.get
      );

      assert.ok(readRoutes.length >= 7, 'Should have at least 7 READ routes');
      
      // Verify all READ routes use the same roles
      // READ routes are indices 0-6 in capturedRoles
      for (let i = 0; i < 7; i++) {
        assert.deepEqual(capturedRoles[i], [ROLES.MUNICIPALITY_ADMIN, ROLES.USER], 
          `READ route at index ${i} should allow MUNICIPALITY_ADMIN and USER roles`);
      }
    }
  );
});

test('assets.route -> WRITE endpoints allow only MUNICIPALITY_ADMIN role', async () => {
  const capturedRoles = [];

  const mockAuthorize = (...roles) => {
    capturedRoles.push(roles);
    return (req, res, next) => next();
  };

  const mockController = {
    listAssets: async () => {},
    getFilterOptions: async () => {},
    getStatusDistribution: async () => {},
    getRecentAssets: async () => {},
    getAssetByQRCode: async () => {},
    generateAssetQRCode: async () => {},
    getAssetById: async () => {},
    createAsset: async () => {},
    updateAsset: async () => {},
    deleteAsset: async () => {},
  };

  const mockBulkImportController = {
    bulkImportAssets: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assets.controller')]: mockController,
      [require.resolve('../controllers/bulk-import.controller')]: mockBulkImportController,
    },
    async () => {
      delete require.cache[require.resolve('./assets.route')];
      const router = require('./assets.route');

      // Check all WRITE routes
      const writeRoutes = router.stack.filter((layer) => 
        layer.route && 
        (layer.route.methods.post || layer.route.methods.put || layer.route.methods.delete)
      );

      assert.ok(writeRoutes.length >= 4, 'Should have at least 4 WRITE routes');
      
      // Find the indices of WRITE routes in the captured roles array
      // WRITE routes are POST / (index 7), POST /bulk-import (index 8), PUT /:id (index 9), DELETE /:id (index 10)
      const writeRouteIndices = [7, 8, 9, 10];
      
      // Verify all WRITE routes use only MUNICIPALITY_ADMIN role
      writeRouteIndices.forEach((index) => {
        assert.deepEqual(capturedRoles[index], [ROLES.MUNICIPALITY_ADMIN],
          `WRITE route at index ${index} should allow only MUNICIPALITY_ADMIN role`);
      });
    }
  );
});

test('assets.route -> all routes are properly registered', async () => {
  const mockAuthorize = () => (req, res, next) => next();

  const mockController = {
    listAssets: async () => {},
    getFilterOptions: async () => {},
    getStatusDistribution: async () => {},
    getRecentAssets: async () => {},
    getAssetByQRCode: async () => {},
    generateAssetQRCode: async () => {},
    getAssetById: async () => {},
    createAsset: async () => {},
    updateAsset: async () => {},
    deleteAsset: async () => {},
  };

  const mockBulkImportController = {
    bulkImportAssets: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../controllers/assets.controller')]: mockController,
      [require.resolve('../controllers/bulk-import.controller')]: mockBulkImportController,
    },
    async () => {
      delete require.cache[require.resolve('./assets.route')];
      const router = require('./assets.route');

      // Count all routes
      const allRoutes = router.stack.filter((layer) => layer.route);
      
      assert.equal(allRoutes.length, 11, 'Should have exactly 11 routes');
      
      // Verify route paths
      const routePaths = allRoutes.map((layer) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
      }));

      const expectedRoutes = [
        { path: '/', method: 'GET' },
        { path: '/filters', method: 'GET' },
        { path: '/status-distribution', method: 'GET' },
        { path: '/recent-assets', method: 'GET' },
        { path: '/qr/:code', method: 'GET' },
        { path: '/:id/qrcode', method: 'GET' },
        { path: '/:id', method: 'GET' },
        { path: '/', method: 'POST' },
        { path: '/bulk-import', method: 'POST' },
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

