

// routes/authors.js - Author Routes
import express from 'express';
const router = express.Router();

// Get author profile and stories
router.get('/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const currentUserId = req.user?.id;

        const author = await dbService.getAuthorByUsername(username);
        if (!author || !author.is_author) {
            return res.status(404).json({ error: 'Author not found' });
        }

        // Get author's published stories with pagination
        const page = parseInt(req.query.page) || 1;
        const limit = 12;
        const offset = (page - 1) * limit;

        const stories = await dbService.getAuthorStories(author.id, limit, offset);
        const totalStories = await dbService.getAuthorStoryCount(author.id);

        // Check if current user is following this author
        let isFollowing = false;
        if (currentUserId) {
            isFollowing = await dbService.isFollowingUser(currentUserId, author.id);
        }

        // Get author stats
        const authorStats = await dbService.getAuthorStats(author.id);

        res.json({
            author: {
                id: author.id,
                username: author.username,
                display_name: author.display_name,
                author_bio: author.author_bio,
                avatar_url: author.avatar_url,
                author_website: author.author_website,
                author_social_links: author.author_social_links,
                author_joined_at: author.author_joined_at,
                is_following: isFollowing
            },
            stories,
            pagination: {
                current_page: page,
                total_pages: Math.ceil(totalStories / limit),
                total_stories: totalStories,
                has_next: page < Math.ceil(totalStories / limit),
                has_prev: page > 1
            },
            stats: authorStats
        });

    } catch (error) {
        console.error('Get author error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Follow an author
router.post('/:authorId/follow', async (req, res) => {
    try {
        const { authorId } = req.params;
        const userId = req.user.id;

        // Verify target user is an author
        const author = await dbService.getUserById(authorId);
        if (!author || !author.is_author) {
            return res.status(404).json({ error: 'Author not found' });
        }

        // Users cannot follow themselves
        if (parseInt(authorId) === userId) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }

        await dbService.followUser(userId, authorId);

        res.json({
            success: true,
            message: 'Successfully followed author',
            following: true
        });

    } catch (error) {
        console.error('Follow author error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Unfollow an author
router.post('/:authorId/unfollow', async (req, res) => {
    try {
        const { authorId } = req.params;
        const userId = req.user.id;

        await dbService.unfollowUser(userId, authorId);

        res.json({
            success: true,
            message: 'Successfully unfollowed author',
            following: false
        });

    } catch (error) {
        console.error('Unfollow author error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;