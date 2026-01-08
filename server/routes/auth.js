/**
 * Authentication Routes for Clerk
 * https://clerk.com/docs
 * 
 * Note: Most auth is handled by Clerk's frontend components.
 * These routes handle server-side user sync and status checks.
 */

const express = require('express');
const router = express.Router();
const { requireAuth, syncUser } = require('../middleware/auth');

// ============================================
// User Session Routes
// ============================================

/**
 * GET /api/auth/me
 * Returns current authenticated user from our database
 */
router.get('/me', syncUser, async (req, res) => {
    if (!req.auth?.userId) {
        return res.json({ 
            authenticated: false,
            user: null 
        });
    }
    
    try {
        // If user wasn't synced, try to get from database
        if (!req.user) {
            const user = await req.prisma.user.findUnique({
                where: { clerkId: req.auth.userId },
                include: { settings: true }
            });
            req.user = user;
        }
        
        if (req.user) {
            res.json({
                authenticated: true,
                user: {
                    id: req.user.id,
                    clerkId: req.user.clerkId,
                    email: req.user.email,
                    name: req.user.name,
                    picture: req.user.picture,
                    role: req.user.role,
                    settings: req.user.settings
                }
            });
        } else {
            // User authenticated with Clerk but not in our DB yet
            res.json({
                authenticated: true,
                user: null,
                message: 'User not synced yet'
            });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

/**
 * GET /api/auth/status
 * Quick check if user is authenticated
 */
router.get('/status', (req, res) => {
    res.json({ 
        authenticated: !!req.auth?.userId,
        userId: req.auth?.userId || null
    });
});

/**
 * POST /api/auth/sync
 * Force sync user from Clerk to our database
 */
router.post('/sync', requireAuth, syncUser, async (req, res) => {
    if (req.user) {
        res.json({
            success: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name
            }
        });
    } else {
        res.status(400).json({ error: 'Failed to sync user' });
    }
});

/**
 * POST /api/auth/webhook
 * Clerk webhook endpoint for user events
 * Set this URL in your Clerk Dashboard under Webhooks
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    // Note: In production, verify the webhook signature
    // https://clerk.com/docs/webhooks/sync-data
    
    try {
        const event = JSON.parse(req.body.toString());
        
        switch (event.type) {
            case 'user.created':
            case 'user.updated':
                // Sync user data
                const userData = event.data;
                await req.prisma.user.upsert({
                    where: { clerkId: userData.id },
                    update: {
                        email: userData.email_addresses[0]?.email_address,
                        name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || null,
                        picture: userData.image_url
                    },
                    create: {
                        clerkId: userData.id,
                        email: userData.email_addresses[0]?.email_address,
                        name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || null,
                        picture: userData.image_url,
                        settings: {
                            create: {
                                defaultJurisdiction: 'AU-WA',
                                autoSaveEnabled: true,
                                showProgressBar: true
                            }
                        }
                    }
                });
                break;
                
            case 'user.deleted':
                // Optionally handle user deletion
                // await req.prisma.user.delete({ where: { clerkId: event.data.id } });
                break;
        }
        
        res.json({ received: true });
        
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({ error: 'Webhook processing failed' });
    }
});

module.exports = router;
