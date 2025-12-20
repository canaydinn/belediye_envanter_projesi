const test = require('node:test');
const assert = require('node:assert/strict');

const { createReq, createRes } = require('../__tests__/helpers/httpMocks');
const { withMockedModules } = require('../__tests__/helpers/mockRequire');

// ============================================================================
// uploadFile
// ============================================================================

test('uploadFile -> 400 when file is missing', async () => {
  const mockFileUpload = {
    create: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../models/FileUpload')]: mockFileUpload,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.controller')];
      const uploads = require('./uploads.controller');

      const req = createReq({
        user: { id: 1 },
        body: { type: 'document' },
      });
      const res = createRes();

      await uploads.uploadFile(req, res);
      assert.equal(res.statusCode, 400);
      assert.equal(res.body.error, 'VALIDATION_ERROR');
      assert.equal(res.body.message, 'Herhangi bir dosya yüklenmedi.');
    }
  );
});

test('uploadFile -> creates file successfully', async () => {
  const mockDoc = {
    _id: '507f1f77bcf86cd799439011',
    fileName: 'test.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    path: 'uploads/test.pdf',
    type: 'document',
    linkedTo: null,
  };

  const mockFileUpload = {
    create: async (data) => {
      return {
        _id: mockDoc._id,
        fileName: data.fileName,
        mimeType: data.mimeType,
        size: data.size,
        path: data.path,
        type: data.type,
        linkedTo: data.linkedTo,
      };
    },
  };

  await withMockedModules(
    {
      [require.resolve('../models/FileUpload')]: mockFileUpload,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.controller')];
      const uploads = require('./uploads.controller');

      const req = createReq({
        user: { id: 1 },
        body: { type: 'document' },
        file: {
          originalname: 'test.pdf',
          mimetype: 'application/pdf',
          size: 1024,
          path: 'uploads/test.pdf',
        },
      });
      const res = createRes();

      await uploads.uploadFile(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.id, mockDoc._id);
      assert.equal(res.body.fileName, 'test.pdf');
      assert.equal(res.body.mimeType, 'application/pdf');
      assert.equal(res.body.size, 1024);
      assert.equal(res.body.url, `/api/uploads/${mockDoc._id}`);
      assert.equal(res.body.type, 'document');
    }
  );
});

test('uploadFile -> creates file with linkedTo when entity and entityId provided', async () => {
  const mockDoc = {
    _id: '507f1f77bcf86cd799439012',
    fileName: 'test.jpg',
    mimeType: 'image/jpeg',
    size: 2048,
    path: 'uploads/test.jpg',
    type: 'image',
    linkedTo: { entity: 'asset', id: '123' },
  };

  const mockFileUpload = {
    create: async (data) => {
      return {
        _id: mockDoc._id,
        fileName: data.fileName,
        mimeType: data.mimeType,
        size: data.size,
        path: data.path,
        type: data.type,
        linkedTo: data.linkedTo,
      };
    },
  };

  await withMockedModules(
    {
      [require.resolve('../models/FileUpload')]: mockFileUpload,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.controller')];
      const uploads = require('./uploads.controller');

      const req = createReq({
        user: { id: 1 },
        body: {
          type: 'image',
          entity: 'asset',
          entityId: '123',
        },
        file: {
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
          size: 2048,
          path: 'uploads/test.jpg',
        },
      });
      const res = createRes();

      await uploads.uploadFile(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.linkedTo.entity, 'asset');
      assert.equal(res.body.linkedTo.id, '123');
    }
  );
});

test('uploadFile -> sets type to null when not provided', async () => {
  const mockDoc = {
    _id: '507f1f77bcf86cd799439013',
    fileName: 'test.txt',
    mimeType: 'text/plain',
    size: 512,
    path: 'uploads/test.txt',
    type: null,
    linkedTo: null,
  };

  const mockFileUpload = {
    create: async (data) => {
      return {
        _id: mockDoc._id,
        fileName: data.fileName,
        mimeType: data.mimeType,
        size: data.size,
        path: data.path,
        type: data.type,
        linkedTo: data.linkedTo,
      };
    },
  };

  await withMockedModules(
    {
      [require.resolve('../models/FileUpload')]: mockFileUpload,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.controller')];
      const uploads = require('./uploads.controller');

      const req = createReq({
        user: { id: 1 },
        body: {},
        file: {
          originalname: 'test.txt',
          mimetype: 'text/plain',
          size: 512,
          path: 'uploads/test.txt',
        },
      });
      const res = createRes();

      await uploads.uploadFile(req, res);
      assert.equal(res.statusCode, 200);
      assert.equal(res.body.type, null);
    }
  );
});

