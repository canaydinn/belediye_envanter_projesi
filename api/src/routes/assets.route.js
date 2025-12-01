const express = require('express');
const router = express.Router();
const assetsController = require('../controllers/assets.controller');
const auth = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

// taşınır kayıt + admin yetkili kabul edelim: role_id 1 ve 2
router.get('/', auth, assetsController.list);
router.post('/', auth, requireRole(1, 2), assetsController.create);
router.put('/:id', auth, requireRole(1, 2), assetsController.update);
router.delete('/:id', auth, requireRole(1, 2), assetsController.remove);

module.exports = router;
