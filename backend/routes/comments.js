// backend/routes/comments.js - UPDATED
import express from 'express';
import commentController from '../controllers/commentController.js';
import { authenticate } from '../middleware/auth.js';
import { validateComment, validateCommentUpdate } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.get('/story/:storyId', commentController.getStoryComments);
router.get('/:commentId/replies', commentController.getCommentReplies);

// Protected routes
router.use(authenticate);

router.post('/', validateComment, commentController.addComment);
router.post('/:commentId/reply', validateComment, commentController.replyToComment);
router.put('/:id', validateCommentUpdate, commentController.updateComment);
router.delete('/:id', commentController.deleteComment);
router.post('/:id/like', commentController.likeComment);
router.post('/:id/report', commentController.reportComment);

router.post('/:id/pin', commentController.pinComment);
router.post('/:id/unpin', commentController.unpinComment); 

export default router;