test('uploadFile -> 500 on FileUpload.create error', async () => {
  const mockFileUpload = {
    create: async () => {
      throw new Error('Database error');
    },
  };

  await withMockedModules(
    {
      [require.resolve('../models/FileUpload')]: mockFileUpload,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.controller')];
      const uploads = require('./uploads.controller');

      const req = createReq({
        user: { id: 1 },
        body: { type: 'document' },
        file: {
          originalname: 'test.pdf',
          mimetype: 'application/pdf',
          size: 1024,
          path: 'uploads/test.pdf',
        },
      });
      const res = createRes();

      await uploads.uploadFile(req, res);
      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
      assert.equal(res.body.message, 'Dosya yüklenirken bir hata oluştu.');
    }
  );
});

// ============================================================================
// getFileById
// ============================================================================

test('getFileById -> 404 when file not found in database', async () => {
  const mockFileUpload = {
    findById: async () => null,
  };

  await withMockedModules(
    {
      [require.resolve('../models/FileUpload')]: mockFileUpload,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.controller')];
      const uploads = require('./uploads.controller');

      const req = createReq({
        params: { fileId: '507f1f77bcf86cd799439011' },
      });
      const res = createRes();

      await uploads.getFileById(req, res);
      assert.equal(res.statusCode, 404);
      assert.equal(res.body.error, 'FILE_NOT_FOUND');
      assert.equal(res.body.message, 'Dosya bulunamadı.');
    }
  );
});

test('getFileById -> 404 when file not found on filesystem', async () => {
  const mockDoc = {
    _id: '507f1f77bcf86cd799439011',
    fileName: 'test.pdf',
    mimeType: 'application/pdf',
    path: 'uploads/test.pdf',
  };

  const mockFileUpload = {
    findById: async () => mockDoc,
  };

  const mockFs = {
    existsSync: () => false,
    createReadStream: () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../models/FileUpload')]: mockFileUpload,
      fs: mockFs,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.controller')];
      const uploads = require('./uploads.controller');

      const req = createReq({
        params: { fileId: '507f1f77bcf86cd799439011' },
      });
      const res = createRes();

      await uploads.getFileById(req, res);
      assert.equal(res.statusCode, 404);
      assert.equal(res.body.error, 'FILE_NOT_FOUND');
      assert.equal(res.body.message, 'Dosya bulunamadı.');
    }
  );
});

test('getFileById -> returns file successfully', async () => {
  const mockDoc = {
    _id: '507f1f77bcf86cd799439011',
    fileName: 'test.pdf',
    mimeType: 'application/pdf',
    path: 'uploads/test.pdf',
  };

  const mockFileUpload = {
    findById: async () => mockDoc,
  };

  const mockStream = {
    pipe: (res) => {
      // Simulate stream piping
      return mockStream;
    },
  };

  const mockFs = {
    existsSync: () => true,
    createReadStream: () => mockStream,
  };

  await withMockedModules(
    {
      [require.resolve('../models/FileUpload')]: mockFileUpload,
      fs: mockFs,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.controller')];
      const uploads = require('./uploads.controller');

      const req = createReq({
        params: { fileId: '507f1f77bcf86cd799439011' },
      });
      const res = createRes();

      await uploads.getFileById(req, res);
      assert.equal(res.headers['Content-Type'], 'application/pdf');
      assert.equal(
        res.headers['Content-Disposition'],
        'inline; filename="test.pdf"'
      );
    }
  );
});

test('getFileById -> 500 on FileUpload.findById error', async () => {
  const mockFileUpload = {
    findById: async () => {
      throw new Error('Database error');
    },
  };

  await withMockedModules(
    {
      [require.resolve('../models/FileUpload')]: mockFileUpload,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.controller')];
      const uploads = require('./uploads.controller');

      const req = createReq({
        params: { fileId: '507f1f77bcf86cd799439011' },
      });
      const res = createRes();

      await uploads.getFileById(req, res);
      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
      assert.equal(res.body.message, 'Dosya getirilirken bir hata oluştu.');
    }
  );
});

test('getFileById -> 500 on fs error', async () => {
  const mockDoc = {
    _id: '507f1f77bcf86cd799439011',
    fileName: 'test.pdf',
    mimeType: 'application/pdf',
    path: 'uploads/test.pdf',
  };

  const mockFileUpload = {
    findById: async () => mockDoc,
  };

  const mockFs = {
    existsSync: () => {
      throw new Error('Filesystem error');
    },
    createReadStream: () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../models/FileUpload')]: mockFileUpload,
      fs: mockFs,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.controller')];
      const uploads = require('./uploads.controller');

      const req = createReq({
        params: { fileId: '507f1f77bcf86cd799439011' },
      });
      const res = createRes();

      await uploads.getFileById(req, res);
      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
      assert.equal(res.body.message, 'Dosya getirilirken bir hata oluştu.');
    }
  );
});

// ============================================================================
// deleteFile
// ============================================================================

