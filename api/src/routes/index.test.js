const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

const { withMockedModules } = require('../__tests__/helpers/mockRequire');
const ROLES = require('../constants/roles');

// ============================================================================
// Route Configuration Tests for Main Router (index.js)
// ============================================================================

/**
 * Helper function to create mock middleware
 */
function createMockMiddleware(name) {
  const middleware = (req, res, next) => {
    middleware.called = true;
    middleware.req = req;
    next();
  };
  middleware.called = false;
  middleware.name = name;
  return middleware;
}

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

/**
 * Helper function to create mock tenantScope middleware factory
 */
function createMockTenantScope() {
  const capturedOptions = [];
  const tenantScopeFactory = (options = {}) => {
    capturedOptions.push(options);
    const middleware = (req, res, next) => {
      middleware.called = true;
      middleware.options = options;
      next();
    };
    middleware.called = false;
    return middleware;
  };
  tenantScopeFactory.capturedOptions = capturedOptions;
  return tenantScopeFactory;
}

/**
 * Helper function to create mock route handlers
 */
function createMockRouteHandler(name) {
  const handler = (req, res) => {
    handler.called = true;
    res.json({ message: `${name} handler called` });
  };
  handler.called = false;
  handler.name = name;
  return handler;
}

// ============================================================================
// PUBLIC ROUTES TESTS
// ============================================================================

test('index.js -> /auth route is mounted as public (no middleware)', async () => {
  const mockAuthRoutes = express.Router();
  mockAuthRoutes.post('/login', () => {});

  await withMockedModules(
    {
      [require.resolve('./auth.routes')]: mockAuthRoutes,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      // Find the /auth route mount point
      // Mounted routes have layer.name === 'router'
      // We need to check all router layers and match by checking the handle
      const routerLayers = router.stack.filter((layer) => layer.name === 'router');
      const authMount = routerLayers.find(
        (layer) => layer.handle === mockAuthRoutes
      );

      assert.ok(authMount, 'Auth route should be mounted at /auth');
      // For mounted routes, stack contains the middleware chain
      // Public route should have no middleware
      assert.equal(
        authMount.stack.length,
        0,
        'Auth route should have no middleware (public route)'
      );
    }
  );
});

// ============================================================================
// SUPERADMIN ROUTES TESTS
// ============================================================================

test('index.js -> /admin/municipalities route uses auth + authorize(SUPERADMIN)', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockAuthorize = createMockAuthorize();
  const mockMunicipalitiesRoutes = express.Router();
  mockMunicipalitiesRoutes.get('/', () => {});

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('./municipalities.routes')]: mockMunicipalitiesRoutes,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      // Find the /admin/municipalities mount point
      const municipalitiesMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockMunicipalitiesRoutes
      );

      assert.ok(
        municipalitiesMount,
        'Municipalities route should be mounted at /admin/municipalities'
      );

      // Check middleware stack
      assert.equal(
        municipalitiesMount.stack.length,
        2,
        'Municipalities route should have 2 middleware (auth + authorize)'
      );

      // Verify authorize was called with SUPERADMIN
      assert.ok(
        mockAuthorize.capturedRoles.length > 0,
        'Authorize should be called'
      );
      const lastCall = mockAuthorize.capturedRoles[mockAuthorize.capturedRoles.length - 1];
      assert.deepEqual(
        lastCall,
        [ROLES.SUPERADMIN],
        'Authorize should be called with SUPERADMIN role'
      );
    }
  );
});

test('index.js -> /superadmin route uses auth + authorize(SUPERADMIN)', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockAuthorize = createMockAuthorize();
  const mockSuperadminRoutes = express.Router();
  mockSuperadminRoutes.get('/stats', () => {});

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('./superadmin.routes')]: mockSuperadminRoutes,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      // Find the /superadmin mount point
      const superadminMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockSuperadminRoutes
      );

      assert.ok(
        superadminMount,
        'Superadmin route should be mounted at /superadmin'
      );

      // Check middleware stack
      assert.equal(
        superadminMount.stack.length,
        2,
        'Superadmin route should have 2 middleware (auth + authorize)'
      );

      // Verify authorize was called with SUPERADMIN
      assert.ok(
        mockAuthorize.capturedRoles.length > 0,
        'Authorize should be called'
      );
      const lastCall = mockAuthorize.capturedRoles[mockAuthorize.capturedRoles.length - 1];
      assert.deepEqual(
        lastCall,
        [ROLES.SUPERADMIN],
        'Authorize should be called with SUPERADMIN role'
      );
    }
  );
});

