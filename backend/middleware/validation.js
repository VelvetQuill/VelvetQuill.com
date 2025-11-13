// backend/middleware/validation.js
import { body, validationResult, param, query } from 'express-validator';
import User from '../models/User.js';

// Utility function to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
        return next();
    }

    const validationErrors = errors.array().map(error => ({
        field: error.param,
        message: error.msg
    }));

    // Log validation errors for debugging
    console.log('Validation errors found:');
    validationErrors.forEach(({ field, message }) => {
        console.log(`- ${field}: ${message}`);
    });

    return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
    });
};


// Auth validation
export const validateSignup = [
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username can only contain letters, numbers, underscores, and hyphens')
        .custom(async (username) => {
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                throw new Error('Username already exists');
            }
            return true;
        }),

    body('email')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail()
        .custom(async (email) => {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                throw new Error('Email already exists');
            }
            return true;
        }),

    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

    body('displayName')
        .isLength({ min: 2, max: 50 })
        .withMessage('Display name must be between 2 and 50 characters')
        .trim(),

    body('dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid date of birth')
        .custom((date) => {
            const birthDate = new Date(date);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            if (age < 18) {
                throw new Error('You must be at least 18 years old to join');
            }
            return true;
        }),

    handleValidationErrors
];

export const validateSignin = [
    body('identifier')
        .notEmpty()
        .withMessage('Email or username is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    handleValidationErrors
];

// Story validation
// STORY VALIDATION - UPDATE for multi-page support
export const validateStory = [
    body('title')
        .isLength({ min: 5, max: 200 })
        .withMessage('Title must be between 5 and 200 characters')
        .trim(),

    // REMOVE single content validation since we're using pages array now
    // body('content')
    //     .isLength({ min: 100 })
    //     .withMessage('Story content must be at least 100 characters')
    //     .trim(),

    // ADD pages array validation
    body('pages')
        .isArray({ min: 1 })
        .withMessage('At least one page is required')
        .custom((pages) => {
            if (!Array.isArray(pages)) {
                throw new Error('Pages must be an array'); 
            }
            
            // Validate each page has content
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                const charCount = page.content.split('').length;
                const wordCount = page.content.split(' ').length;
                if (!page.content || wordCount < 1000) {
                    throw new Error(`Page ${i + 1} must have at least 1000+ words; CURRENT COUNT: ${wordCount}`);
                }
                if (charCount > 25000) {
                    throw new Error(`Page ${i + 1} cannot exceed 25000 characters; CURRENT COUNT: ${charCount}`);
                }
            }
            return true;
        }),

    body('excerpt')
        .optional()
        .isLength({ max: 300 })
        .withMessage('Excerpt cannot exceed 300 characters')
        .trim(),

    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array')
        .custom((tags) => {
            if (tags && tags.length > 10) {
                throw new Error('Cannot have more than 10 tags');
            }
            return true;
        }),

    body('contentRating')
        .optional()
        .isIn(['G', 'PG', 'PG-13', 'R'])
        .withMessage('Please select a valid content rating'),

    body('contentWarnings')
        .optional()
        .isArray()
        .withMessage('Content warnings must be an array'),

    handleValidationErrors
];

// Comment validation
export const validateComment = [
    body('content')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comment must be between 1 and 1000 characters')
        .trim(),

    body('storyId')
        .isMongoId()
        .withMessage('Invalid story ID'),

    body('parentComment')
        .optional()
        .isMongoId()
        .withMessage('Invalid parent comment ID'),

    handleValidationErrors
];

export const validateCommentUpdate = [
    body('content')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comment must be between 1 and 1000 characters')
        .trim(),

    handleValidationErrors
];


// Reaction validation
export const validateReaction = [
    body('reaction')
        .isIn(['like', 'love', 'wow', 'sad'])
        .withMessage('Please select a valid reaction'),

    handleValidationErrors
];

//
// Author application validation
// AUTHOR APPLICATION - UPDATE for new schema
export const validateAuthorApplication = [
    body('bio')
        .isLength({ min: 20, max: 500 })
        .withMessage('Bio must be between 20 and 500 characters')
        .trim(),

    handleValidationErrors
];

// STORY RATING VALIDATION - NEW (if not exists)
export const validateRating = [
    body('rating')
        .isFloat({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),

    handleValidationErrors
];

// QUERY PARAM VALIDATION - NEW
export const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    
    query('sortBy')
        .optional()
        .isIn(['createdAt', 'updatedAt', 'title', 'views', 'likesCount', 'engagement'])
        .withMessage('Invalid sort field'),
    
    query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc'),

    handleValidationErrors
];

// SEARCH VALIDATION - NEW
export const validateSearch = [
    query('q')
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters')
        .trim(),

    query('category')
        .optional()
        .isIn(['contemporary', 'historical', 'fantasy', 'lgbtq', 'erotic', 'first-love', 'second-chance', 'forbidden', 'sweet'])
        .withMessage('Invalid category'),

    handleValidationErrors
];


