import { Router } from 'express';
import multer from 'multer';
import { storagePut } from './storage';

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept Excel files only
    if (
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  },
});

// Helper to generate random suffix for file keys
function randomSuffix() {
  return Math.random().toString(36).substring(2, 15);
}

export function createUploadRouter() {
  const router = Router();

  router.post('/upload', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Upload to S3
      const fileKey = `uploads/excel-${randomSuffix()}.xlsx`;
      const result = await storagePut(
        fileKey,
        req.file.buffer,
        req.file.mimetype
      );

      res.json({
        success: true,
        url: result.url,
        key: result.key,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({
        error: 'Failed to upload file',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  return router;
}
