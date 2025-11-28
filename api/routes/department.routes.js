const express = require('express');
const router = express.Router();

const departmentsController = require('../controllers/departments.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

router.use(requireAuth);

// POST /api/departments
router.post('/', requireRole(['admin']), departmentsController.createDepartment);

// GET /api/departments
router.get('/', departmentsController.listDepartments);

// GET /api/departments/:id
router.get('/:id', departmentsController.getDepartmentById);

// PATCH /api/departments/:id
router.patch('/:id', requireRole(['admin']), departmentsController.updateDepartment);

// DELETE /api/departments/:id
router.delete('/:id', requireRole(['admin']), departmentsController.deleteDepartment);

module.exports = router;
