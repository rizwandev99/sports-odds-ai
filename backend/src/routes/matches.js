const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * In-Memory TTL Cache Configuration
 * Implemented to significantly reduce network I/O block times and prevent
 * aggressive rate-limiting/overloading on the underlying Python ML inference service.
 */
const oddsCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCachedOdds(matchId) {
    const entry = oddsCache.get(matchId);
    if (!entry) return null;
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
        oddsCache.delete(matchId);
        return null;
    }
    return entry.odds;
}

router.get('/', authenticateToken, async (req, res) => {
    try {
        const matches = await prisma.match.findMany();
        
        const userId = req.user.userId;
        const userFavs = await prisma.favorite.findMany({ where: { userId } });
        const favMatchIds = new Set(userFavs.map(f => f.matchId));

        const toFetch = matches.filter(m => !getCachedOdds(m.id));

        /**
         * Executing batched HTTP payload against the ML layer.
         * Bypasses synchronous iteration bottleneck by fetching un-cached targets globally.
         */
        if (toFetch.length > 0) {
            const pythonResponse = await fetch('http://python-odds:8000/generate-odds/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matches: toFetch.map(m => ({
                        matchId: m.id,
                        teamA: m.teamA,
                        teamB: m.teamB,
                        teamA_rating: m.ratingA,
                        teamB_rating: m.ratingB
                    }))
                })
            });
            const batchOdds = await pythonResponse.json();

            batchOdds.forEach(result => {
                oddsCache.set(result.matchId, {
                    odds: result,
                    cachedAt: Date.now()
                });
            });
        }

        const result = matches.map(m => ({
            ...m,
            liveOdds: getCachedOdds(m.id) || null,
            oddsFromCache: !!getCachedOdds(m.id),
            isFavorite: favMatchIds.has(m.id)
        }));

        res.json(result);
    } catch (error) {
        console.error('Matches Pipeline Error:', error);
        res.status(500).json({ error: 'Failed to complete odds pipeline aggregation.' });
    }
});

module.exports = router;
