const express = require('express');
const router = express.Router();

const reportsController = require('../controllers/reports.controller');

// GET /api/reports/inventory-summary
router.get('/inventory-summary', reportsController.getInventorySummary);

// GET /api/reports/maintenance-summary
router.get('/maintenance-summary', reportsController.getMaintenanceSummary);

// GET /api/reports/export/excel
router.get('/export/excel', reportsController.exportExcel);

// GET /api/reports/export/pdf
router.get('/export/pdf', reportsController.exportPdf);

module.exports = router;
