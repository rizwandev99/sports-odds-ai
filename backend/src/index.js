const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const matchRoutes = require('./routes/matches');
const favoriteRoutes = require('./routes/favorites');
const agentRoutes = require('./routes/agent');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/matches', matchRoutes); 
app.use('/favorites', favoriteRoutes);
app.use('/agent', agentRoutes);

app.get('/', (req, res) => {
    res.json({ message: "Welcome to the Sports Odds API!" });
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Backend server running on http://localhost:${PORT}`);
});
