/**
 * IWC Approval Portal - Main Server Entry Point
 * Express.js with PostgreSQL (Prisma) and Clerk Authentication
 */

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { clerkMiddleware } = require('@clerk/express');

const { PrismaClient } = require('@prisma/client');

// Import routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const crewRoutes = require('./routes/crew');
const vesselRoutes = require('./routes/vessels');
const userRoutes = require('./routes/users');
const externalApiRoutes = require('./routes/externalApis');

// Import services
const aisStreamService = require('./services/aisstream');
const vesselCache = require('./services/vesselCache');

// Initialize Prisma
const prisma = new PrismaClient();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// ============================================
// Middleware Configuration
// ============================================

// Security headers (configured for Clerk)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'", "'unsafe-inline'", "'unsafe-eval'",
                "https://*.clerk.accounts.dev", 
                "https://clerk.io",
                "https://cdn.jsdelivr.net"
            ],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://*.clerk.accounts.dev"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: [
                "'self'", 
                "https://api.marinesia.com", 
                "wss://stream.aisstream.io", 
                "https://*.clerk.accounts.dev",
                "https://clerk.io",
                "https://api.clerk.io"
            ],
            frameSrc: ["https://*.clerk.accounts.dev", "https://clerk.io"],
            workerSrc: ["'self'", "blob:"]
        }
    }
}));

// CORS configuration
app.use(cors({
    origin: isProduction 
        ? process.env.CLIENT_URL 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

// Request logging
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session configuration (for non-auth session data)
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production-min-32-chars',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: isProduction ? 'none' : 'lax'
    },
    name: 'iwc.sid'
};

// Add PostgreSQL session store in production
if (isProduction && process.env.DATABASE_URL) {
    const PgSession = require('connect-pg-simple')(session);
    sessionConfig.store = new PgSession({
        conString: process.env.DATABASE_URL,
        tableName: 'session',
        createTableIfMissing: true
    });
}

app.use(session(sessionConfig));

// Clerk Authentication Middleware
// This adds req.auth to all requests
if (process.env.CLERK_SECRET_KEY) {
    app.use(clerkMiddleware());
    console.log('✅ Clerk authentication enabled');
} else {
    console.warn('⚠️  CLERK_SECRET_KEY not set - authentication disabled');
    // Add mock auth for development without Clerk
    app.use((req, res, next) => {
        req.auth = null;
        next();
    });
}

// Make prisma available to routes
app.use((req, res, next) => {
    req.prisma = prisma;
    next();
});

// ============================================
// API Routes
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/crew', crewRoutes);
app.use('/api/vessels', vesselRoutes);
app.use('/api/users', userRoutes);

// External API routes (Marinesia, AISStream)
app.use('/api', externalApiRoutes);

// ============================================
// Config Endpoint (provides frontend config)
// ============================================

app.get('/api/config', (req, res) => {
    res.json({
        clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
        environment: process.env.NODE_ENV || 'development'
    });
});

// ============================================
// Health Check Endpoints
// ============================================

// Main health check (with services status - used by VesselApiService)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        environment: process.env.NODE_ENV || 'development',
        services: {
            marinesia: process.env.MARINESIA_API_KEY ? 'available' : 'not_configured',
            aisstream: vesselCache.connectionStatus
        },
        stats: vesselCache.getStats()
    });
});

// API health check (with auth info)
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        auth: req.auth ? { userId: req.auth.userId } : null,
        services: {
            marinesia: process.env.MARINESIA_API_KEY ? 'available' : 'not_configured',
            aisstream: vesselCache.connectionStatus
        }
    });
});

// ============================================
// Static Files (Frontend)
// ============================================

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// SPA fallback - serve index.html for any unmatched routes
app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ============================================
// Error Handling
// ============================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // Clerk errors
    if (err.clerkError) {
        return res.status(401).json({ 
            error: 'Authentication error',
            message: err.message
        });
    }
    
    // Prisma errors
    if (err.code?.startsWith('P')) {
        return res.status(400).json({ 
            error: 'Database error', 
            code: err.code,
            message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
        });
    }
    
    // Default error response
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================
// Server Startup
// ============================================

async function startServer() {
    let dbConnected = false;
    
    // Try to connect to database
    if (process.env.DATABASE_URL) {
        try {
            await prisma.$connect();
            dbConnected = true;
            console.log('✅ Database connected');
        } catch (error) {
            console.warn('⚠️  Database connection failed:', error.message);
            console.warn('   Running in limited mode (no data persistence)');
        }
    } else {
        console.warn('⚠️  DATABASE_URL not set - running without database');
    }
    
    // Start server
    app.listen(PORT, () => {
        const marinesiaStatus = process.env.MARINESIA_API_KEY ? 'Configured ✓' : 'Not configured ⚠';
        const aisStreamStatus = process.env.AISSTREAM_API_KEY ? 'Configured ✓' : 'Not configured ⚠';
        
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 IWC Approval Portal Server                          ║
║                                                           ║
║   Local:    http://localhost:${PORT}                       ║
║   Mode:     ${(process.env.NODE_ENV || 'development').padEnd(22)}║
║   Database: ${dbConnected ? 'Connected ✓'.padEnd(22) : 'Not connected ⚠'.padEnd(22)}║
║   Auth:     ${process.env.CLERK_SECRET_KEY ? 'Clerk ✓'.padEnd(22) : 'Not configured ⚠'.padEnd(22)}║
║   Marinesia:${marinesiaStatus.padEnd(22)}║
║   AISStream:${aisStreamStatus.padEnd(22)}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
        
        if (!dbConnected) {
            console.log('💡 To connect database, set DATABASE_URL in .env');
        }
        if (!process.env.CLERK_SECRET_KEY) {
            console.log('💡 To enable Clerk auth, set CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY in .env');
        }
        if (!process.env.MARINESIA_API_KEY) {
            console.log('💡 To enable Marinesia API, set MARINESIA_API_KEY in .env');
        }
        if (!process.env.AISSTREAM_API_KEY) {
            console.log('💡 To enable AISStream, set AISSTREAM_API_KEY in .env');
        }
        
        // Start AISStream connection after server is ready
        setTimeout(() => {
            aisStreamService.connect();
        }, 2000);
    });
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    aisStreamService.disconnect();
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    aisStreamService.disconnect();
    await prisma.$disconnect();
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;
