const test = require('node:test');
const assert = require('node:assert/strict');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');

// ============================================================================
// Route Configuration Tests for Upload Routes
// ============================================================================

test('uploads.routes -> POST / route is configured correctly', async () => {
  const mockMulterSingle = (req, res, next) => next();
  mockMulterSingle.single = () => mockMulterSingle;

  const mockMulter = () => ({
    single: () => mockMulterSingle,
  });

  const mockController = {
    uploadFile: async () => {},
    getFileById: async () => {},
    deleteFile: async () => {},
  };

  await withMockedModules(
    {
      multer: mockMulter,
      [require.resolve('../controllers/uploads.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.routes')];
      const router = require('./uploads.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.post
      );

      assert.ok(route, 'POST / route should exist');
      // POST / route should have multer middleware + controller handler
      assert.ok(route.route.stack.length >= 1, 'Route should have at least 1 handler');
      // The last handler should be the controller
      const lastHandler = route.route.stack[route.route.stack.length - 1];
      assert.equal(lastHandler.handle, mockController.uploadFile, 'Last handler should be uploadFile controller');
    }
  );
});

test('uploads.routes -> GET /:fileId route is configured correctly', async () => {
  const mockMulterSingle = (req, res, next) => next();
  mockMulterSingle.single = () => mockMulterSingle;

  const mockMulter = () => ({
    single: () => mockMulterSingle,
  });

  const mockController = {
    uploadFile: async () => {},
    getFileById: async () => {},
    deleteFile: async () => {},
  };

  await withMockedModules(
    {
      multer: mockMulter,
      [require.resolve('../controllers/uploads.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.routes')];
      const router = require('./uploads.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:fileId' && 
        layer.route.methods.get
      );

      assert.ok(route, 'GET /:fileId route should exist');
      assert.equal(route.route.stack.length, 1, 'Route should have 1 handler (controller only)');
      assert.equal(route.route.stack[0].handle, mockController.getFileById);
    }
  );
});

test('uploads.routes -> DELETE /:fileId route is configured correctly', async () => {
  const mockMulterSingle = (req, res, next) => next();
  mockMulterSingle.single = () => mockMulterSingle;

  const mockMulter = () => ({
    single: () => mockMulterSingle,
  });

  const mockController = {
    uploadFile: async () => {},
    getFileById: async () => {},
    deleteFile: async () => {},
  };

  await withMockedModules(
    {
      multer: mockMulter,
      [require.resolve('../controllers/uploads.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.routes')];
      const router = require('./uploads.routes');

      const route = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:fileId' && 
        layer.route.methods.delete
      );

      assert.ok(route, 'DELETE /:fileId route should exist');
      assert.equal(route.route.stack.length, 1, 'Route should have 1 handler (controller only)');
      assert.equal(route.route.stack[0].handle, mockController.deleteFile);
    }
  );
});

// ============================================================================
// Comprehensive Route Registration Tests
// ============================================================================

test('uploads.routes -> all routes are properly registered', async () => {
  const mockMulterSingle = (req, res, next) => next();
  mockMulterSingle.single = () => mockMulterSingle;

  const mockMulter = () => ({
    single: () => mockMulterSingle,
  });

  const mockController = {
    uploadFile: async () => {},
    getFileById: async () => {},
    deleteFile: async () => {},
  };

  await withMockedModules(
    {
      multer: mockMulter,
      [require.resolve('../controllers/uploads.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.routes')];
      const router = require('./uploads.routes');

      // Count all routes
      const allRoutes = router.stack.filter((layer) => layer.route);
      
      assert.equal(allRoutes.length, 3, 'Should have exactly 3 routes');
      
      // Verify route paths and methods
      const routePaths = allRoutes.map((layer) => ({
        path: layer.route.path,
        method: Object.keys(layer.route.methods)[0].toUpperCase(),
      }));

      const expectedRoutes = [
        { path: '/', method: 'POST' },
        { path: '/:fileId', method: 'GET' },
        { path: '/:fileId', method: 'DELETE' },
      ];

      expectedRoutes.forEach((expected) => {
        const found = routePaths.find((r) => r.path === expected.path && r.method === expected.method);
        assert.ok(found, `Route ${expected.method} ${expected.path} should exist`);
      });
    }
  );
});

