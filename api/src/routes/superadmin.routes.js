const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadmin.controller');
const authMiddleware = require('../middleware/auth');
const authorizeRole = require('../middleware/authorizeRole');

// router.use(authMiddleware, authorizeRole('superadmin'));

// Sayaçlar & listeler
router.get('/municipalities/count', superadminController.getMunicipalityCount);
router.get('/municipalities/active/count', superadminController.getActiveCount);
router.get('/municipalities/pending/count', superadminController.getPendingMunicipalitiesCount);
router.get('/users/count', superadminController.getTotalCount);

router.get('/municipalities', superadminController.listMunicipalities);
router.get('/municipalities/active', superadminController.listActiveMunicipalities);
router.get('/municipalities/pending', superadminController.listPendingMunicipalities);

// Plan bazlı
router.get('/municipalities/plan/standard', superadminController.getStandardPlanMunicipalityCount);
router.get('/municipalities/plan/pro', superadminController.getProPlanMunicipalityCount);
router.get('/municipalities/plan/deneme', superadminController.getDenemePlanMunicipalityCount);

// Loglar
router.get('/logs/recent', superadminController.listRecentLogs);

// Kullanıcı listesi
router.get('/users', superadminController.listUsersByMunicipality);

// CRUD
router.post('/municipalities/create', superadminController.createMunicipality);
router.patch('/municipalities/:id/status', superadminController.updateMunicipalityStatus);
router.patch('/municipalities/:id/deactivate', superadminController.deactivateMunicipality);
router.put('/municipalities/:id', superadminController.updateMunicipality);

// ❗ En sona:
router.get('/municipalities/:id', superadminController.getMunicipalityById);

module.exports = router;