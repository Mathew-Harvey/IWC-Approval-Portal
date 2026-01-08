/**
 * Vessels API Routes
 * CRUD operations for vessels and API proxy
 */

const express = require('express');
const router = express.Router();
const { requireAuth, syncUser, optionalAuth } = require('../middleware/auth');

// Apply syncUser to all routes that need user data
const authAndSync = [requireAuth, syncUser];

// ============================================
// List & Search Vessels
// ============================================

/**
 * GET /api/vessels
 * List vessels (user's saved vessels)
 */
router.get('/', requireAuth, async (req, res, next) => {
    try {
        const { search, limit = 50 } = req.query;
        
        const where = {
            OR: [
                { userId: req.user.id },
                { userId: null } // Shared vessels
            ]
        };
        
        if (search) {
            where.AND = {
                OR: [
                    { vesselName: { contains: search, mode: 'insensitive' } },
                    { imoNumber: { contains: search } },
                    { mmsi: { contains: search } }
                ]
            };
        }
        
        const vessels = await req.prisma.vessel.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            take: parseInt(limit)
        });
        
        res.json(vessels);
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/vessels/:id
 * Get single vessel by ID
 */
router.get('/:id', requireAuth, async (req, res, next) => {
    try {
        const vessel = await req.prisma.vessel.findFirst({
            where: {
                id: req.params.id,
                OR: [
                    { userId: req.user.id },
                    { userId: null }
                ]
            },
            include: {
                jobs: {
                    select: {
                        id: true,
                        jobNumber: true,
                        status: true,
                        proposedStartDate: true,
                        cleaningLocation: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });
        
        if (!vessel) {
            return res.status(404).json({ error: 'Vessel not found' });
        }
        
        res.json(vessel);
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/vessels/imo/:imo
 * Get vessel by IMO number
 */
router.get('/imo/:imo', requireAuth, async (req, res, next) => {
    try {
        const vessel = await req.prisma.vessel.findUnique({
            where: { imoNumber: req.params.imo },
            include: {
                jobs: {
                    select: {
                        id: true,
                        jobNumber: true,
                        status: true,
                        proposedStartDate: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });
        
        if (!vessel) {
            return res.status(404).json({ error: 'Vessel not found' });
        }
        
        res.json(vessel);
        
    } catch (error) {
        next(error);
    }
});

// ============================================
// Create & Update Vessels
// ============================================

/**
 * POST /api/vessels
 * Create or update a vessel (upsert by IMO)
 */
router.post('/', requireAuth, async (req, res, next) => {
    try {
        const {
            imoNumber,
            mmsi,
            vesselName,
            vesselType,
            flagState,
            callSign,
            loa,
            beam,
            draft,
            grossTonnage,
            afcType,
            afcManufacturer,
            afcAppliedDate,
            afcExpiryDate,
            lastCleaningDate,
            lastCleaningPort,
            operatingProfile,
            primaryTradeRoute,
            vesselImage,
            gaDrawing,
            apiDataSnapshot
        } = req.body;
        
        if (!vesselName?.trim()) {
            return res.status(400).json({ error: 'Vessel name is required' });
        }
        
        const data = {
            userId: req.user.id,
            vesselName: vesselName.trim(),
            imoNumber: imoNumber?.trim() || null,
            mmsi: mmsi?.trim() || null,
            vesselType: vesselType?.trim() || null,
            flagState: flagState?.trim() || null,
            callSign: callSign?.trim() || null,
            loa: loa ? parseFloat(loa) : null,
            beam: beam ? parseFloat(beam) : null,
            draft: draft ? parseFloat(draft) : null,
            grossTonnage: grossTonnage ? parseFloat(grossTonnage) : null,
            afcType: afcType?.trim() || null,
            afcManufacturer: afcManufacturer?.trim() || null,
            afcAppliedDate: afcAppliedDate ? new Date(afcAppliedDate) : null,
            afcExpiryDate: afcExpiryDate ? new Date(afcExpiryDate) : null,
            lastCleaningDate: lastCleaningDate ? new Date(lastCleaningDate) : null,
            lastCleaningPort: lastCleaningPort?.trim() || null,
            operatingProfile: operatingProfile?.trim() || null,
            primaryTradeRoute: primaryTradeRoute?.trim() || null,
            vesselImage: vesselImage || null,
            gaDrawing: gaDrawing || null,
            apiDataSnapshot: apiDataSnapshot || null,
            apiDataUpdatedAt: apiDataSnapshot ? new Date() : null
        };
        
        let vessel;
        
        // If IMO provided, try to upsert
        if (imoNumber) {
            vessel = await req.prisma.vessel.upsert({
                where: { imoNumber: imoNumber.trim() },
                update: data,
                create: data
            });
        } else {
            vessel = await req.prisma.vessel.create({ data });
        }
        
        res.status(201).json(vessel);
        
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/vessels/:id
 * Update a vessel
 */
router.put('/:id', requireAuth, async (req, res, next) => {
    try {
        // Check ownership
        const existing = await req.prisma.vessel.findFirst({
            where: {
                id: req.params.id,
                OR: [
                    { userId: req.user.id },
                    { userId: null }
                ]
            }
        });
        
        if (!existing) {
            return res.status(404).json({ error: 'Vessel not found' });
        }
        
        const data = { ...req.body };
        
        // Parse dates
        const dateFields = ['afcAppliedDate', 'afcExpiryDate', 'lastCleaningDate'];
        dateFields.forEach(field => {
            if (data[field]) {
                data[field] = new Date(data[field]);
            }
        });
        
        // Parse floats
        const floatFields = ['loa', 'beam', 'draft', 'grossTonnage'];
        floatFields.forEach(field => {
            if (data[field]) {
                data[field] = parseFloat(data[field]);
            }
        });
        
        const vessel = await req.prisma.vessel.update({
            where: { id: req.params.id },
            data
        });
        
        res.json(vessel);
        
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/vessels/:id
 * Delete a vessel (only if owned by user)
 */
router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        const result = await req.prisma.vessel.deleteMany({
            where: { id: req.params.id, userId: req.user.id }
        });
        
        if (result.count === 0) {
            return res.status(404).json({ error: 'Vessel not found or not owned by you' });
        }
        
        res.json({ success: true, message: 'Vessel deleted' });
        
    } catch (error) {
        next(error);
    }
});

// ============================================
// External API Integration
// ============================================

/**
 * POST /api/vessels/lookup
 * Look up vessel from external API and optionally save
 */
router.post('/lookup', requireAuth, async (req, res, next) => {
    try {
        const { imoNumber, mmsi, vesselName, saveToDatabase } = req.body;
        
        // This would normally call Marinesia or another vessel API
        // For now, we'll just check our database
        
        let vessel = null;
        
        if (imoNumber) {
            vessel = await req.prisma.vessel.findUnique({
                where: { imoNumber }
            });
        }
        
        if (!vessel && vesselName) {
            vessel = await req.prisma.vessel.findFirst({
                where: {
                    vesselName: { contains: vesselName, mode: 'insensitive' }
                }
            });
        }
        
        if (vessel) {
            res.json({ found: true, source: 'database', vessel });
        } else {
            res.json({ 
                found: false, 
                message: 'Vessel not found in database. Use external API to search.' 
            });
        }
        
    } catch (error) {
        next(error);
    }
});

module.exports = router;