// ============================================================================
// MULTI-TENANT ROUTES TESTS
// ============================================================================

test('index.js -> /users route uses auth + tenantScope()', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockTenantScope = createMockTenantScope();
  const mockUserRoutes = express.Router();
  mockUserRoutes.get('/', () => {});

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/tenantScope')]: mockTenantScope,
      [require.resolve('./user.routes')]: mockUserRoutes,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      // Find the /users mount point
      const usersMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockUserRoutes
      );

      assert.ok(usersMount, 'Users route should be mounted at /users');

      // Check middleware stack
      assert.equal(
        usersMount.stack.length,
        2,
        'Users route should have 2 middleware (auth + tenantScope)'
      );

      // Verify tenantScope was called with default options
      assert.ok(
        mockTenantScope.capturedOptions.length > 0,
        'TenantScope should be called'
      );
      const lastCall = mockTenantScope.capturedOptions[mockTenantScope.capturedOptions.length - 1];
      assert.deepEqual(
        lastCall,
        {},
        'TenantScope should be called with default options (empty object)'
      );
    }
  );
});

test('index.js -> /assets route uses auth + tenantScope()', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockTenantScope = createMockTenantScope();
  const mockAssetsRoutes = express.Router();
  mockAssetsRoutes.get('/', () => {});

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/tenantScope')]: mockTenantScope,
      [require.resolve('./assets.route')]: mockAssetsRoutes,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      // Find the /assets mount point
      const assetsMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockAssetsRoutes
      );

      assert.ok(assetsMount, 'Assets route should be mounted at /assets');

      // Check middleware stack
      assert.equal(
        assetsMount.stack.length,
        2,
        'Assets route should have 2 middleware (auth + tenantScope)'
      );
    }
  );
});

test('index.js -> /asset-categories route uses auth + tenantScope()', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockTenantScope = createMockTenantScope();
  const mockAssetCategoriesRoutes = express.Router();
  mockAssetCategoriesRoutes.get('/', () => {});

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/tenantScope')]: mockTenantScope,
      [require.resolve('./asset.categories.routes')]: mockAssetCategoriesRoutes,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      const categoriesMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockAssetCategoriesRoutes
      );

      assert.ok(
        categoriesMount,
        'Asset categories route should be mounted at /asset-categories'
      );

      assert.equal(
        categoriesMount.stack.length,
        2,
        'Asset categories route should have 2 middleware (auth + tenantScope)'
      );
    }
  );
});

test('index.js -> /departments route uses auth + tenantScope()', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockTenantScope = createMockTenantScope();
  const mockDepartmentRoutes = express.Router();
  mockDepartmentRoutes.get('/', () => {});

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/tenantScope')]: mockTenantScope,
      [require.resolve('./department.routes')]: mockDepartmentRoutes,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      const departmentsMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockDepartmentRoutes
      );

      assert.ok(
        departmentsMount,
        'Departments route should be mounted at /departments'
      );

      assert.equal(
        departmentsMount.stack.length,
        2,
        'Departments route should have 2 middleware (auth + tenantScope)'
      );
    }
  );
});

test('index.js -> /locations route uses auth + tenantScope()', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockTenantScope = createMockTenantScope();
  const mockLocationsRoutes = express.Router();
  mockLocationsRoutes.get('/', () => {});

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/tenantScope')]: mockTenantScope,
      [require.resolve('./locations.routes')]: mockLocationsRoutes,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      const locationsMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockLocationsRoutes
      );

      assert.ok(
        locationsMount,
        'Locations route should be mounted at /locations'
      );

      assert.equal(
        locationsMount.stack.length,
        2,
        'Locations route should have 2 middleware (auth + tenantScope)'
      );
    }
  );
});

test('index.js -> /inventory route uses auth + tenantScope()', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockTenantScope = createMockTenantScope();
  const mockInventoryRoutes = express.Router();
  mockInventoryRoutes.get('/', () => {});

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/tenantScope')]: mockTenantScope,
      [require.resolve('./inventory.routes')]: mockInventoryRoutes,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      const inventoryMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockInventoryRoutes
      );

      assert.ok(
        inventoryMount,
        'Inventory route should be mounted at /inventory'
      );

      assert.equal(
        inventoryMount.stack.length,
        2,
        'Inventory route should have 2 middleware (auth + tenantScope)'
      );
    }
  );
});

