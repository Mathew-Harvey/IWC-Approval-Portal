/**
 * Crew API Routes
 * CRUD operations for crew members
 */

const express = require('express');
const router = express.Router();
const { requireAuth, syncUser } = require('../middleware/auth');

// All crew routes require authentication and user sync
router.use(requireAuth);
router.use(syncUser);

// ============================================
// List & Search Crew
// ============================================

/**
 * GET /api/crew
 * List all crew members for current user
 */
router.get('/', async (req, res, next) => {
    try {
        const { search, active, position } = req.query;
        
        const where = {
            userId: req.user.id
        };
        
        if (active !== undefined) {
            where.isActive = active === 'true';
        }
        
        if (position) {
            where.position = position;
        }
        
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { adasCertNumber: { contains: search, mode: 'insensitive' } }
            ];
        }
        
        const crew = await req.prisma.crewMember.findMany({
            where,
            orderBy: [
                { isActive: 'desc' },
                { name: 'asc' }
            ]
        });
        
        res.json(crew);
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/crew/:id
 * Get single crew member by ID
 */
router.get('/:id', async (req, res, next) => {
    try {
        const member = await req.prisma.crewMember.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: {
                jobAssignments: {
                    include: {
                        job: {
                            select: {
                                id: true,
                                jobNumber: true,
                                clientName: true,
                                status: true,
                                proposedStartDate: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });
        
        if (!member) {
            return res.status(404).json({ error: 'Crew member not found' });
        }
        
        res.json(member);
        
    } catch (error) {
        next(error);
    }
});

// ============================================
// Create & Update Crew
// ============================================

/**
 * POST /api/crew
 * Create a new crew member
 */
router.post('/', async (req, res, next) => {
    try {
        const {
            name,
            email,
            phone,
            position,
            adasCertNumber,
            adasCertExpiry,
            diveMedicalExpiry,
            firstAidExpiry,
            o2AdminExpiry,
            whiteCardNumber,
            hrwlForklift,
            hrwlCrane,
            hrwlRigging,
            hrwlEwp
        } = req.body;
        
        if (!name?.trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        const member = await req.prisma.crewMember.create({
            data: {
                userId: req.user.id,
                name: name.trim(),
                email: email?.trim() || null,
                phone: phone?.trim() || null,
                position: position || 'Diver',
                adasCertNumber: adasCertNumber?.trim() || null,
                adasCertExpiry: adasCertExpiry ? new Date(adasCertExpiry) : null,
                diveMedicalExpiry: diveMedicalExpiry ? new Date(diveMedicalExpiry) : null,
                firstAidExpiry: firstAidExpiry ? new Date(firstAidExpiry) : null,
                o2AdminExpiry: o2AdminExpiry ? new Date(o2AdminExpiry) : null,
                whiteCardNumber: whiteCardNumber?.trim() || null,
                hrwlForklift: !!hrwlForklift,
                hrwlCrane: !!hrwlCrane,
                hrwlRigging: !!hrwlRigging,
                hrwlEwp: !!hrwlEwp
            }
        });
        
        res.status(201).json(member);
        
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/crew/:id
 * Update a crew member
 */
router.put('/:id', async (req, res, next) => {
    try {
        // Check ownership
        const existing = await req.prisma.crewMember.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        });
        
        if (!existing) {
            return res.status(404).json({ error: 'Crew member not found' });
        }
        
        const data = { ...req.body };
        
        // Parse dates
        const dateFields = ['adasCertExpiry', 'diveMedicalExpiry', 'firstAidExpiry', 'o2AdminExpiry'];
        dateFields.forEach(field => {
            if (data[field]) {
                data[field] = new Date(data[field]);
            }
        });
        
        const member = await req.prisma.crewMember.update({
            where: { id: req.params.id },
            data
        });
        
        res.json(member);
        
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/crew/:id
 * Delete a crew member
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const result = await req.prisma.crewMember.deleteMany({
            where: { id: req.params.id, userId: req.user.id }
        });
        
        if (result.count === 0) {
            return res.status(404).json({ error: 'Crew member not found' });
        }
        
        res.json({ success: true, message: 'Crew member deleted' });
        
    } catch (error) {
        next(error);
    }
});

// ============================================
// Bulk Operations
// ============================================

/**
 * POST /api/crew/bulk
 * Create or update multiple crew members
 */
router.post('/bulk', async (req, res, next) => {
    try {
        const { members } = req.body;
        
        if (!Array.isArray(members) || members.length === 0) {
            return res.status(400).json({ error: 'Members array is required' });
        }
        
        const results = [];
        
        for (const member of members) {
            if (!member.name?.trim()) continue;
            
            // Check if exists by name (case-insensitive)
            const existing = await req.prisma.crewMember.findFirst({
                where: {
                    userId: req.user.id,
                    name: { equals: member.name.trim(), mode: 'insensitive' }
                }
            });
            
            if (existing) {
                // Update existing
                const updated = await req.prisma.crewMember.update({
                    where: { id: existing.id },
                    data: {
                        position: member.position || existing.position,
                        adasCertNumber: member.adasCertNumber || existing.adasCertNumber,
                        phone: member.phone || existing.phone,
                        email: member.email || existing.email
                    }
                });
                results.push({ action: 'updated', member: updated });
            } else {
                // Create new
                const created = await req.prisma.crewMember.create({
                    data: {
                        userId: req.user.id,
                        name: member.name.trim(),
                        position: member.position || 'Diver',
                        adasCertNumber: member.adasCertNumber || null,
                        phone: member.phone || null,
                        email: member.email || null
                    }
                });
                results.push({ action: 'created', member: created });
            }
        }
        
        res.json({ success: true, results });
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/crew/expiring
 * Get crew members with expiring certifications
 */
router.get('/check/expiring', async (req, res, next) => {
    try {
        const { days = 30 } = req.query;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + parseInt(days));
        
        const expiring = await req.prisma.crewMember.findMany({
            where: {
                userId: req.user.id,
                isActive: true,
                OR: [
                    { adasCertExpiry: { lte: futureDate } },
                    { diveMedicalExpiry: { lte: futureDate } },
                    { firstAidExpiry: { lte: futureDate } },
                    { o2AdminExpiry: { lte: futureDate } }
                ]
            },
            orderBy: { name: 'asc' }
        });
        
        // Format response with expiry details
        const results = expiring.map(member => {
            const expiries = [];
            const now = new Date();
            
            if (member.adasCertExpiry && member.adasCertExpiry <= futureDate) {
                expiries.push({
                    type: 'ADAS Certificate',
                    date: member.adasCertExpiry,
                    expired: member.adasCertExpiry < now
                });
            }
            if (member.diveMedicalExpiry && member.diveMedicalExpiry <= futureDate) {
                expiries.push({
                    type: 'Dive Medical',
                    date: member.diveMedicalExpiry,
                    expired: member.diveMedicalExpiry < now
                });
            }
            if (member.firstAidExpiry && member.firstAidExpiry <= futureDate) {
                expiries.push({
                    type: 'First Aid',
                    date: member.firstAidExpiry,
                    expired: member.firstAidExpiry < now
                });
            }
            if (member.o2AdminExpiry && member.o2AdminExpiry <= futureDate) {
                expiries.push({
                    type: 'O2 Administration',
                    date: member.o2AdminExpiry,
                    expired: member.o2AdminExpiry < now
                });
            }
            
            return { ...member, expiries };
        });
        
        res.json(results);
        
    } catch (error) {
        next(error);
    }
});

module.exports = router;

