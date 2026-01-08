/**
 * Jobs API Routes
 * CRUD operations for IWC jobs
 */

const express = require('express');
const router = express.Router();
const { requireAuth, syncUser } = require('../middleware/auth');

// All job routes require authentication and user sync
router.use(requireAuth);
router.use(syncUser);

// ============================================
// List & Search Jobs
// ============================================

/**
 * GET /api/jobs
 * List all jobs for current user
 */
router.get('/', async (req, res, next) => {
    try {
        const { status, search, limit = 50, offset = 0 } = req.query;
        
        const where = {
            userId: req.user.id
        };
        
        if (status) {
            where.status = status;
        }
        
        if (search) {
            where.OR = [
                { jobNumber: { contains: search, mode: 'insensitive' } },
                { clientName: { contains: search, mode: 'insensitive' } },
                { vessel: { vesselName: { contains: search, mode: 'insensitive' } } }
            ];
        }
        
        const [jobs, total] = await Promise.all([
            req.prisma.job.findMany({
                where,
                include: {
                    vessel: {
                        select: {
                            id: true,
                            vesselName: true,
                            imoNumber: true,
                            vesselType: true
                        }
                    },
                    crewAssignments: {
                        include: {
                            crewMember: {
                                select: {
                                    id: true,
                                    name: true,
                                    position: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: { documents: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset)
            }),
            req.prisma.job.count({ where })
        ]);
        
        res.json({
            jobs,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/jobs/:id
 * Get single job by ID
 */
router.get('/:id', async (req, res, next) => {
    try {
        const job = await req.prisma.job.findFirst({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            include: {
                vessel: true,
                crewAssignments: {
                    include: {
                        crewMember: true
                    }
                },
                documents: true
            }
        });
        
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        res.json(job);
        
    } catch (error) {
        next(error);
    }
});

// ============================================
// Create & Update Jobs
// ============================================

/**
 * POST /api/jobs
 * Create a new job
 */
router.post('/', async (req, res, next) => {
    try {
        const {
            vesselId,
            jurisdiction,
            clientName,
            proposedStartDate,
            proposedEndDate,
            cleaningLocation,
            portName,
            berthWharf,
            afcType,
            afcCondition,
            afcExpiryDate,
            foulingRating,
            foulingCover,
            biofoulingOrigin,
            noProhibitedBiocides,
            scopeHull,
            scopeNicheAreas,
            scopePropeller,
            scopeSeaChests,
            maxDepth,
            bottomTime,
            decompressionProfile,
            breathingGas,
            equipment,
            clientContactName,
            clientContactPhone,
            simOpsContactName,
            simOpsContactPhone,
            siteType,
            ptwRequired,
            isolationRequired,
            siteInductionRequired,
            securityClearance,
            emergencyAssemblyPoint,
            onSiteDiveMedic,
            highRiskActivities,
            additionalActivities,
            siteSpecificHazards,
            formDataSnapshot,
            crewIds
        } = req.body;
        
        // Generate job number
        const jobNumber = await generateJobNumber(req.prisma, jurisdiction);
        
        // Create job
        const job = await req.prisma.job.create({
            data: {
                jobNumber,
                userId: req.user.id,
                vesselId,
                jurisdiction: jurisdiction || 'AU-WA',
                clientName,
                proposedStartDate: proposedStartDate ? new Date(proposedStartDate) : null,
                proposedEndDate: proposedEndDate ? new Date(proposedEndDate) : null,
                cleaningLocation,
                portName,
                berthWharf,
                afcType,
                afcCondition,
                afcExpiryDate: afcExpiryDate ? new Date(afcExpiryDate) : null,
                foulingRating: foulingRating ? parseInt(foulingRating) : 0,
                foulingCover: foulingCover ? parseInt(foulingCover) : 0,
                biofoulingOrigin,
                noProhibitedBiocides: noProhibitedBiocides !== false,
                scopeHull: scopeHull !== false,
                scopeNicheAreas: scopeNicheAreas !== false,
                scopePropeller: !!scopePropeller,
                scopeSeaChests: !!scopeSeaChests,
                maxDepth: maxDepth ? parseInt(maxDepth) : null,
                bottomTime,
                decompressionProfile,
                breathingGas,
                equipment,
                clientContactName,
                clientContactPhone,
                simOpsContactName,
                simOpsContactPhone,
                siteType,
                ptwRequired: !!ptwRequired,
                isolationRequired: !!isolationRequired,
                siteInductionRequired: !!siteInductionRequired,
                securityClearance: !!securityClearance,
                emergencyAssemblyPoint,
                onSiteDiveMedic: !!onSiteDiveMedic,
                highRiskActivities,
                additionalActivities,
                siteSpecificHazards,
                formDataSnapshot,
                // Create crew assignments if provided
                crewAssignments: crewIds?.length ? {
                    create: crewIds.map(crew => ({
                        crewMemberId: crew.id,
                        role: crew.role || 'DIVER'
                    }))
                } : undefined
            },
            include: {
                vessel: true,
                crewAssignments: {
                    include: { crewMember: true }
                }
            }
        });
        
        res.status(201).json(job);
        
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/jobs/:id
 * Update an existing job
 */
router.put('/:id', async (req, res, next) => {
    try {
        // Check ownership
        const existing = await req.prisma.job.findFirst({
            where: { id: req.params.id, userId: req.user.id }
        });
        
        if (!existing) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        const { crewIds, ...data } = req.body;
        
        // Parse dates if provided
        if (data.proposedStartDate) data.proposedStartDate = new Date(data.proposedStartDate);
        if (data.proposedEndDate) data.proposedEndDate = new Date(data.proposedEndDate);
        if (data.afcExpiryDate) data.afcExpiryDate = new Date(data.afcExpiryDate);
        
        // Parse integers
        if (data.foulingRating) data.foulingRating = parseInt(data.foulingRating);
        if (data.foulingCover) data.foulingCover = parseInt(data.foulingCover);
        if (data.maxDepth) data.maxDepth = parseInt(data.maxDepth);
        
        const job = await req.prisma.job.update({
            where: { id: req.params.id },
            data: {
                ...data,
                updatedAt: new Date()
            },
            include: {
                vessel: true,
                crewAssignments: {
                    include: { crewMember: true }
                }
            }
        });
        
        // Update crew assignments if provided
        if (crewIds !== undefined) {
            // Delete existing assignments
            await req.prisma.jobCrew.deleteMany({
                where: { jobId: job.id }
            });
            
            // Create new assignments
            if (crewIds?.length) {
                await req.prisma.jobCrew.createMany({
                    data: crewIds.map(crew => ({
                        jobId: job.id,
                        crewMemberId: crew.id,
                        role: crew.role || 'DIVER'
                    }))
                });
            }
        }
        
        res.json(job);
        
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/jobs/:id/status
 * Update job status
 */
router.patch('/:id/status', async (req, res, next) => {
    try {
        const { status } = req.body;
        
        const validStatuses = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        
        const job = await req.prisma.job.updateMany({
            where: { id: req.params.id, userId: req.user.id },
            data: {
                status,
                ...(status === 'PENDING_APPROVAL' && { submittedAt: new Date() }),
                ...(status === 'COMPLETED' && { completedAt: new Date() })
            }
        });
        
        if (job.count === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        res.json({ success: true, status });
        
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/jobs/:id
 * Delete a job
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const result = await req.prisma.job.deleteMany({
            where: { id: req.params.id, userId: req.user.id }
        });
        
        if (result.count === 0) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        res.json({ success: true, message: 'Job deleted' });
        
    } catch (error) {
        next(error);
    }
});

// ============================================
// Autosave Endpoint
// ============================================

/**
 * POST /api/jobs/:id/autosave
 * Quick autosave endpoint (updates formDataSnapshot only)
 */
router.post('/:id/autosave', async (req, res, next) => {
    try {
        const { formDataSnapshot } = req.body;
        
        await req.prisma.job.updateMany({
            where: { id: req.params.id, userId: req.user.id },
            data: { formDataSnapshot }
        });
        
        res.json({ success: true, savedAt: new Date().toISOString() });
        
    } catch (error) {
        next(error);
    }
});

// ============================================
// Helper Functions
// ============================================

/**
 * Generate a unique job number
 * Format: FUS-{JURISDICTION}-{YEAR}-{SEQ}
 */
async function generateJobNumber(prisma, jurisdiction = 'WA') {
    const year = new Date().getFullYear();
    const prefix = `FUS-${year}`;
    
    // Find the highest existing job number for this year
    const lastJob = await prisma.job.findFirst({
        where: {
            jobNumber: { startsWith: prefix }
        },
        orderBy: { jobNumber: 'desc' }
    });
    
    let sequence = 1;
    if (lastJob) {
        const match = lastJob.jobNumber.match(/-(\d+)$/);
        if (match) {
            sequence = parseInt(match[1]) + 1;
        }
    }
    
    return `${prefix}-${sequence.toString().padStart(4, '0')}`;
}

module.exports = router;

