const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadmin.controller');
const authorize = require('../middleware/authorize');

const ROLES = require('../constants/roles');


// router.use(authMiddleware, authorizeRole('superadmin'));

// Sayaçlar & listeler
router.get('/municipalities/count',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.getMunicipalityCount);
router.get('/municipalities/active/count',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.getActiveCount);
router.get('/municipalities/pending/count',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.getPendingMunicipalitiesCount);
router.get('/users/count',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.getTotalCount);

router.get('/municipalities',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.listMunicipalities);
router.get('/municipalities/active',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.listActiveMunicipalities);
router.get('/municipalities/pending',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.listPendingMunicipalities);
// Plan bazlı
router.get('/municipalities/plan/standard',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.getStandardPlanMunicipalityCount);
router.get('/municipalities/plan/pro',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.getProPlanMunicipalityCount);
router.get('/municipalities/plan/deneme',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.getDenemePlanMunicipalityCount);
// Loglar
router.get('/logs/recent',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.listRecentLogs);

// Kullanıcı listesi
router.get('/users',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.listUsersByMunicipality);

// CRUD
router.post('/municipalities/create',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.createMunicipality);
router.patch('/municipalities/:id/status',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.updateMunicipalityStatus);
router.patch('/municipalities/:id/deactivate',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.deactivateMunicipality);
router.put('/municipalities/:id',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.updateMunicipality);
router.post('/users',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.createUser);
router.get('/users/all',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.listAllUsers);
router.get('/logs/stats',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.getLogStats);
// ❗ En sona:
router.get('/municipalities/:id',authorize(ROLES.MUNICIPALITY_SUPER_ADMIN), superadminController.getMunicipalityById);

module.exports = router;