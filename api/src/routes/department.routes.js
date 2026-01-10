// api/src/routes/department.routes.js
const express = require('express');
const router = express.Router();

const departmentsController = require('../controllers/departments.controller');
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
  departmentsController.getAll
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
  departmentsController.getById
);

// WRITE (Superadmin + Admin)
router.post('/', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), departmentsController.create);
router.put('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), departmentsController.update);
router.delete('/:id', authorize(ROLES.SUPERADMIN, ROLES.ADMIN), departmentsController.remove);

module.exports = router;
