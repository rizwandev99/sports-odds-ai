const express = require('express');
const Groq = require('groq-sdk');
const { PrismaClient } = require('@prisma/client');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * AI Tool Definition
 * Standard OpenAI-style function calling definition for Groq integration.
 * Enables the LLM to autonomously fetch database state on-demand.
 */
const tools = [
    {
        type: 'function',
        function: {
            name: 'get_match_data',
            description: 'Fetches all current live sports matches with team ratings from the database. Call this tool whenever you need to answer questions about specific matches, odds, teams, or predictions.',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
            },
        },
    },
];

router.post('/query', authenticateToken, async (req, res) => {
    const { userQuestion } = req.body;
    if (!userQuestion) {
        return res.status(400).json({ error: 'Please provide a userQuestion' });
    }

    try {
        const messages = [
            {
                role: 'system',
                content: 'You are a knowledgeable Sports Odds AI. Always use the get_match_data tool to fetch real data before answering sports questions. Be insightful and analytical in your responses.'
            },
            {
                role: 'user',
                content: userQuestion,
            },
        ];

        // First chat completion request to check for tool calls
        const response = await groq.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: messages,
            tools: tools,
            tool_choice: 'auto',
            max_tokens: 1024,
        });

        const responseMessage = response.choices[0].message;
        const toolCalls = responseMessage.tool_calls;

        if (toolCalls) {
            // Groq/OpenAI flow: handle tool calls and resubmit to get final answer
            messages.push(responseMessage); // Add assistant message with tool calls

            for (const toolCall of toolCalls) {
                if (toolCall.function.name === 'get_match_data') {
                    const matches = await prisma.match.findMany();
                    const matchData = matches.map(m =>
                        `Match ${m.id}: ${m.teamA} (rating: ${m.ratingA}) vs ${m.teamB} (rating: ${m.ratingB}) — ${m.sport} | ${m.league}`
                    );

                    messages.push({
                        tool_call_id: toolCall.id,
                        role: 'tool',
                        name: 'get_match_data',
                        content: JSON.stringify({ matches: matchData }),
                    });
                }
            }

            // Get final response after tool execution
            const secondResponse = await groq.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                messages: messages,
            });

            return res.json({ answer: secondResponse.choices[0].message.content });
        }

        // If no tool calls were needed
        return res.json({ answer: responseMessage.content });

    } catch (error) {
        console.error('Groq AI Orchestration Error:', error);
        res.status(500).json({ error: 'The AI agent failed to execute the integration pipeline.' });
    }
});

module.exports = router;