test('index.js -> /maintenance route uses auth + tenantScope()', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockTenantScope = createMockTenantScope();
  const mockMaintenanceRoutes = express.Router();
  mockMaintenanceRoutes.get('/', () => {});

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/tenantScope')]: mockTenantScope,
      [require.resolve('./maintenance.routes')]: mockMaintenanceRoutes,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      const maintenanceMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockMaintenanceRoutes
      );

      assert.ok(
        maintenanceMount,
        'Maintenance route should be mounted at /maintenance'
      );

      assert.equal(
        maintenanceMount.stack.length,
        2,
        'Maintenance route should have 2 middleware (auth + tenantScope)'
      );
    }
  );
});

test('index.js -> /reports route uses auth + tenantScope()', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockTenantScope = createMockTenantScope();
  const mockReportsRoutes = express.Router();
  mockReportsRoutes.get('/', () => {});

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/tenantScope')]: mockTenantScope,
      [require.resolve('./reports.routes')]: mockReportsRoutes,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      const reportsMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockReportsRoutes
      );

      assert.ok(reportsMount, 'Reports route should be mounted at /reports');

      assert.equal(
        reportsMount.stack.length,
        2,
        'Reports route should have 2 middleware (auth + tenantScope)'
      );
    }
  );
});

test('index.js -> /audit route uses auth + tenantScope()', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockTenantScope = createMockTenantScope();
  const mockAuditRoutes = express.Router();
  mockAuditRoutes.get('/', () => {});

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/tenantScope')]: mockTenantScope,
      [require.resolve('./audit.routes')]: mockAuditRoutes,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      const auditMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockAuditRoutes
      );

      assert.ok(auditMount, 'Audit route should be mounted at /audit');

      assert.equal(
        auditMount.stack.length,
        2,
        'Audit route should have 2 middleware (auth + tenantScope)'
      );
    }
  );
});

test('index.js -> /qrcode route uses auth + tenantScope()', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockTenantScope = createMockTenantScope();
  const mockQrcodeRoutes = express.Router();
  mockQrcodeRoutes.get('/', () => {});

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/tenantScope')]: mockTenantScope,
      [require.resolve('./qrcode.routes')]: mockQrcodeRoutes,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      const qrcodeMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockQrcodeRoutes
      );

      assert.ok(qrcodeMount, 'QRCode route should be mounted at /qrcode');

      assert.equal(
        qrcodeMount.stack.length,
        2,
        'QRCode route should have 2 middleware (auth + tenantScope)'
      );
    }
  );
});

test('index.js -> /dashboard route uses auth + tenantScope()', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockTenantScope = createMockTenantScope();
  const mockDashboardRoutes = express.Router();
  mockDashboardRoutes.get('/', () => {});

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/tenantScope')]: mockTenantScope,
      [require.resolve('./dashboard.routes')]: mockDashboardRoutes,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      const dashboardMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockDashboardRoutes
      );

      assert.ok(
        dashboardMount,
        'Dashboard route should be mounted at /dashboard'
      );

      assert.equal(
        dashboardMount.stack.length,
        2,
        'Dashboard route should have 2 middleware (auth + tenantScope)'
      );
    }
  );
});

test('index.js -> /asset-movements route uses auth + tenantScope()', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockTenantScope = createMockTenantScope();
  const mockAssetMovementsRoutes = express.Router();
  mockAssetMovementsRoutes.get('/', () => {});

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/tenantScope')]: mockTenantScope,
      [require.resolve('./asset.movements.route')]: mockAssetMovementsRoutes,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      const assetMovementsMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockAssetMovementsRoutes
      );

      assert.ok(
        assetMovementsMount,
        'Asset movements route should be mounted at /asset-movements'
      );

      assert.equal(
        assetMovementsMount.stack.length,
        2,
        'Asset movements route should have 2 middleware (auth + tenantScope)'
      );
    }
  );
});

