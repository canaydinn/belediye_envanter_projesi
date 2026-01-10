// api/src/routes/user.routes.js
const express = require('express');
const router = express.Router();

const usersController = require('../controllers/users.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

// Superadmin + Admin
router.get('/stats', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), usersController.getSummaryStats);
router.get('/detailed', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), usersController.getDetailedList);
router.get('/today-logins', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), usersController.getTodayLogins);
router.get('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), usersController.getById);
router.post('/', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), usersController.create);
router.put('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), usersController.update);
router.patch('/:id/toggle-status', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), usersController.toggleStatus);
router.post('/:id/reset-password', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), usersController.resetPassword);

module.exports = router;
