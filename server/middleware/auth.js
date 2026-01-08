/**
 * Authentication Middleware for Clerk
 * https://clerk.com/docs
 */

const { clerkClient } = require('@clerk/express');

/**
 * Require authentication - returns 401 if not logged in
 */
function requireAuth(req, res, next) {
    // Check if Clerk auth is present
    if (!req.auth?.userId) {
        return res.status(401).json({ 
            error: 'Authentication required',
            message: 'Please sign in to access this resource'
        });
    }
    next();
}

/**
 * Get or create user in our database from Clerk
 * Syncs Clerk user data with our local database
 */
async function syncUser(req, res, next) {
    if (!req.auth?.userId) {
        return next();
    }
    
    try {
        // Check if user exists in our database
        let user = await req.prisma.user.findUnique({
            where: { clerkId: req.auth.userId },
            include: { settings: true }
        });
        
        if (!user) {
            // Get user details from Clerk
            const clerkUser = await clerkClient.users.getUser(req.auth.userId);
            
            // Create user in our database
            user = await req.prisma.user.create({
                data: {
                    clerkId: req.auth.userId,
                    email: clerkUser.emailAddresses[0]?.emailAddress,
                    name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || null,
                    picture: clerkUser.imageUrl,
                    lastLoginAt: new Date(),
                    settings: {
                        create: {
                            defaultJurisdiction: 'AU-WA',
                            autoSaveEnabled: true,
                            showProgressBar: true
                        }
                    }
                },
                include: { settings: true }
            });
            
            console.log(`✅ New user synced from Clerk: ${user.email}`);
        } else {
            // Update last login
            user = await req.prisma.user.update({
                where: { id: user.id },
                data: { lastLoginAt: new Date() },
                include: { settings: true }
            });
        }
        
        // Attach user to request
        req.user = user;
        next();
        
    } catch (error) {
        console.error('Error syncing user:', error);
        // Continue without user sync - auth still works
        next();
    }
}

/**
 * Require specific role(s)
 * @param {...string} roles - Allowed roles (e.g., 'ADMIN', 'SUPERVISOR')
 */
function requireRole(...roles) {
    return async (req, res, next) => {
        if (!req.auth?.userId) {
            return res.status(401).json({ 
                error: 'Authentication required' 
            });
        }
        
        // Ensure user is synced
        if (!req.user) {
            await syncUser(req, res, () => {});
        }
        
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Access denied',
                message: `Required role: ${roles.join(' or ')}`
            });
        }
        
        next();
    };
}

/**
 * Optional authentication - continues even if not logged in
 */
function optionalAuth(req, res, next) {
    next();
}

/**
 * Require ownership of resource or admin role
 */
function requireOwnership(req, res, next) {
    if (!req.auth?.userId) {
        return res.status(401).json({ 
            error: 'Authentication required' 
        });
    }
    
    // Admins can access anything
    if (req.user?.role === 'ADMIN') {
        return next();
    }
    
    // Check ownership
    if (req.resourceOwnerId && req.user && req.resourceOwnerId !== req.user.id) {
        return res.status(403).json({ 
            error: 'Access denied',
            message: 'You do not have permission to access this resource'
        });
    }
    
    next();
}

module.exports = {
    requireAuth,
    syncUser,
    requireRole,
    optionalAuth,
    requireOwnership
};
