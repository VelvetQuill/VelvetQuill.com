

// uploadController.js
import User from '../models/User.js';

const uploadController = {
    // @desc    Upload avatar as base64
    // @route   POST /api/upload/avatar
    // @access  Private
    async uploadAvatar(req, res) {
        try {
            const { imageBase64 } = req.body;

            if (!imageBase64) {
                return res.status(400).json({
                    success: false,
                    message: 'No image data provided'
                });
            }

            // Validate base64 string format
            if (!imageBase64.startsWith('data:image/')) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid image format. Must be base64 image data'
                });
            }

            // Extract mime type from base64 string
            const matches = imageBase64.match(/^data:(image\/\w+);base64,/);
            if (!matches) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid base64 image format'
                });
            }

            const avatarType = matches[1]; // e.g., 'image/jpeg', 'image/png'

            // Validate image type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!allowedTypes.includes(avatarType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid image type. Only JPEG, PNG, and GIF are allowed'
                });
            }

            // Check base64 data size (roughly 2MB limit)
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            if (buffer.length > 2 * 1024 * 1024) {
                return res.status(400).json({
                    success: false,
                    message: 'Image size must be less than 2MB'
                });
            }

            // Update user with avatar data
            const user = await User.findByIdAndUpdate(
                req.userId,
                { 
                    'profile.avatar': imageBase64,
                    'profile.avatarType': avatarType
                },
                { new: true }
            ).select('-password');

            res.json({
                success: true,
                message: 'Avatar uploaded successfully',
                user: {
                    id: user._id,
                    username: user.username,
                    displayName: user.displayName,
                    profile: user.profile
                }
            });

        } catch (error) {
            console.error('Upload avatar error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to upload avatar'
            });
        }
    },

    // @desc    Remove avatar
    // @route   DELETE /api/upload/avatar
    // @access  Private
    async removeAvatar(req, res) {
        try {
            const user = await User.findByIdAndUpdate(
                req.userId,
                { 
                    'profile.avatar': null,
                    'profile.avatarType': null
                },
                { new: true }
            ).select('-password');

            res.json({
                success: true,
                message: 'Avatar removed successfully',
                user: {
                    id: user._id,
                    username: user.username,
                    displayName: user.displayName,
                    profile: user.profile
                }
            });

        } catch (error) {
            console.error('Remove avatar error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove avatar'
            });
        }
    }
};

export default uploadController;


