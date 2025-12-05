// api/routes/superadmin.routes.js
const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadmin.controller');
const authMiddleware = require('../middleware/auth');
const authorizeRole = require('../middleware/authorizeRole');

//router.use(authMiddleware, authorizeRole('superadmin'));
router.get('/municipalities/count', superadminController.getMunicipalityCount);
router.get('/municipalities', superadminController.listMunicipalities);
router.patch('/municipalities/:id/status', superadminController.updateMunicipalityStatus);
router.get('/municipalities/active', superadminController.listActiveMunicipalities);
router.get('/municipalities/pending', superadminController.listPendingMunicipalities);
router.post('/municipalities/create', superadminController.createMunicipality);
router.get('/municipalities/:id', superadminController.getMunicipalityById);
router.get('/users', superadminController.listUsersByMunicipality);
router.get('/municipalities/plan/standard', superadminController.getStandardPlanMunicipalityCount);
router.get('/municipalities/plan/pro', superadminController.getProPlanMunicipalityCount);
router.get('/municipalities/plan/deneme', superadminController.getDenemePlanMunicipalityCount);
router.get('/logs/recent', superadminController.listRecentLogs);
// Toplam aktif belediye sayısını döndür
router.get('/municipalities/active/count',superadminController.getActiveCount);
router.get('/municipalities/pending/count',superadminController.getPendingMunicipalitiesCount);
router.get('/users/count', superadminController.getTotalCount);
module.exports = router;
