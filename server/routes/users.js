/**
 * Users API Routes
 * User profile and settings management
 */

const express = require('express');
const router = express.Router();
const { requireAuth, syncUser, requireRole } = require('../middleware/auth');

// All routes require authentication and user sync
router.use(requireAuth);
router.use(syncUser);

// ============================================
// User Profile
// ============================================

/**
 * GET /api/users/profile
 * Get current user's profile
 */
router.get('/profile', async (req, res, next) => {
    try {
        const user = await req.prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                settings: true,
                _count: {
                    select: {
                        jobs: true,
                        crewMembers: true,
                        vessels: true
                    }
                }
            }
        });
        
        res.json(user);
        
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/users/profile
 * Update current user's profile
 */
router.put('/profile', async (req, res, next) => {
    try {
        const { name } = req.body;
        
        const user = await req.prisma.user.update({
            where: { id: req.user.id },
            data: { name }
        });
        
        res.json(user);
        
    } catch (error) {
        next(error);
    }
});

// ============================================
// User Settings
// ============================================

/**
 * GET /api/users/settings
 * Get current user's settings
 */
router.get('/settings', async (req, res, next) => {
    try {
        let settings = await req.prisma.userSettings.findUnique({
            where: { userId: req.user.id }
        });
        
        // Create default settings if not exist
        if (!settings) {
            settings = await req.prisma.userSettings.create({
                data: {
                    userId: req.user.id,
                    defaultJurisdiction: 'AU-WA',
                    autoSaveEnabled: true,
                    showProgressBar: true
                }
            });
        }
        
        res.json(settings);
        
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/users/settings
 * Update current user's settings
 */
router.put('/settings', async (req, res, next) => {
    try {
        const {
            defaultJurisdiction,
            marinesia_api_key,
            aisstream_api_key,
            autoSaveEnabled,
            autoSaveInterval,
            showProgressBar,
            companyName,
            companyLogo,
            companyPhone,
            companyEmail
        } = req.body;
        
        const settings = await req.prisma.userSettings.upsert({
            where: { userId: req.user.id },
            update: {
                defaultJurisdiction,
                marinesia_api_key,
                aisstream_api_key,
                autoSaveEnabled,
                autoSaveInterval,
                showProgressBar,
                companyName,
                companyLogo,
                companyPhone,
                companyEmail
            },
            create: {
                userId: req.user.id,
                defaultJurisdiction: defaultJurisdiction || 'AU-WA',
                marinesia_api_key,
                aisstream_api_key,
                autoSaveEnabled: autoSaveEnabled !== false,
                autoSaveInterval: autoSaveInterval || 30,
                showProgressBar: showProgressBar !== false,
                companyName,
                companyLogo,
                companyPhone,
                companyEmail
            }
        });
        
        res.json(settings);
        
    } catch (error) {
        next(error);
    }
});

// ============================================
// Dashboard Stats
// ============================================

/**
 * GET /api/users/dashboard
 * Get dashboard statistics for current user
 */
router.get('/dashboard', async (req, res, next) => {
    try {
        const userId = req.user.id;
        
        // Get job counts by status
        const jobStats = await req.prisma.job.groupBy({
            by: ['status'],
            where: { userId },
            _count: true
        });
        
        // Get recent jobs
        const recentJobs = await req.prisma.job.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            take: 5,
            include: {
                vessel: {
                    select: { vesselName: true }
                }
            }
        });
        
        // Get crew count
        const crewCount = await req.prisma.crewMember.count({
            where: { userId, isActive: true }
        });
        
        // Get expiring certifications count
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        
        const expiringCerts = await req.prisma.crewMember.count({
            where: {
                userId,
                isActive: true,
                OR: [
                    { adasCertExpiry: { lte: thirtyDaysFromNow } },
                    { diveMedicalExpiry: { lte: thirtyDaysFromNow } },
                    { firstAidExpiry: { lte: thirtyDaysFromNow } }
                ]
            }
        });
        
        // Format job stats
        const statusCounts = {
            DRAFT: 0,
            PENDING_APPROVAL: 0,
            APPROVED: 0,
            IN_PROGRESS: 0,
            COMPLETED: 0,
            CANCELLED: 0
        };
        
        jobStats.forEach(stat => {
            statusCounts[stat.status] = stat._count;
        });
        
        res.json({
            jobs: statusCounts,
            totalJobs: Object.values(statusCounts).reduce((a, b) => a + b, 0),
            activeJobs: statusCounts.APPROVED + statusCounts.IN_PROGRESS,
            recentJobs,
            crewCount,
            expiringCerts
        });
        
    } catch (error) {
        next(error);
    }
});

// ============================================
// Admin Routes
// ============================================

/**
 * GET /api/users
 * List all users (admin only)
 */
router.get('/', requireRole('ADMIN'), async (req, res, next) => {
    try {
        const users = await req.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                picture: true,
                role: true,
                createdAt: true,
                lastLoginAt: true,
                _count: {
                    select: { jobs: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        res.json(users);
        
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/users/:id/role
 * Update user role (admin only)
 */
router.put('/:id/role', requireRole('ADMIN'), async (req, res, next) => {
    try {
        const { role } = req.body;
        
        if (!['USER', 'ADMIN', 'SUPERVISOR'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        
        const user = await req.prisma.user.update({
            where: { id: req.params.id },
            data: { role }
        });
        
        res.json(user);
        
    } catch (error) {
        next(error);
    }
});

module.exports = router;

