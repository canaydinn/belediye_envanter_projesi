// api/routes/index.js
const express = require('express');
const router = express.Router();
const authRouter = require('../routes/auth.routes');
const usersRouter = require('../routes/user.routes');
const departmentsRouter = require('../routes/department.routes');
const inventoryRouter = require('../routes/inventory.routes');
const qrcodeRouter = require('../routes/qrcode.routes');
const locationsRouter = require('../routes/locations.routes');
const maintenanceRouter = require('../routes/maintenance.routes');
const uploadsRouter = require('../routes/uploads.routes');
const reportsRouter = require('../routes/reports.routes');
const auditRouter = require('../routes/audit.routes');

// /api/auth/...
router.use('/auth', authRouter);

// /api/users/...
router.use('/users', usersRouter);

// /api/departments/...
router.use('/departments', departmentsRouter);

// /api/inventory/...
router.use('/inventory', inventoryRouter);

// /api/qrcode/...
router.use('/qrcode', qrcodeRouter);

// /api/locations/...
router.use('/locations', locationsRouter);

// /api/maintenance/...
router.use('/maintenance', maintenanceRouter);

// /api/uploads/...
router.use('/uploads', uploadsRouter);

// /api/reports/...
router.use('/reports', reportsRouter);

// /api/audit/...
router.use('/audit', auditRouter);

module.exports = router;
