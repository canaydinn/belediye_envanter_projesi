const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadmin.controller');
const authorize = require('../middleware/authorize');

const ROLES = require('../constants/roles');


// router.use(authMiddleware, authorizeRole('superadmin'));

// Sayaçlar & listeler
router.get('/municipalities/count',authorize(ROLES.SUPERADMIN), superadminController.getMunicipalityCount);
router.get('/municipalities/active/count',authorize(ROLES.SUPERADMIN), superadminController.getActiveCount);
router.get('/municipalities/pending/count',authorize(ROLES.SUPERADMIN), superadminController.getPendingMunicipalitiesCount);
router.get('/users/count',authorize(ROLES.SUPERADMIN), superadminController.getTotalCount);

router.get('/municipalities',authorize(ROLES.SUPERADMIN), superadminController.listMunicipalities);
router.get('/municipalities/active',authorize(ROLES.SUPERADMIN), superadminController.listActiveMunicipalities);
router.get('/municipalities/pending',authorize(ROLES.SUPERADMIN), superadminController.listPendingMunicipalities);
// Plan bazlı
router.get('/municipalities/plan/standard',authorize(ROLES.SUPERADMIN), superadminController.getStandardPlanMunicipalityCount);
router.get('/municipalities/plan/pro',authorize(ROLES.SUPERADMIN), superadminController.getProPlanMunicipalityCount);
router.get('/municipalities/plan/deneme',authorize(ROLES.SUPERADMIN), superadminController.getDenemePlanMunicipalityCount);
// Loglar
router.get('/logs/recent',authorize(ROLES.SUPERADMIN), superadminController.listRecentLogs);

// Kullanıcı listesi
router.get('/users',authorize(ROLES.SUPERADMIN), superadminController.listUsersByMunicipality);
router.get('/users/all',authorize(ROLES.SUPERADMIN), superadminController.listAllUsers);

// CRUD
router.post('/municipalities/create',authorize(ROLES.SUPERADMIN), superadminController.createMunicipality);
router.patch('/municipalities/:id/status',authorize(ROLES.SUPERADMIN), superadminController.updateMunicipalityStatus);
router.patch('/municipalities/:id/deactivate',authorize(ROLES.SUPERADMIN), superadminController.deactivateMunicipality);
router.put('/municipalities/:id',authorize(ROLES.SUPERADMIN), superadminController.updateMunicipality);
router.post('/users',authorize(ROLES.SUPERADMIN), superadminController.createUser);
router.get('/logs/stats',authorize(ROLES.SUPERADMIN), superadminController.getLogStats);
// ❗ En sona (parametreli route'lar):
router.get('/municipalities/:id',authorize(ROLES.SUPERADMIN), superadminController.getMunicipalityById);
// Kullanıcı detayı (superadmin için, tenant scope olmadan) - en sona, diğer /users route'larından sonra
router.get('/users/:id',authorize(ROLES.SUPERADMIN), superadminController.getUserById);

module.exports = router;