test('index.js -> /uploads route uses auth + tenantScope()', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockTenantScope = createMockTenantScope();
  const mockUploadsRoutes = express.Router();
  mockUploadsRoutes.get('/', () => {});

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/tenantScope')]: mockTenantScope,
      [require.resolve('./uploads.routes')]: mockUploadsRoutes,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      const uploadsMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockUploadsRoutes
      );

      assert.ok(uploadsMount, 'Uploads route should be mounted at /uploads');

      assert.equal(
        uploadsMount.stack.length,
        2,
        'Uploads route should have 2 middleware (auth + tenantScope)'
      );
    }
  );
});

test('index.js -> /profile route uses auth + tenantScope({ allowSuperadmin: true })', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockTenantScope = createMockTenantScope();
  const mockProfileRoutes = express.Router();
  mockProfileRoutes.get('/', () => {});

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/tenantScope')]: mockTenantScope,
      [require.resolve('./profile.routes')]: mockProfileRoutes,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      const profileMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockProfileRoutes
      );

      assert.ok(profileMount, 'Profile route should be mounted at /profile');

      assert.equal(
        profileMount.stack.length,
        2,
        'Profile route should have 2 middleware (auth + tenantScope)'
      );

      // Verify tenantScope was called with allowSuperadmin: true
      assert.ok(
        mockTenantScope.capturedOptions.length > 0,
        'TenantScope should be called'
      );
      const lastCall = mockTenantScope.capturedOptions[mockTenantScope.capturedOptions.length - 1];
      assert.deepEqual(
        lastCall,
        { allowSuperadmin: true },
        'Profile route tenantScope should be called with allowSuperadmin: true'
      );
    }
  );
});

// ============================================================================
// COMPREHENSIVE ROUTE REGISTRATION TESTS
// ============================================================================

test('index.js -> all expected routes are registered', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockAuthorize = createMockAuthorize();
  const mockTenantScope = createMockTenantScope();

  // Create minimal mock routes for all route files
  const mockRoutes = {
    auth: express.Router(),
    municipalities: express.Router(),
    superadmin: express.Router(),
    users: express.Router(),
    assets: express.Router(),
    assetCategories: express.Router(),
    departments: express.Router(),
    locations: express.Router(),
    inventory: express.Router(),
    maintenance: express.Router(),
    reports: express.Router(),
    audit: express.Router(),
    qrcode: express.Router(),
    dashboard: express.Router(),
    assetMovements: express.Router(),
    uploads: express.Router(),
    profile: express.Router(),
  };

  const mocks = {
    [require.resolve('../middleware/auth')]: mockAuth,
    [require.resolve('../middleware/authorize')]: mockAuthorize,
    [require.resolve('../middleware/tenantScope')]: mockTenantScope,
    [require.resolve('./auth.routes')]: mockRoutes.auth,
    [require.resolve('./municipalities.routes')]: mockRoutes.municipalities,
    [require.resolve('./superadmin.routes')]: mockRoutes.superadmin,
    [require.resolve('./user.routes')]: mockRoutes.users,
    [require.resolve('./assets.route')]: mockRoutes.assets,
    [require.resolve('./asset.categories.routes')]: mockRoutes.assetCategories,
    [require.resolve('./department.routes')]: mockRoutes.departments,
    [require.resolve('./locations.routes')]: mockRoutes.locations,
    [require.resolve('./inventory.routes')]: mockRoutes.inventory,
    [require.resolve('./maintenance.routes')]: mockRoutes.maintenance,
    [require.resolve('./reports.routes')]: mockRoutes.reports,
    [require.resolve('./audit.routes')]: mockRoutes.audit,
    [require.resolve('./qrcode.routes')]: mockRoutes.qrcode,
    [require.resolve('./dashboard.routes')]: mockRoutes.dashboard,
    [require.resolve('./asset.movements.route')]: mockRoutes.assetMovements,
    [require.resolve('./uploads.routes')]: mockRoutes.uploads,
    [require.resolve('./profile.routes')]: mockRoutes.profile,
  };

  await withMockedModules(mocks, async () => {
    delete require.cache[require.resolve('./index')];
    const router = require('./index');

    // Expected routes with their paths
    const expectedRoutes = [
      { path: '/auth', type: 'public' },
      { path: '/admin/municipalities', type: 'superadmin' },
      { path: '/superadmin', type: 'superadmin' },
      { path: '/users', type: 'tenant' },
      { path: '/assets', type: 'tenant' },
      { path: '/asset-categories', type: 'tenant' },
      { path: '/departments', type: 'tenant' },
      { path: '/locations', type: 'tenant' },
      { path: '/inventory', type: 'tenant' },
      { path: '/maintenance', type: 'tenant' },
      { path: '/reports', type: 'tenant' },
      { path: '/audit', type: 'tenant' },
      { path: '/qrcode', type: 'tenant' },
      { path: '/dashboard', type: 'tenant' },
      { path: '/asset-movements', type: 'tenant' },
      { path: '/uploads', type: 'tenant' },
      { path: '/profile', type: 'tenant-special' },
    ];

    // Verify all routes are mounted
    // We'll check that we have the expected number of router layers
    const routerLayers = router.stack.filter((layer) => layer.name === 'router');
    assert.equal(
      routerLayers.length,
      expectedRoutes.length,
      `Should have exactly ${expectedRoutes.length} mounted routes`
    );
    
    // Verify each route type has correct middleware
    expectedRoutes.forEach(({ path, type }) => {
      // Find route by checking if it's in our mock routes
      const mount = routerLayers.find((layer) => {
        const mockRoute = Object.values(mockRoutes).find(r => r === layer.handle);
        return mockRoute !== undefined;
      });

      assert.ok(mount, `Route ${path} should be mounted`);

      // Verify middleware count based on route type
      if (type === 'public') {
        assert.equal(
          mount.stack.length,
          0,
          `Public route ${path} should have no middleware`
        );
      } else if (type === 'superadmin') {
        assert.equal(
          mount.stack.length,
          2,
          `Superadmin route ${path} should have 2 middleware (auth + authorize)`
        );
      } else {
        assert.equal(
          mount.stack.length,
          2,
          `Tenant route ${path} should have 2 middleware (auth + tenantScope)`
        );
      }
    });

    // Already verified above
  });
});

