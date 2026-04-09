const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// POST /auth/register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
    }

    // 2. Hash the password (never store plain text!)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Save to database
    const user = await prisma.user.create({
        data: { name, email, password: hashedPassword }
    });

    res.status(201).json({ message: 'User registered!', userId: user.id });
});

// POST /auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 3. Create JWT token
    const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ message: 'Login successful!', token });
});

module.exports = router;
