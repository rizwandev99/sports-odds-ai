const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    // Token comes in header like: "Authorization: Bearer eyJhbGci..."
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Get just the token part

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        // Verify the token using our secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to the request
        next(); // Move on to the actual route handler
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
}

module.exports = authenticateToken;
