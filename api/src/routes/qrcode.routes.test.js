const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');

// ============================================================================
// Route Configuration Tests for QR Code Routes
// ============================================================================

test('qrcode.routes -> GET /inventory/:id route is configured correctly', async () => {
  const mockController = {
    generateInventoryQrCode: async () => {},
    generateBatchQrCodes: async () => {},
    scanCodeAndResolveInventory: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/qrcode.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.routes')];
      const router = require('./qrcode.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/inventory/:id' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /inventory/:id route should exist');
      assert.equal(route.route.stack.length, 1, 'Route should have 1 handler (controller only)');
      assert.equal(route.route.stack[0].handle, mockController.generateInventoryQrCode);
    }
  );
});

test('qrcode.routes -> POST /batch route is configured correctly', async () => {
  const mockController = {
    generateInventoryQrCode: async () => {},
    generateBatchQrCodes: async () => {},
    scanCodeAndResolveInventory: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/qrcode.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.routes')];
      const router = require('./qrcode.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/batch' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST /batch route should exist');
      assert.equal(route.route.stack.length, 1, 'Route should have 1 handler (controller only)');
      assert.equal(route.route.stack[0].handle, mockController.generateBatchQrCodes);
    }
  );
});

test('qrcode.routes -> POST /scan route is configured correctly', async () => {
  const mockController = {
    generateInventoryQrCode: async () => {},
    generateBatchQrCodes: async () => {},
    scanCodeAndResolveInventory: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/qrcode.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.routes')];
      const router = require('./qrcode.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/scan' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST /scan route should exist');
      assert.equal(route.route.stack.length, 1, 'Route should have 1 handler (controller only)');
      assert.equal(route.route.stack[0].handle, mockController.scanCodeAndResolveInventory);
    }
  );
});

// ============================================================================
// Comprehensive Route Registration Tests
// ============================================================================

test('qrcode.routes -> all routes are properly registered', async () => {
  const mockController = {
    generateInventoryQrCode: async () => {},
    generateBatchQrCodes: async () => {},
    scanCodeAndResolveInventory: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/qrcode.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.routes')];
      const router = require('./qrcode.routes');

      // Count all routes
      const allRoutes = router.stack.filter((layer) => layer.route);
      
      assert.equal(allRoutes.length, 3, 'Should have exactly 3 routes');
      
      // Verify route paths and methods
      const routePaths = allRoutes.map((layer) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
      }));

      const expectedRoutes = [
        { path: '/inventory/:id', method: 'GET' },
        { path: '/batch', method: 'POST' },
        { path: '/scan', method: 'POST' },
      ];

      expectedRoutes.forEach((expected) => {
        const found = routePaths.find((r) => r.path === expected.path && r.method === expected.method);
        assert.ok(found, `Route ${expected.method} ${expected.path} should exist`);
      });
    }
  );
});

test('qrcode.routes -> all routes have correct handler assignments', async () => {
  const mockController = {
    generateInventoryQrCode: async () => {},
    generateBatchQrCodes: async () => {},
    scanCodeAndResolveInventory: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/qrcode.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.routes')];
      const router = require('./qrcode.routes');

      // Verify handler assignments
      const getInventoryRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/inventory/:id' && 
        layer.route.methods.get
      );
      assert.ok(getInventoryRoute, 'GET /inventory/:id route should exist');
      assert.equal(
        getInventoryRoute.route.stack[0].handle, 
        mockController.generateInventoryQrCode,
        'GET /inventory/:id should use generateInventoryQrCode controller'
      );

      const postBatchRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/batch' && 
        layer.route.methods.post
      );
      assert.ok(postBatchRoute, 'POST /batch route should exist');
      assert.equal(
        postBatchRoute.route.stack[0].handle, 
        mockController.generateBatchQrCodes,
        'POST /batch should use generateBatchQrCodes controller'
      );

      const postScanRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/scan' && 
        layer.route.methods.post
      );
      assert.ok(postScanRoute, 'POST /scan route should exist');
      assert.equal(
        postScanRoute.route.stack[0].handle, 
        mockController.scanCodeAndResolveInventory,
        'POST /scan should use scanCodeAndResolveInventory controller'
      );
    }
  );
});

test('qrcode.routes -> all routes have no middleware (direct controller handlers)', async () => {
  const mockController = {
    generateInventoryQrCode: async () => {},
    generateBatchQrCodes: async () => {},
    scanCodeAndResolveInventory: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/qrcode.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./qrcode.routes')];
      const router = require('./qrcode.routes');

      const allRoutes = router.stack.filter((layer) => layer.route);

      allRoutes.forEach((route) => {
        assert.equal(
          route.route.stack.length,
          1,
          `Route ${Object.keys(route.route.methods)[0].toUpperCase()} ${route.route.path} should have only 1 handler (no middleware)`
        );
      });
    }
  );
});

