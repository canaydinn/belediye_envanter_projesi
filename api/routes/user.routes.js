const express = require('express');
const router = express.Router();

const usersController = require('../controllers/users.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

// Tüm işlemler login zorunlu
router.use(requireAuth);

// POST /api/users
router.post('/', requireRole(['admin']), usersController.createUser);

// GET /api/users
router.get('/', requireRole(['admin']), usersController.listUsers);

// GET /api/users/:id
router.get('/:id', requireRole(['admin']), usersController.getUserById);

// PATCH /api/users/:id
router.patch('/:id', requireRole(['admin']), usersController.updateUser);

// DELETE /api/users/:id
router.delete('/:id', requireRole(['admin']), usersController.deleteUser);

// PATCH /api/users/:id/role
router.patch('/:id/role', requireRole(['admin']), usersController.updateUserRole);

module.exports = router;
