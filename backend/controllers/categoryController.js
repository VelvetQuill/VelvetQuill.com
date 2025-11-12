
// backend/controllers/categoryController.js - FIXED
import Category from '../models/Category.js';
import Story from '../models/Story.js';

const categoryController = {
    async getCategories(req, res) {
        try {
            const categories = await Category.getActiveCategories();
            res.json({
                success: true,
                categories
            });
        } catch (error) {
            console.error('Get categories error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch categories'
            });
        }
    },

    async getCategory(req, res) {
        try {
            const category = await Category.findOne({ 
                slug: req.params.slug,
                isActive: true 
            });

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            await category.updateStatistics();
            res.json({
                success: true,
                category
            });
        } catch (error) {
            console.error('Get category error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch category'
            });
        }
    },

    async createCategory(req, res) {
        try {
            const categoryData = {
                ...req.body,
                createdBy: req.userId
            };

            const category = new Category(categoryData);
            await category.save();

            res.status(201).json({
                success: true,
                category: {
                    id: category._id,
                    name: category.name,
                    slug: category.slug,
                    description: category.description,
                    color: category.color,
                    icon: category.icon
                },
                message: 'Category created successfully'
            });
        } catch (error) {
            console.error('Create category error:', error);
            
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Category name or slug already exists'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to create category'
            });
        }
    },

    async updateCategory(req, res) {
        try {
            const category = await Category.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            res.json({
                success: true,
                category,
                message: 'Category updated successfully'
            });
        } catch (error) {
            console.error('Update category error:', error);
            
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: 'Category name or slug already exists'
                });
            }

            res.status(500).json({
                success: false,
                message: 'Failed to update category'
            });
        }
    },

    async deleteCategory(req, res) {
        try {
            const category = await Category.findById(req.params.id);

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            const storyCount = await Story.countDocuments({ category: category.name });
            if (storyCount > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot delete category with ${storyCount} stories. Move stories to another category first.`
                });
            }

            await Category.findByIdAndDelete(req.params.id);
            res.json({
                success: true,
                message: 'Category deleted successfully'
            });
        } catch (error) {
            console.error('Delete category error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete category'
            });
        }
    },

    async getCategoryStats(req, res) {
        try {
            const category = await Category.findOne({ 
                slug: req.params.slug,
                isActive: true 
            });

            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }

            await category.updateStatistics();
            res.json({
                success: true,
                stats: category.metadata,
                guidelines: category.guidelines
            });
        } catch (error) {
            console.error('Get category stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch category statistics'
            });
        }
    },


async getCategoryStories(req, res) {
    try {
        const { page = 1, limit = 20, status = 'published', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        
        const category = await Category.findOne({ 
            slug: req.params.slug,
            isActive: true 
        }); 

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        // FIX: Use category name (as stored in Story model)
        const filter = { 
            category: category.name,  // This matches how stories store category
            status 
        };

        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const stories = await Story.find(filter)
            .populate('author', 'username displayName profile.avatar')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Story.countDocuments(filter);

        res.json({
            success: true,
            category: {
                name: category.name,
                description: category.description,
                color: category.color,
                icon: category.icon
            },
            stories,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Get category stories error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category stories'
        });
    }
}



};

export default categoryController; 
// ✅ Default export
