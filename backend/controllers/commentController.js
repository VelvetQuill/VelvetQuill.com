// commentController.js
import Comment from '../models/Comment.js';
import Story from '../models/Story.js';
import User from '../models/User.js';

const commentController = {
    // @desc    Add comment to story
    // @route   POST /api/comments
    // @access  Private
    async addComment(req, res) {
        try {
            const { content, storyId, parentComment } = req.body;
            const userId = req.userId;

            // Check if story exists
            const story = await Story.findById(storyId);
            if (!story) {
                return res.status(404).json({
                    success: false,
                    message: 'Story not found'
                });
            }

            // Check if parent comment exists (if replying)
            if (parentComment) {
                const parent = await Comment.findById(parentComment);
                if (!parent) {
                    return res.status(404).json({
                        success: false,
                        message: 'Parent comment not found'
                    });
                }
            }

            // Create comment
            const comment = new Comment({
                content,
                author: userId,
                story: storyId,
                parentComment: parentComment || null,
                metadata: {
                    userAgent: req.headers['user-agent'],
                    ipAddress: req.ip
                }
            });

            await comment.save();

            // Increment story comment count
            await Story.findByIdAndUpdate(storyId, {
                $inc: { 'stats.commentCount': 1 }
            });

            // Populate author info for response
            await comment.populate('author', 'username displayName profile.avatar role isAuthor');

            res.status(201).json({
                success: true,
                message: 'Comment added successfully',
                comment: {
                    id: comment._id,
                    content: comment.content,
                    author: {
                        id: comment.author._id,
                        username: comment.author.username,
                        displayName: comment.author.displayName,
                        avatar: comment.author.profile?.avatar,
                        role: comment.author.role,
                        isAuthor: comment.author.isAuthor
                    },
                    story: comment.story,
                    parentComment: comment.parentComment,
                    engagement: {
                        likesCount: comment.engagement.likesCount,
                        repliesCount: comment.engagement.repliesCount
                    },
                    isPinned: comment.isPinned,
                    createdAt: comment.createdAt,
                    timeAgo: comment.timeAgo
                }
            });

        } catch (error) {
            console.error('Add comment error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while adding comment'
            });
        }
    },

    // @desc    Get comments for a story
    // @route   GET /api/comments/story/:storyId
    // @access  Public
    async getStoryComments(req, res) {
        try {
            const { storyId } = req.params;
            const { 
                page = 1, 
                limit = 50, 
                sortBy = 'createdAt', 
                sortOrder = 'desc',
                includeReplies = true 
            } = req.query;

            // Check if story exists
            const story = await Story.findById(storyId);
            if (!story) {
                return res.status(404).json({
                    success: false,
                    message: 'Story not found'
                });
            }

            const comments = await Comment.getStoryComments(storyId, {
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy,
                sortOrder,
                includeReplies: includeReplies === 'true'
            });

            res.json({
                success: true,
                comments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: comments.length === parseInt(limit)
                }
            });

        } catch (error) {
            console.error('Get story comments error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching comments'
            });
        }
    },

    // @desc    Update comment
    // @route   PUT /api/comments/:id
    // @access  Private (Comment author only)
    async updateComment(req, res) {
        try {
            const { id } = req.params;
            const { content } = req.body;
            const userId = req.userId;

            const comment = await Comment.findById(id);
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            // Check if user is the author
            if (comment.author.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this comment'
                });
            }

            // Update comment
            await comment.editComment(content, userId);
            await comment.populate('author', 'username displayName profile.avatar role isAuthor');

            res.json({
                success: true,
                message: 'Comment updated successfully',
                comment: {
                    id: comment._id,
                    content: comment.content,
                    author: {
                        id: comment.author._id,
                        username: comment.author.username,
                        displayName: comment.author.displayName,
                        avatar: comment.author.profile?.avatar,
                        role: comment.author.role,
                        isAuthor: comment.author.isAuthor
                    },
                    engagement: {
                        likesCount: comment.engagement.likesCount,
                        repliesCount: comment.engagement.repliesCount
                    },
                    isPinned: comment.isPinned,
                    createdAt: comment.createdAt,
                    updatedAt: comment.updatedAt,
                    timeAgo: comment.timeAgo,
                    metadata: {
                        isEdited: comment.metadata.isEdited,
                        editedAt: comment.metadata.editedAt
                    }
                }
            });

        } catch (error) {
            console.error('Update comment error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while updating comment'
            });
        }
    },

    // @desc    Delete comment
    // @route   DELETE /api/comments/:id
    // @access  Private (Comment author or admin)
    async deleteComment(req, res) {
        try {
            const { id } = req.params;
            const userId = req.userId;

            const comment = await Comment.findById(id);
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            // Check if user is author or admin
            const user = await User.findById(userId);
            const isAuthor = comment.author.toString() === userId;
            const isAdmin = user.role === 'admin';

            if (!isAuthor && !isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this comment'
                });
            }

            // Delete comment and its replies
            await Comment.findByIdAndDelete(id);

            res.json({
                success: true,
                message: 'Comment deleted successfully'
            });

        } catch (error) {
            console.error('Delete comment error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while deleting comment'
            });
        }
    },

    // @desc    Like/unlike a comment
    // @route   POST /api/comments/:id/like
    // @access  Private
    async likeComment(req, res) {
        try {
            const { id } = req.params;
            const userId = req.userId;

            const comment = await Comment.findById(id);
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            await comment.likeComment(userId);

            res.json({
                success: true,
                message: 'Comment like updated successfully',
                likesCount: comment.engagement.likesCount
            });

        } catch (error) {
            console.error('Like comment error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while updating like'
            });
        }
    },

    // @desc    Reply to a comment
    // @route   POST /api/comments/:commentId/reply
    // @access  Private
    async replyToComment(req, res) {
        try {
            const { commentId } = req.params;
            const { content } = req.body;
            const userId = req.userId;

            // Check if parent comment exists
            const parentComment = await Comment.findById(commentId);
            if (!parentComment) {
                return res.status(404).json({
                    success: false,
                    message: 'Parent comment not found'
                });
            }

            // Create reply
            const reply = new Comment({
                content,
                author: userId,
                story: parentComment.story,
                parentComment: commentId,
                metadata: {
                    userAgent: req.headers['user-agent'],
                    ipAddress: req.ip
                }
            });

            await reply.save();

            // Populate author info for response
            await reply.populate('author', 'username displayName profile.avatar role isAuthor');

            res.status(201).json({
                success: true,
                message: 'Reply added successfully',
                reply: {
                    id: reply._id,
                    content: reply.content,
                    author: {
                        id: reply.author._id,
                        username: reply.author.username,
                        displayName: reply.author.displayName,
                        avatar: reply.author.profile?.avatar,
                        role: reply.author.role,
                        isAuthor: reply.author.isAuthor
                    },
                    engagement: {
                        likesCount: reply.engagement.likesCount,
                        repliesCount: reply.engagement.repliesCount
                    },
                    createdAt: reply.createdAt,
                    timeAgo: reply.timeAgo
                }
            });

        } catch (error) {
            console.error('Reply to comment error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while adding reply'
            });
        }
    },

    // @desc    Get replies for a comment
    // @route   GET /api/comments/:commentId/replies
    // @access  Public
    async getCommentReplies(req, res) {
        try {
            const { commentId } = req.params;
            const { page = 1, limit = 50 } = req.query;

            const comment = await Comment.findById(commentId);
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            const replies = await Comment.find({
                parentComment: commentId,
                status: 'active'
            })
            .populate('author', 'username displayName profile.avatar role isAuthor')
            .sort({ createdAt: 1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

            res.json({
                success: true,
                replies,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: await Comment.countDocuments({ parentComment: commentId, status: 'active' })
                }
            });

        } catch (error) {
            console.error('Get comment replies error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while fetching replies'
            });
        }
    },

    // @desc    Report a comment
    // @route   POST /api/comments/:id/report
    // @access  Private
    async reportComment(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const userId = req.userId;

            const comment = await Comment.findById(id);
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            await comment.reportComment(userId, reason);

            res.json({
                success: true,
                message: 'Comment reported successfully'
            });

        } catch (error) {
            console.error('Report comment error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while reporting comment'
            });
        }
    },

    // @desc    Pin/unpin a comment (author only)
    // @route   POST /api/comments/:id/pin
    // @access  Private (Story author only)
    async pinComment(req, res) {
        try {
            const { id } = req.params;
            const userId = req.userId;

            const comment = await Comment.findById(id);
            if (!comment) {
                return res.status(404).json({
                    success: false,
                    message: 'Comment not found'
                });
            }

            // Check if user is the story author
            const story = await Story.findById(comment.story);
            if (story.author.toString() !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'Only story author can pin comments'
                });
            }

            await comment.pinComment();

            res.json({
                success: true,
                message: `Comment ${comment.isPinned ? 'pinned' : 'unpinned'} successfully`,
                isPinned: comment.isPinned
            });

        } catch (error) {
            console.error('Pin comment error:', error);
            res.status(500).json({
                success: false,
                message: 'Server error while pinning comment'
            });
        }
    },
    
async unpinComment(req, res) {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const comment = await Comment.findById(id);
        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        // Check if user is the story author or admin
        const story = await Story.findById(comment.story);
        const user = await User.findById(userId);

        if (story.author.toString() !== userId.toString() && user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only story author or admin can unpin comments'
            });
        }

        await comment.unpinComment(userId);

        res.json({
            success: true,
            message: 'Comment unpinned successfully',
            isPinned: comment.isPinned
        });

    } catch (error) {
        console.error('Unpin comment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while unpinning comment'
        });
    }
}
    
    
    
};

export default commentController;



