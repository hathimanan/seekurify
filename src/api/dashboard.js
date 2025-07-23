import express from 'express';
import jwt from 'jsonwebtoken';

const dashboardRouter = express.Router();

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1]; // Expected format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Token missing in Authorization header' });
  }

  const secret = process.env.JWT_SECRET || process.env.secretKey; // fallback

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      console.error("❌ JWT verification failed:", err.message);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user; // decoded payload
    next();
  });
}

// GET /dashboard - Protected route
dashboardRouter.get('/dashboard', authenticateToken, (req, res) => {
  res.json({ message: `Welcome to your dashboard, ${req.user.email}!` });
});

export default dashboardRouter;