test('index.js -> middleware order is correct (auth before authorize/tenantScope)', async () => {
  const mockAuth = createMockMiddleware('auth');
  const mockAuthorize = createMockAuthorize();
  const mockTenantScope = createMockTenantScope();
  const mockRoutes = {
    users: express.Router(),
    municipalities: express.Router(),
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: mockAuth,
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('../middleware/tenantScope')]: mockTenantScope,
      [require.resolve('./user.routes')]: mockRoutes.users,
      [require.resolve('./municipalities.routes')]: mockRoutes.municipalities,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      const router = require('./index');

      // Check tenant route (users)
      const usersMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockRoutes.users
      );
      assert.ok(usersMount, 'Users route should exist');
      assert.equal(
        usersMount.stack[0].handle,
        mockAuth,
        'First middleware should be auth'
      );
      // Second middleware should be tenantScope (returned from factory)
      assert.ok(
        usersMount.stack[1].handle,
        'Second middleware should be tenantScope'
      );

      // Check superadmin route (municipalities)
      const municipalitiesMount = router.stack.find(
        (layer) => layer.name === 'router' && layer.handle === mockRoutes.municipalities
      );
      assert.ok(municipalitiesMount, 'Municipalities route should exist');
      assert.equal(
        municipalitiesMount.stack[0].handle,
        mockAuth,
        'First middleware should be auth'
      );
      // Second middleware should be authorize (returned from factory)
      assert.ok(
        municipalitiesMount.stack[1].handle,
        'Second middleware should be authorize'
      );
    }
  );
});

test('index.js -> ROLES constant is imported and used correctly', async () => {
  const mockAuthorize = createMockAuthorize();
  const mockRoutes = {
    municipalities: { stack: [] },
  };

  await withMockedModules(
    {
      [require.resolve('../middleware/auth')]: createMockMiddleware('auth'),
      [require.resolve('../middleware/authorize')]: mockAuthorize,
      [require.resolve('./municipalities.routes')]: mockRoutes.municipalities,
    },
    async () => {
      delete require.cache[require.resolve('./index')];
      require('./index');

      // Verify authorize was called with ROLES.SUPERADMIN
      assert.ok(
        mockAuthorize.capturedRoles.length > 0,
        'Authorize should be called for superadmin routes'
      );

      const superadminCalls = mockAuthorize.capturedRoles.filter(
        (roles) => roles.includes(ROLES.SUPERADMIN)
      );

      assert.ok(
        superadminCalls.length >= 2,
        'Authorize should be called with SUPERADMIN for at least 2 routes (municipalities and superadmin)'
      );
    }
  );
});

