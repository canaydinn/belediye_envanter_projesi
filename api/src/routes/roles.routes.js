// api/src/routes/roles.routes.js
const express = require('express');
const router = express.Router();

const rolesController = require('../controllers/roles.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

// READ (Superadmin + Municipality Admin + User)
router.get('/', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), rolesController.getAll);
router.get('/:id', authorize(ROLES.SUPERADMIN, ROLES.MUNICIPALITY_ADMIN, ROLES.USER), rolesController.getById);

module.exports = router;
