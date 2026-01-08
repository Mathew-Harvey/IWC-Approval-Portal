/**
 * External API Routes
 * Proxies for Marinesia API and AISStream data endpoints
 */

const express = require('express');
const router = express.Router();
const vesselCache = require('../services/vesselCache');

const MARINESIA_API_KEY = process.env.MARINESIA_API_KEY;

// ============================================
// Marinesia API Routes
// ============================================

/**
 * GET /api/marinesia/vessel/:mmsi/profile
 * Get vessel profile by MMSI from Marinesia
 */
router.get('/marinesia/vessel/:mmsi/profile', async (req, res) => {
    try {
        const { mmsi } = req.params;
        
        if (!MARINESIA_API_KEY) {
            return res.status(503).json({ 
                error: true, 
                message: 'Marinesia API not configured' 
            });
        }
        
        const url = `https://api.marinesia.com/api/v1/vessel/${mmsi}/profile?key=${MARINESIA_API_KEY}`;
        
        console.log(`📤 Marinesia API: GET /vessel/${mmsi}/profile`);
        
        const response = await fetch(url);
        
        // Handle 404 gracefully - vessel not in Marinesia database
        if (response.status === 404) {
            return res.json({
                error: true,
                message: 'Vessel not found in Marinesia database',
                data: null
            });
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error(`❌ Marinesia API returned non-JSON (${response.status})`);
            
            let errorMessage = 'Marinesia API returned an error';
            if (text.includes('rate limit') || text.includes('Rate Limit')) {
                errorMessage = 'Rate limit exceeded. Please try again later.';
            } else if (text.includes('Invalid') || text.includes('invalid')) {
                errorMessage = 'Invalid API key or request.';
            }
            
            return res.status(response.status).json({ 
                error: true, 
                message: errorMessage,
                status: response.status
            });
        }
        
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('❌ Marinesia API error:', error.message);
        res.status(500).json({ 
            error: true, 
            message: 'Failed to fetch from Marinesia', 
            details: error.message 
        });
    }
});

/**
 * GET /api/marinesia/vessel/profile
 * Search vessels by filters from Marinesia
 */
router.get('/marinesia/vessel/profile', async (req, res) => {
    try {
        if (!MARINESIA_API_KEY) {
            return res.status(503).json({ 
                error: true, 
                message: 'Marinesia API not configured' 
            });
        }
        
        const queryParams = new URLSearchParams(req.query);
        queryParams.set('key', MARINESIA_API_KEY);
        
        const url = `https://api.marinesia.com/api/v1/vessel/profile?${queryParams}`;
        
        console.log(`📤 Marinesia API: GET /vessel/profile?filters=${req.query.filters || 'none'}`);
        
        const response = await fetch(url);
        
        // Handle 404 as "no results found" - return empty array
        if (response.status === 404) {
            return res.json({
                error: false,
                message: 'No vessels found',
                data: [],
                meta: { page: 1, limit: 10, total: 0, total_pages: 0 }
            });
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error(`❌ Marinesia API returned non-JSON (${response.status})`);
            
            let errorMessage = 'Marinesia API returned an error';
            if (text.includes('rate limit') || text.includes('Rate Limit')) {
                errorMessage = 'Rate limit exceeded. Please try again later.';
            } else if (text.includes('Invalid') || text.includes('invalid')) {
                errorMessage = 'Invalid API key or request.';
            }
            
            return res.status(response.status).json({ 
                error: true, 
                message: errorMessage,
                status: response.status
            });
        }
        
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('❌ Marinesia API error:', error.message);
        res.status(500).json({ 
            error: true, 
            message: 'Failed to fetch from Marinesia', 
            details: error.message 
        });
    }
});

/**
 * GET /api/marinesia/vessel/:mmsi/location/latest
 * Get vessel latest location from Marinesia
 */
router.get('/marinesia/vessel/:mmsi/location/latest', async (req, res) => {
    try {
        const { mmsi } = req.params;
        
        if (!MARINESIA_API_KEY) {
            return res.status(503).json({ 
                error: true, 
                message: 'Marinesia API not configured' 
            });
        }
        
        const url = `https://api.marinesia.com/api/v1/vessel/${mmsi}/location/latest?key=${MARINESIA_API_KEY}`;
        
        const response = await fetch(url);
        
        // Handle 404 gracefully - no location data available
        if (response.status === 404) {
            return res.json({
                error: true,
                message: 'No location data available for this vessel',
                data: null
            });
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error(`❌ Marinesia API returned non-JSON (${response.status})`);
            return res.status(response.status).json({ 
                error: true, 
                message: 'Marinesia API returned an error',
                status: response.status
            });
        }
        
        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('❌ Marinesia API error:', error.message);
        res.status(500).json({ 
            error: true, 
            message: 'Failed to fetch from Marinesia', 
            details: error.message 
        });
    }
});

// ============================================
// AISStream Routes (from vessel cache)
// ============================================

/**
 * GET /api/aisstream/search
 * Search vessels in AISStream cache
 */
router.get('/aisstream/search', (req, res) => {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
        return res.status(400).json({ 
            error: true, 
            message: 'Query must be at least 2 characters' 
        });
    }

    const results = vesselCache.search(query);
    
    res.json({
        error: false,
        message: `Found ${results.length} vessels`,
        data: results,
        stats: vesselCache.getStats()
    });
});

/**
 * GET /api/aisstream/vessel/:mmsi
 * Get vessel from AISStream cache by MMSI
 */
router.get('/aisstream/vessel/:mmsi', (req, res) => {
    const { mmsi } = req.params;
    const vessel = vesselCache.getVessel(mmsi);
    
    if (vessel) {
        res.json({
            error: false,
            data: { ...vessel, mmsi, source: 'aisstream' }
        });
    } else {
        res.status(404).json({
            error: true,
            message: 'Vessel not found in cache'
        });
    }
});

/**
 * GET /api/aisstream/status
 * Get AISStream connection status
 */
router.get('/aisstream/status', (req, res) => {
    res.json({
        error: false,
        ...vesselCache.getStats()
    });
});

module.exports = router;

