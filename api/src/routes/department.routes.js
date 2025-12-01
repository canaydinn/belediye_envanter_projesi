// api/src/routes/department.routes.js
const express = require('express');
const router = express.Router();

const departmentsController = require('../controllers/departments.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// Şimdilik sadece admin (1) ve taşınır kayıt (2) görsün varsayalım:
router.get('/', auth, requireRole(1, 2), departmentsController.getAll);
router.get('/:id', auth, requireRole(1, 2), departmentsController.getById);
router.post('/', auth, requireRole(1), departmentsController.create);
router.put('/:id', auth, requireRole(1), departmentsController.update);
router.delete('/:id', auth, requireRole(1), departmentsController.remove);

module.exports = router;
