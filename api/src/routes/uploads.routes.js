const express = require('express');
const router = express.Router();

const uploadsController = require('../controllers/uploads.controller');
const { requireAuth } = require('../../src/middleware/auth.middleware');
const { requireRole } = require('../../src/middleware/role.middleware');

// Örnek: Multer middleware'i burada kullanılabilir
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.use(requireAuth);

// POST /api/uploads
router.post('/', upload.single('file'), uploadsController.uploadFile);

// GET /api/uploads/:fileId
router.get('/:fileId', uploadsController.getFileById);

// DELETE /api/uploads/:fileId
router.delete('/:fileId', requireRole(['admin']), uploadsController.deleteFile);

module.exports = router;