test('deleteFile -> 404 when file not found in database', async () => {
  const mockFileUpload = {
    findById: async () => null,
    deleteOne: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../models/FileUpload')]: mockFileUpload,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.controller')];
      const uploads = require('./uploads.controller');

      const req = createReq({
        params: { fileId: '507f1f77bcf86cd799439011' },
      });
      const res = createRes();

      await uploads.deleteFile(req, res);
      assert.equal(res.statusCode, 404);
      assert.equal(res.body.error, 'FILE_NOT_FOUND');
      assert.equal(res.body.message, 'Dosya bulunamadı.');
    }
  );
});

test('deleteFile -> deletes file successfully when file exists on filesystem', async () => {
  const mockDoc = {
    _id: '507f1f77bcf86cd799439011',
    fileName: 'test.pdf',
    path: 'uploads/test.pdf',
  };

  let unlinkCalled = false;

  const mockFileUpload = {
    findById: async () => mockDoc,
    deleteOne: async () => {},
  };

  const mockFs = {
    existsSync: () => true,
    unlinkSync: () => {
      unlinkCalled = true;
    },
  };

  await withMockedModules(
    {
      [require.resolve('../models/FileUpload')]: mockFileUpload,
      fs: mockFs,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.controller')];
      const uploads = require('./uploads.controller');

      const req = createReq({
        params: { fileId: '507f1f77bcf86cd799439011' },
      });
      const res = createRes();

      await uploads.deleteFile(req, res);
      assert.equal(res.statusCode, 204);
      assert.equal(unlinkCalled, true);
    }
  );
});

test('deleteFile -> deletes file successfully when file does not exist on filesystem', async () => {
  const mockDoc = {
    _id: '507f1f77bcf86cd799439011',
    fileName: 'test.pdf',
    path: 'uploads/test.pdf',
  };

  let unlinkCalled = false;

  const mockFileUpload = {
    findById: async () => mockDoc,
    deleteOne: async () => {},
  };

  const mockFs = {
    existsSync: () => false,
    unlinkSync: () => {
      unlinkCalled = true;
    },
  };

  await withMockedModules(
    {
      [require.resolve('../models/FileUpload')]: mockFileUpload,
      fs: mockFs,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.controller')];
      const uploads = require('./uploads.controller');

      const req = createReq({
        params: { fileId: '507f1f77bcf86cd799439011' },
      });
      const res = createRes();

      await uploads.deleteFile(req, res);
      assert.equal(res.statusCode, 204);
      assert.equal(unlinkCalled, false);
    }
  );
});

test('deleteFile -> 500 on FileUpload.findById error', async () => {
  const mockFileUpload = {
    findById: async () => {
      throw new Error('Database error');
    },
    deleteOne: async () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../models/FileUpload')]: mockFileUpload,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.controller')];
      const uploads = require('./uploads.controller');

      const req = createReq({
        params: { fileId: '507f1f77bcf86cd799439011' },
      });
      const res = createRes();

      await uploads.deleteFile(req, res);
      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
      assert.equal(res.body.message, 'Dosya silinirken bir hata oluştu.');
    }
  );
});

test('deleteFile -> 500 on FileUpload.deleteOne error', async () => {
  const mockDoc = {
    _id: '507f1f77bcf86cd799439011',
    fileName: 'test.pdf',
    path: 'uploads/test.pdf',
  };

  const mockFileUpload = {
    findById: async () => mockDoc,
    deleteOne: async () => {
      throw new Error('Database error');
    },
  };

  const mockFs = {
    existsSync: () => false,
    unlinkSync: () => {},
  };

  await withMockedModules(
    {
      [require.resolve('../models/FileUpload')]: mockFileUpload,
      fs: mockFs,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.controller')];
      const uploads = require('./uploads.controller');

      const req = createReq({
        params: { fileId: '507f1f77bcf86cd799439011' },
      });
      const res = createRes();

      await uploads.deleteFile(req, res);
      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
      assert.equal(res.body.message, 'Dosya silinirken bir hata oluştu.');
    }
  );
});

test('deleteFile -> 500 on fs.unlinkSync error', async () => {
  const mockDoc = {
    _id: '507f1f77bcf86cd799439011',
    fileName: 'test.pdf',
    path: 'uploads/test.pdf',
  };

  const mockFileUpload = {
    findById: async () => mockDoc,
    deleteOne: async () => {},
  };

  const mockFs = {
    existsSync: () => true,
    unlinkSync: () => {
      throw new Error('Filesystem error');
    },
  };

  await withMockedModules(
    {
      [require.resolve('../models/FileUpload')]: mockFileUpload,
      fs: mockFs,
    },
    async () => {
      delete require.cache[require.resolve('./uploads.controller')];
      const uploads = require('./uploads.controller');

      const req = createReq({
        params: { fileId: '507f1f77bcf86cd799439011' },
      });
      const res = createRes();

      await uploads.deleteFile(req, res);
      assert.equal(res.statusCode, 500);
      assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
      assert.equal(res.body.message, 'Dosya silinirken bir hata oluştu.');
    }
  );
});

