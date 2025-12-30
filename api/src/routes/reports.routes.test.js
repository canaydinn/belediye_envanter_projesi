const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');

// ============================================================================
// Route Configuration Tests for reports.routes.js
// ============================================================================

test('reports.routes -> GET /inventory-summary route is configured correctly', async () => {
  const mockController = {
    getInventorySummary: async () => {},
    getMaintenanceSummary: async () => {},
    exportExcel: async () => {},
    exportPdf: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/reports.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./reports.routes')];
      const router = require('./reports.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/inventory-summary' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /inventory-summary route should exist');
      assert.equal(route.route.stack.length, 1, 'Route should have 1 handler (no middleware)');
      assert.equal(route.route.stack[0].handle, mockController.getInventorySummary);
    }
  );
});

test('reports.routes -> GET /maintenance-summary route is configured correctly', async () => {
  const mockController = {
    getInventorySummary: async () => {},
    getMaintenanceSummary: async () => {},
    exportExcel: async () => {},
    exportPdf: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/reports.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./reports.routes')];
      const router = require('./reports.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/maintenance-summary' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /maintenance-summary route should exist');
      assert.equal(route.route.stack.length, 1, 'Route should have 1 handler (no middleware)');
      assert.equal(route.route.stack[0].handle, mockController.getMaintenanceSummary);
    }
  );
});

test('reports.routes -> GET /export/excel route is configured correctly', async () => {
  const mockController = {
    getInventorySummary: async () => {},
    getMaintenanceSummary: async () => {},
    exportExcel: async () => {},
    exportPdf: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/reports.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./reports.routes')];
      const router = require('./reports.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/export/excel' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /export/excel route should exist');
      assert.equal(route.route.stack.length, 1, 'Route should have 1 handler (no middleware)');
      assert.equal(route.route.stack[0].handle, mockController.exportExcel);
    }
  );
});

test('reports.routes -> GET /export/pdf route is configured correctly', async () => {
  const mockController = {
    getInventorySummary: async () => {},
    getMaintenanceSummary: async () => {},
    exportExcel: async () => {},
    exportPdf: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/reports.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./reports.routes')];
      const router = require('./reports.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/export/pdf' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /export/pdf route should exist');
      assert.equal(route.route.stack.length, 1, 'Route should have 1 handler (no middleware)');
      assert.equal(route.route.stack[0].handle, mockController.exportPdf);
    }
  );
});

test('reports.routes -> all routes are properly registered', async () => {
  const mockController = {
    getInventorySummary: async () => {},
    getMaintenanceSummary: async () => {},
    exportExcel: async () => {},
    exportPdf: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/reports.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./reports.routes')];
      const router = require('./reports.routes');

      // Count all routes
      const allRoutes = router.stack.filter((layer) => layer.route);
      
      assert.equal(allRoutes.length, 4, 'Should have exactly 4 routes');
      
      // Verify route paths and methods
      const routePaths = allRoutes.map((layer) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
      }));

      const expectedRoutes = [
        { path: '/inventory-summary', method: 'GET' },
        { path: '/maintenance-summary', method: 'GET' },
        { path: '/export/excel', method: 'GET' },
        { path: '/export/pdf', method: 'GET' },
      ];

      expectedRoutes.forEach((expected) => {
        const found = routePaths.find((r) => r.path === expected.path && r.method === expected.method);
        assert.ok(found, `Route ${expected.method} ${expected.path} should exist`);
      });
    }
  );
});

test('reports.routes -> all routes have correct handler assignments', async () => {
  const mockController = {
    getInventorySummary: async () => {},
    getMaintenanceSummary: async () => {},
    exportExcel: async () => {},
    exportPdf: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/reports.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./reports.routes')];
      const router = require('./reports.routes');

      // Verify handler assignments
      const inventorySummaryRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/inventory-summary' && layer.route.methods.get
      );
      assert.equal(inventorySummaryRoute.route.stack[0].handle, mockController.getInventorySummary);

      const maintenanceSummaryRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/maintenance-summary' && layer.route.methods.get
      );
      assert.equal(maintenanceSummaryRoute.route.stack[0].handle, mockController.getMaintenanceSummary);

      const exportExcelRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/export/excel' && layer.route.methods.get
      );
      assert.equal(exportExcelRoute.route.stack[0].handle, mockController.exportExcel);

      const exportPdfRoute = router.stack.find((layer) => 
        layer.route && layer.route.path === '/export/pdf' && layer.route.methods.get
      );
      assert.equal(exportPdfRoute.route.stack[0].handle, mockController.exportPdf);
    }
  );
});

test('reports.routes -> all routes have no middleware (only controller handlers)', async () => {
  const mockController = {
    getInventorySummary: async () => {},
    getMaintenanceSummary: async () => {},
    exportExcel: async () => {},
    exportPdf: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/reports.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./reports.routes')];
      const router = require('./reports.routes');

      const routes = [
        '/inventory-summary',
        '/maintenance-summary',
        '/export/excel',
        '/export/pdf',
      ];

      routes.forEach((path) => {
        const route = router.stack.find((layer) => 
          layer.route && 
          layer.route.path === path && 
          layer.route.methods.get
        );

        assert.ok(route, `Route ${path} should exist`);
        assert.equal(
          route.route.stack.length, 
          1, 
          `Route ${path} should have only 1 handler (no middleware)`
        );
      });
    }
  );
});

test('reports.routes -> routes use GET method only', async () => {
  const mockController = {
    getInventorySummary: async () => {},
    getMaintenanceSummary: async () => {},
    exportExcel: async () => {},
    exportPdf: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../controllers/reports.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./reports.routes')];
      const router = require('./reports.routes');

      const allRoutes = router.stack.filter((layer) => layer.route);
      
      allRoutes.forEach((layer) => {
        const methods = Object.keys(layer.route.methods);
        assert.equal(methods.length, 1, `Route ${layer.route.path} should have exactly one method`);
        assert.ok(layer.route.methods.get, `Route ${layer.route.path} should use GET method`);
        assert.ok(!layer.route.methods.post, `Route ${layer.route.path} should not use POST method`);
        assert.ok(!layer.route.methods.put, `Route ${layer.route.path} should not use PUT method`);
        assert.ok(!layer.route.methods.delete, `Route ${layer.route.path} should not use DELETE method`);
      });
    }
  );
});

