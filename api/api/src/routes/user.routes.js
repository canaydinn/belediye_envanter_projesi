// api/src/routes/asset.movements.route.js
const express = require('express');
const router = express.Router();

const usersController = require('../controllers/users.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

// 1 = admin (örnek)
router.get('/stats', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), usersController.getSummaryStats);
router.get('/detailed' ,authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), usersController.getDetailedList);
router.get('/today-logins',authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER) , usersController.getTodayLogins);
router.get('/:id',authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), usersController.getById);
router.post('/',authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER), usersController.create);
router.put('/:id', authorize(ROLES.MUNICIPALITY_ADMIN, ROLES.USER),usersController.update);

module.exports = router;
