const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// 1 = admin (örnek)
router.get('/', auth, requireRole(1), usersController.getAll);
router.get('/:id', auth, requireRole(1), usersController.getById);
router.post('/', auth, requireRole(1), usersController.create);
router.put('/:id', auth, requireRole(1), usersController.update);
router.delete('/:id', auth, requireRole(1), usersController.remove);

module.exports = router;
