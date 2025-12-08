// api/src/routes/department.routes.js
const express = require('express');
const router = express.Router();

const departmentsController = require('../controllers/departments.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// Listeleme tüm oturum sahiplerine açık
router.get('/', auth, departmentsController.getAll);
router.get('/:id', auth, departmentsController.getById);
// Yönetim işlemleri için rol kısıtları
router.post('/', auth, requireRole([1, 2]), departmentsController.create);
router.put('/:id', auth, requireRole([1, 2]), departmentsController.update);
router.delete('/:id', auth, requireRole(1), departmentsController.remove);

module.exports = router;
