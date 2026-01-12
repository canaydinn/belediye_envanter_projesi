// api/src/routes/roles.routes.js
const express = require('express');
const router = express.Router();

const rolesController = require('../controllers/roles.controller');
const authorize = require('../middleware/authorize');
const ROLES = require('../constants/roles');

// READ (Tüm roller)
router.get(
  '/',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  rolesController.getAll
);
router.get(
  '/:id',
  authorize(
    ROLES.SUPERADMIN,
    ROLES.ADMIN,
    ROLES.TASINIR_KAYIT,
    ROLES.TASINIR_KONTROL,
    ROLES.BIRIM_SORUMLUSU,
    ROLES.KULLANICI
  ),
  rolesController.getById
);

module.exports = router;
