// api/src/routes/asset.movements.route.js
const express = require('express');
const router = express.Router();

const usersController = require('../controllers/users.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

// Superadmin + Municipality Admin
router.get('/stats', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN), usersController.getSummaryStats);
router.get('/detailed' ,authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN), usersController.getDetailedList);
router.get('/today-logins',authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN) , usersController.getTodayLogins);
router.get('/:id',authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN), usersController.getById);
router.post('/',authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN), usersController.create);
router.put('/:id', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN),usersController.update);
router.patch('/:id/toggle-status', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN), usersController.toggleStatus);
router.post('/:id/reset-password', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN), usersController.resetPassword);

module.exports = router;
