const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * AI Tool Declaration Matrix
 * Exposes the internal database schema to the LLM agent via function calling.
 * Allows autonomous on-demand data fetching to minimize prompt context window overhead
 * and guarantee real-time statistical accuracy without hardcoding knowledge constraints.
 */
const tools = [{
    functionDeclarations: [{
        name: 'get_match_data',
        description: 'Fetches all current live sports matches with team ratings from the database. Call this tool whenever you need to answer questions about specific matches, odds, teams, or predictions.',
        parameters: {
            type: 'object',
            properties: {}
        }
    }]
}];

router.post('/query', authenticateToken, async (req, res) => {
    const { userQuestion } = req.body;
    if (!userQuestion) {
        return res.status(400).json({ error: 'Please provide a userQuestion' });
    }

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash-lite',
            tools: tools,
            systemInstruction: 'You are a knowledgeable Sports Odds AI. Always use the get_match_data tool to fetch real data before answering sports questions. Be insightful and analytical in your responses.'
        });

        const chat = model.startChat();

        const firstResult = await chat.sendMessage(userQuestion);
        const firstResponse = firstResult.response;
        const functionCalls = firstResponse.functionCalls?.();

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];

            if (call.name === 'get_match_data') {
                const matches = await prisma.match.findMany();
                
                // Map entity results into an optimized string digest for LLM context processing
                const matchData = matches.map(m =>
                    `Match ${m.id}: ${m.teamA} (rating: ${m.ratingA}) vs ${m.teamB} (rating: ${m.ratingB}) — ${m.sport} | ${m.league}`
                );

                const toolResult = await chat.sendMessage([{
                    functionResponse: {
                        name: 'get_match_data',
                        response: { matches: matchData }
                    }
                }]);

                return res.json({ answer: toolResult.response.text() });
            }
        }

        return res.json({ answer: firstResponse.text() });

    } catch (error) {
        console.error('AI Orchestration Error:', error);
        res.status(500).json({ error: 'The AI agent failed to execute the integration pipeline.' });
    }
});

module.exports = router;
