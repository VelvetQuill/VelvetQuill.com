
// backend/controllers/contestController.js
import Contest from '../models/Contest.js';
import Story from '../models/Story.js';
import User from '../models/User.js';

const contestController = {
    // @desc    Get all contests
    // @route   GET /api/contests
    // @access  Public
    async getContests(req, res) {
        try {
            const { page = 1, limit = 10, status } = req.query;
            const skip = (page - 1) * limit;

            let filter = {};
            if (status) {
                filter.status = status;
            }

            const [contests, total] = await Promise.all([
                Contest.find(filter)
                    .populate('createdBy', 'username displayName profile.avatar')
                    .sort({ createdAt: -1 })
                    .limit(parseInt(limit))
                    .skip(skip),
                Contest.countDocuments(filter)
            ]);

            res.json({
                success: true,
                contests,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            });

        } catch (error) {
            console.error('Get contests error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch contests'
            });
        }
    },

    // @desc    Get single contest
    // @route   GET /api/contests/:id
    // @access  Public
    async getContest(req, res) {
        try {
            const contest = await Contest.findById(req.params.id)
                .populate('createdBy', 'username displayName profile.avatar')
                .populate('participants.user', 'username displayName profile.avatar')
                .populate('winners.user', 'username displayName profile.avatar');

            if (!contest) {
                return res.status(404).json({
                    success: false,
                    message: 'Contest not found'
                });
            }

            res.json({
                success: true,
                contest
            });

        } catch (error) {
            console.error('Get contest error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch contest'
            });
        }
    },

    // @desc    Get contest participants
    // @route   GET /api/contests/:id/participants
    // @access  Public
    async getContestParticipants(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const contest = await Contest.findById(id)
                .populate({
                    path: 'participants.user',
                    select: 'username displayName profile.avatar profile.bio joinedAt'
                })
                .select('participants');

            if (!contest) {
                return res.status(404).json({
                    success: false,
                    message: 'Contest not found'
                });
            }

            // Paginate participants
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const paginatedParticipants = contest.participants.slice(startIndex, endIndex);

            res.json({
                success: true,
                participants: paginatedParticipants,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(contest.participants.length / limit),
                    total: contest.participants.length
                }
            });

        } catch (error) {
            console.error('Get contest participants error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch contest participants'
            });
        }
    },

    // @desc    Get contest submissions
    // @route   GET /api/contests/:id/submissions
    // @access  Public
    async getContestSubmissions(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 20 } = req.query;

            const contest = await Contest.findById(id)
                .populate({
                    path: 'participants.user',
                    select: 'username displayName profile.avatar'
                })
                .populate({
                    path: 'participants.submissions',
                    populate: {
                        path: 'author',
                        select: 'username displayName profile.avatar'
                    }
                });

            if (!contest) {
                return res.status(404).json({
                    success: false,
                    message: 'Contest not found'
                });
            }

            // Extract all submissions from participants
            let allSubmissions = [];
            contest.participants.forEach(participant => {
                if (participant.submissions && participant.submissions.length > 0) {
                    participant.submissions.forEach(story => {
                        allSubmissions.push({
                            story,
                            participant: participant.user,
                            joinedAt: participant.joinedAt
                        });
                    });
                }
            });

            // Paginate submissions
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const paginatedSubmissions = allSubmissions.slice(startIndex, endIndex);

            res.json({
                success: true,
                submissions: paginatedSubmissions,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(allSubmissions.length / limit),
                    total: allSubmissions.length
                }
            });

        } catch (error) {
            console.error('Get contest submissions error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch contest submissions'
            });
        }
    },

    // @desc    Get contest leaderboard
    // @route   GET /api/contests/:id/leaderboard
    // @access  Public
    async getContestLeaderboard(req, res) {
        try {
            const { id } = req.params;
            const { limit = 50 } = req.query;

            const contest = await Contest.findById(id)
                .populate({
                    path: 'participants.user',
                    select: 'username displayName profile.avatar'
                })
                .populate({
                    path: 'participants.submissions',
                    select: 'title views ratings averageRating'
                });

            if (!contest) {
                return res.status(404).json({
                    success: false,
                    message: 'Contest not found'
                });
            }

            // Calculate scores for each participant
            const leaderboard = contest.participants.map(participant => {
                let score = 0;
                let totalViews = 0;
                let totalRating = 0;
                let storyCount = 0;

                if (participant.submissions && participant.submissions.length > 0) {
                    participant.submissions.forEach(story => {
                        totalViews += story.views || 0;
                        totalRating += story.averageRating || 0;
                        storyCount++;
                    });
                }

                // Simple scoring algorithm - adjust as needed
                score = totalViews * 0.1 + (totalRating / Math.max(storyCount, 1)) * 100 + storyCount * 50;

                return {
                    user: participant.user,
                    joinedAt: participant.joinedAt,
                    stats: {
                        storyCount,
                        totalViews,
                        averageRating: storyCount > 0 ? totalRating / storyCount : 0,
                        totalScore: Math.round(score)
                    }
                };
            });

            // Sort by score (descending)
            leaderboard.sort((a, b) => b.stats.totalScore - a.stats.totalScore);

            // Apply limit
            const limitedLeaderboard = leaderboard.slice(0, parseInt(limit));

            res.json({
                success: true,
                leaderboard: limitedLeaderboard,
                contest: {
                    name: contest.name,
                    theme: contest.theme,
                    status: contest.status
                }
            });

        } catch (error) {
            console.error('Get contest leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch contest leaderboard'
            });
        }
    },

    // @desc    Create contest
    // @route   POST /api/contests
    // @access  Private (Admin only)
    async createContest(req, res) {
        try {
            const contestData = {
                ...req.body,
                createdBy: req.userId
            };

            const contest = new Contest(contestData);
            await contest.save();

            res.status(201).json({
                success: true,
                contest: {
                    id: contest._id,
                    name: contest.name,
                    theme: contest.theme,
                    status: contest.status,
                    timeline: contest.timeline
                },
                message: 'Contest created successfully'
            });

        } catch (error) {
            console.error('Create contest error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create contest'
            });
        }
    },

    // @desc    Update contest
    // @route   PUT /api/contests/:id
    // @access  Private (Admin only)
    async updateContest(req, res) {
        try {
            const contest = await Contest.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );

            if (!contest) {
                return res.status(404).json({
                    success: false,
                    message: 'Contest not found'
                });
            }

            res.json({
                success: true,
                contest,
                message: 'Contest updated successfully'
            });

        } catch (error) {
            console.error('Update contest error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update contest'
            });
        }
    },

    // @desc    Delete contest
    // @route   DELETE /api/contests/:id
    // @access  Private (Admin only)
    async deleteContest(req, res) {
        try {
            const contest = await Contest.findById(req.params.id);

            if (!contest) {
                return res.status(404).json({
                    success: false,
                    message: 'Contest not found'
                });
            }

            // Check if contest has participants
            if (contest.participants.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete contest with participants'
                });
            }

            await Contest.findByIdAndDelete(req.params.id);

            res.json({
                success: true,
                message: 'Contest deleted successfully'
            });

        } catch (error) {
            console.error('Delete contest error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete contest'
            });
        }
    },

    // @desc    Join contest
    // @route   POST /api/contests/:id/join
    // @access  Private
    async joinContest(req, res) {
        try {
            const { id } = req.params;
            const userId = req.userId;

            const contest = await Contest.findById(id);
            if (!contest) {
                return res.status(404).json({
                    success: false,
                    message: 'Contest not found'
                });
            }

            // Check if contest is active
            if (contest.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'Contest is not active for participation'
                });
            }

            // Check if user is already a participant
            const isParticipant = contest.participants.some(
                participant => participant.user.toString() === userId
            );

            if (isParticipant) {
                return res.status(400).json({
                    success: false,
                    message: 'Already joined this contest'
                });
            }

            // Add user to participants
            contest.participants.push({
                user: userId,
                joinedAt: new Date(),
                submissions: [],
                progress: {
                    storiesSubmitted: 0,
                    totalWords: 0,
                    totalViews: 0,
                    averageRating: 0
                }
            });

            await contest.save();

            res.json({
                success: true,
                message: 'Successfully joined the contest'
            });

        } catch (error) {
            console.error('Join contest error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to join contest'
            });
        }
    },

    // @desc    Leave contest
    // @route   POST /api/contests/:id/leave
    // @access  Private
    async leaveContest(req, res) {
        try {
            const { id } = req.params;
            const userId = req.userId;

            const contest = await Contest.findById(id);
            if (!contest) {
                return res.status(404).json({
                    success: false,
                    message: 'Contest not found'
                });
            }

            // Check if user is a participant
            const participantIndex = contest.participants.findIndex(
                participant => participant.user.toString() === userId
            );

            if (participantIndex === -1) {
                return res.status(400).json({
                    success: false,
                    message: 'Not participating in this contest'
                });
            }

            // Remove user from participants
            contest.participants.splice(participantIndex, 1);
            await contest.save();

            res.json({
                success: true,
                message: 'Successfully left the contest'
            });

        } catch (error) {
            console.error('Leave contest error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to leave contest'
            });
        }
    },

    // @desc    Submit story to contest
    // @route   POST /api/contests/:id/submit
    // @access  Private
    async submitToContest(req, res) {
        try {
            const { id } = req.params;
            const { storyId } = req.body;
            const userId = req.userId;

            const contest = await Contest.findById(id);
            if (!contest) {
                return res.status(404).json({
                    success: false,
                    message: 'Contest not found'
                });
            }

            // Check if user has joined the contest
            const participant = contest.participants.find(
                p => p.user.toString() === userId
            );

            if (!participant) {
                return res.status(400).json({
                    success: false,
                    message: 'Must join contest before submitting stories'
                });
            }

            // Check if story exists and belongs to user
            const story = await Story.findOne({
                _id: storyId,
                author: userId
            });

            if (!story) {
                return res.status(404).json({
                    success: false,
                    message: 'Story not found or not authorized'
                });
            }

            // Check if story is already submitted to this contest
            const isAlreadySubmitted = participant.submissions.some(
                submissionId => submissionId.toString() === storyId
            );

            if (isAlreadySubmitted) {
                return res.status(400).json({
                    success: false,
                    message: 'Story already submitted to this contest'
                });
            }

            // Add story to participant's submissions
            participant.submissions.push(storyId);
            
            // Update participant progress
            participant.progress.storiesSubmitted = participant.submissions.length;
            
            await contest.save();

            res.json({
                success: true,
                message: 'Story submitted to contest successfully'
            });

        } catch (error) {
            console.error('Submit story error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to submit story to contest'
            });
        }
    },

    // @desc    Remove submission from contest
    // @route   DELETE /api/contests/:id/submit/:storyId
    // @access  Private
    async removeSubmission(req, res) {
        try {
            const { id, storyId } = req.params;
            const userId = req.userId;

            const contest = await Contest.findById(id);
            if (!contest) {
                return res.status(404).json({
                    success: false,
                    message: 'Contest not found'
                });
            }

            // Find participant
            const participant = contest.participants.find(
                p => p.user.toString() === userId
            );

            if (!participant) {
                return res.status(400).json({
                    success: false,
                    message: 'Not participating in this contest'
                });
            }

            // Remove story from submissions
            const submissionIndex = participant.submissions.findIndex(
                submissionId => submissionId.toString() === storyId
            );

            if (submissionIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Story submission not found'
                });
            }

            participant.submissions.splice(submissionIndex, 1);
            participant.progress.storiesSubmitted = participant.submissions.length;
            
            await contest.save();

            res.json({
                success: true,
                message: 'Story removed from contest successfully'
            });

        } catch (error) {
            console.error('Remove submission error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to remove story from contest'
            });
        }
    },

    // @desc    Declare contest winners
    // @route   POST /api/contests/:id/winners
    // @access  Private (Admin only)
    async declareWinners(req, res) {
        try {
            const { id } = req.params;
            const { winners } = req.body;

            const contest = await Contest.findById(id);
            if (!contest) {
                return res.status(404).json({
                    success: false,
                    message: 'Contest not found'
                });
            }

            // Validate winners array
            if (!Array.isArray(winners) || winners.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Winners array is required and cannot be empty'
                });
            }

            // Update winners and contest status
            contest.winners = winners;
            contest.status = 'completed';
            contest.timeline.winnerAnnouncement = new Date();

            await contest.save();

            res.json({
                success: true,
                message: 'Winners declared successfully',
                winners: contest.winners
            });

        } catch (error) {
            console.error('Declare winners error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to declare winners'
            });
        }
    },

    // @desc    Get contest winners
    // @route   GET /api/contests/:id/winners
    // @access  Public
    async getWinners(req, res) {
        try {
            const contest = await Contest.findById(req.params.id)
                .populate('winners.user', 'username displayName profile.avatar')
                .populate('winners.story', 'title excerpt coverImage');

            if (!contest) {
                return res.status(404).json({
                    success: false,
                    message: 'Contest not found'
                });
            }

            res.json({
                success: true,
                winners: contest.winners
            });

        } catch (error) {
            console.error('Get winners error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch contest winners'
            });
        }
    }
};

export default contestController;

