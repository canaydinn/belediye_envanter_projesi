const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const auth = require('../middleware/auth');

// 1 = admin (örnek)
router.get('/', auth, usersController.getAll);
router.get('/:id', auth,  usersController.getById);
router.post('/',  usersController.create);
router.put('/:id', auth,  usersController.update);
router.delete('/:id', auth, usersController.remove);

module.exports = router;
