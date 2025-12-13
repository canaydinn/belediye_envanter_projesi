const express = require('express');
const router = express.Router();

const uploadsController = require('../controllers/uploads.controller');

// Örnek: Multer middleware'i burada kullanılabilir
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });


// POST /api/uploads
router.post('/', upload.single('file'), uploadsController.uploadFile);

// GET /api/uploads/:fileId
router.get('/:fileId', uploadsController.getFileById);

// DELETE /api/uploads/:fileId
router.delete('/:fileId',  uploadsController.deleteFile);

module.exports = router;
