const express = require('express');
const router = express.Router();

const uploadsController = require('../controllers/uploads.controller');

// Multer configuration - Vercel'de dosya sistemi read-only olduğu için
// production'da memory storage kullanıyoruz
const multer = require('multer');

// Production ortamında (Vercel) memory storage kullan
// Development ortamında disk storage kullan
const storage = process.env.NODE_ENV === 'production' 
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'uploads/');
      },
      filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
      }
    });

const upload = multer({ storage: storage });


// POST /api/uploads
router.post('/', upload.single('file'), uploadsController.uploadFile);

// GET /api/uploads/:fileId
router.get('/:fileId', uploadsController.getFileById);

// DELETE /api/uploads/:fileId
router.delete('/:fileId',  uploadsController.deleteFile);

module.exports = router;
