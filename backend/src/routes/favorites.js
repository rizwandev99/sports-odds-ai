const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', authenticateToken, async (req, res) => {
    const { matchId } = req.body;
    const userId = req.user.userId; 

    try {
        const favorite = await prisma.favorite.create({
            data: {
                userId: userId,
                matchId: matchId
            }
        });
        res.status(201).json({ message: "Added to favorites matrix.", favorite });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to allocate favorite record" });
    }
});

router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        // Hydrate associated dimensional match entities via relation graph
        const favoriteRecords = await prisma.favorite.findMany({
            where: { userId: userId },
            include: { match: true } 
        });

        const matches = favoriteRecords.map(fav => fav.match);

        /**
         * Resolves dynamic probability vectors from the external ML sequence.
         * Enforces a highly concurrent Promise execution pool for localized records against the engine.
         */
        const matchesWithOdds = await Promise.all(matches.map(async (match) => {
            try {
                const pythonResponse = await fetch('http://python-odds:8000/generate-odds', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        teamA: match.teamA,
                        teamB: match.teamB,
                        teamA_rating: match.ratingA,
                        teamB_rating: match.ratingB
                    })
                });

                const oddsData = await pythonResponse.json();
                return { ...match, liveOdds: oddsData };
            } catch (err) {
                return { ...match, liveOdds: null, error: "Service degraded: Odds unavailable" };
            }
        }));

        res.json(matchesWithOdds);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to aggregate favorites mapping." });
    }
});

router.delete('/:matchId', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const matchId = parseInt(req.params.matchId, 10);

    try {
        await prisma.favorite.deleteMany({
            where: {
                userId: userId,
                matchId: matchId
            }
        });
        res.json({ message: "Deallocated from favorites mapping." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to deallocate favorite node" });
    }
});

module.exports = router;
