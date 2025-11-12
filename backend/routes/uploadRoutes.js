

// uploadRoutes.js
import express from 'express';
import uploadController from '../controllers/uploadController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/avatar', authenticate, uploadController.uploadAvatar);
router.delete('/avatar', authenticate, uploadController.removeAvatar);

export default router;