// Profile update validation
export const validateProfileUpdate = [
    body('displayName')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Display name must be between 2 and 50 characters')
        .trim(),

    body('bio')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters')
        .trim(),

    body('website')
        .optional()
        .isURL()
        .withMessage('Please provide a valid website URL'),

    body('avatar')
        .optional()
        .isURL()
        .withMessage('Please provide a valid avatar URL'),

    handleValidationErrors
];

// Category validation
export const validateCategory = [
    body('name')
        .isLength({ min: 3, max: 50 })
        .withMessage('Category name must be between 3 and 50 characters')
        .trim(),

    body('description')
        .isLength({ min: 10, max: 500 })
        .withMessage('Description must be between 10 and 500 characters')
        .trim(),

    body('color')
        .optional()
        .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .withMessage('Color must be a valid hex color code'),

    body('icon')
        .optional()
        .isLength({ max: 50 })
        .withMessage('Icon name cannot exceed 50 characters'),

    handleValidationErrors
];

// Contest validation
export const validateContest = [
    body('name')
        .isLength({ min: 5, max: 100 })
        .withMessage('Contest name must be between 5 and 100 characters')
        .trim(),

    body('description')
        .isLength({ min: 20, max: 1000 })
        .withMessage('Description must be between 20 and 1000 characters')
        .trim(),

    body('theme')
        .isLength({ min: 3, max: 50 })
        .withMessage('Theme must be between 3 and 50 characters')
        .trim(),

    body('startDate')
        .isISO8601()
        .withMessage('Please provide a valid start date'),

    body('endDate')
        .isISO8601()
        .withMessage('Please provide a valid end date')
        .custom((endDate, { req }) => {
            if (new Date(endDate) <= new Date(req.body.startDate)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),

    body('objectives')
        .isArray({ min: 1 })
        .withMessage('At least one objective is required'),

    body('objectives.*.description')
        .isLength({ min: 10, max: 200 })
        .withMessage('Each objective must be between 10 and 200 characters'),

    body('prizes')
        .isArray({ min: 1 })
        .withMessage('At least one prize is required'),

    handleValidationErrors
];

export const validateContestSubmission = [
    body('storyId')
        .isMongoId()
        .withMessage('Invalid story ID'),

    handleValidationErrors
];

// Announcement validation
export const validateAnnouncement = [
    body('title')
        .isLength({ min: 5, max: 200 })
        .withMessage('Title must be between 5 and 200 characters')
        .trim(),

    body('content')
        .isLength({ min: 10, max: 2000 })
        .withMessage('Content must be between 10 and 2000 characters')
        .trim(),

    body('type')
        .isIn(['general', 'contest', 'maintenance', 'feature', 'urgent'])
        .withMessage('Please select a valid announcement type'),

    body('expiry')
        .optional()
        .isISO8601()
        .withMessage('Please provide a valid expiry date'),

    handleValidationErrors
];

// Parameter validation
export const validateObjectId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid ID format'),

    handleValidationErrors
];

export const validateUsername = [
    param('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Invalid username format')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),

    handleValidationErrors
];


// PAGE VALIDATION - NEW
export const validatePage = [
    body('content')
        .isLength({ min: 1000, max: 10000 })
        .withMessage('Page content must be between 1000 and 10000 characters')
        .trim(),

    body('pageNumber')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page number must be a positive integer'),

    handleValidationErrors
];

export const validatePageNumber = [
    param('pageNumber')
        .isInt({ min: 1 })
        .withMessage('Page number must be a positive integer'),

    handleValidationErrors
];

// READING PROGRESS VALIDATION - NEW
export const validateReadingProgress = [
    body('currentPage')
        .isInt({ min: 1 })
        .withMessage('Current page must be a positive integer'),

    body('timeSpent')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Time spent must be a non-negative integer'),

    handleValidationErrors
];


export const validateFollow = [
    param('userId')
        .isMongoId()
        .withMessage('Invalid user ID'),

    handleValidationErrors
];

export const validateUserInteraction = [
    param('userId')
        .isMongoId()
        .withMessage('Invalid user ID'),

    handleValidationErrors
];

// BULK INTERACTIONS VALIDATION - NEW
export const validateBulkInteractions = [
    query('storyIds')
        .notEmpty()
        .withMessage('Story IDs are required')
        .custom((storyIds) => {
            const ids = Array.isArray(storyIds) ? storyIds : storyIds.split(',');
            if (ids.length > 50) {
                throw new Error('Cannot request more than 50 stories at once');
            }
            
            // Validate each ID is a valid MongoDB ObjectId
            const objectIdRegex = /^[0-9a-fA-F]{24}$/;
            for (const id of ids) {
                if (!objectIdRegex.test(id)) {
                    throw new Error(`Invalid story ID: ${id}`);
                }
            }
            return true;
        }),

    handleValidationErrors
];

// AVATAR UPDATE VALIDATION - NEW
export const validateAvatar = [
    body('avatar')
        .isURL()
        .withMessage('Please provide a valid avatar URL')
        .matches(/\.(jpg|jpeg|png|webp|gif)$/i)
        .withMessage('Avatar must be a valid image URL (jpg, png, webp, gif)'),

    handleValidationErrors
];