test('uploads.routes -> all routes have correct handler assignments', async () => {
  const mockMulterSingle = (req, res, next) => next();
  mockMulterSingle.single = () => mockMulterSingle;

  const mockMulter = () => ({
    single: () => mockMulterSingle,
  });

  const mockController = {
    uploadFile: async () => {},
    getFileById: async () => {},
    deleteFile: async () => {},
  };

  await withMockedModules(
    {
      multer: mockMulter,
      [require.resolve('../controllers/uploads.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.routes')];
      const router = require('./uploads.routes');

      // Verify POST / handler assignment
      const postRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.post
      );
      assert.ok(postRoute, 'POST / route should exist');
      const postLastHandler = postRoute.route.stack[postRoute.route.stack.length - 1];
      assert.equal(
        postLastHandler.handle, 
        mockController.uploadFile,
        'POST / should use uploadFile controller'
      );

      // Verify GET /:fileId handler assignment
      const getRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:fileId' && 
        layer.route.methods.get
      );
      assert.ok(getRoute, 'GET /:fileId route should exist');
      assert.equal(
        getRoute.route.stack[0].handle, 
        mockController.getFileById,
        'GET /:fileId should use getFileById controller'
      );

      // Verify DELETE /:fileId handler assignment
      const deleteRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:fileId' && 
        layer.route.methods.delete
      );
      assert.ok(deleteRoute, 'DELETE /:fileId route should exist');
      assert.equal(
        deleteRoute.route.stack[0].handle, 
        mockController.deleteFile,
        'DELETE /:fileId should use deleteFile controller'
      );
    }
  );
});

test('uploads.routes -> POST / route has multer middleware', async () => {
  const mockMulterSingle = (req, res, next) => next();
  mockMulterSingle.single = () => mockMulterSingle;

  const mockMulter = () => ({
    single: () => mockMulterSingle,
  });

  const mockController = {
    uploadFile: async () => {},
    getFileById: async () => {},
    deleteFile: async () => {},
  };

  await withMockedModules(
    {
      multer: mockMulter,
      [require.resolve('../controllers/uploads.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.routes')];
      const router = require('./uploads.routes');

      const postRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/' && 
        layer.route.methods.post
      );

      assert.ok(postRoute, 'POST / route should exist');
      // POST / should have multer middleware + controller, so at least 2 handlers
      assert.ok(
        postRoute.route.stack.length >= 2,
        'POST / route should have multer middleware and controller handler'
      );
    }
  );
});

test('uploads.routes -> GET and DELETE /:fileId routes have no middleware (direct controller handlers)', async () => {
  const mockMulterSingle = (req, res, next) => next();
  mockMulterSingle.single = () => mockMulterSingle;

  const mockMulter = () => ({
    single: () => mockMulterSingle,
  });

  const mockController = {
    uploadFile: async () => {},
    getFileById: async () => {},
    deleteFile: async () => {},
  };

  await withMockedModules(
    {
      multer: mockMulter,
      [require.resolve('../controllers/uploads.controller')]: mockController,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.routes')];
      const router = require('./uploads.routes');

      const getRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:fileId' && 
        layer.route.methods.get
      );
      assert.ok(getRoute, 'GET /:fileId route should exist');
      assert.equal(
        getRoute.route.stack.length,
        1,
        'GET /:fileId should have only 1 handler (no middleware)'
      );

      const deleteRoute = router.stack.find((layer) => 
        layer.route && 
        layer.route.path === '/:fileId' && 
        layer.route.methods.delete
      );
      assert.ok(deleteRoute, 'DELETE /:fileId route should exist');
      assert.equal(
        deleteRoute.route.stack.length,
        1,
        'DELETE /:fileId should have only 1 handler (no middleware)'
      );
    }
  );
});

