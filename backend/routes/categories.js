
// backend/routes/categories.js
import express from 'express';
import categoryController from '../controllers/categoryController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validateCategory } from '../middleware/validation.js';

const router = express.Router();

// Public routes
// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
router.get('/', categoryController.getCategories);

// @desc    Get category by slug 
// @route   GET /api/categories/:slug
// @access  Public
router.get('/:slug', categoryController.getCategory);

// @desc    Get stories for a category
// @route   GET /api/categories/:slug/stories
// @access  Public
router.get('/:slug/stories', categoryController.getCategoryStories);

// @desc    Get category statistics
// @route   GET /api/categories/:slug/stats
// @access  Public
router.get('/:slug/stats', categoryController.getCategoryStats);

// Admin routes
router.use(authenticate, requireAdmin);

// @desc    Create new category
// @route   POST /api/categories
// @access  Private (Admin only)
router.post('/', validateCategory, categoryController.createCategory);

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private (Admin only)
router.put('/:id', validateCategory, categoryController.updateCategory);

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private (Admin only)
router.delete('/:id', categoryController.deleteCategory);


export default router;
