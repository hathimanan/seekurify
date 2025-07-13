import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Load secret key from env or default fallback
const secretKey = process.env.secretKey || 'default_secret_key';

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// GET /api/homepage-after-login
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Simulate secured dashboard data
    const dashboardInfo = {
      message: `Welcome to Securify dashboard, ${userEmail}!`,
      features: [
        'Analyze Malware',
        'Password Manager',
        'SIEM Dashboard',
        'Security Awareness Tools'
      ],
      user: {
        email: userEmail,
        id: req.user.id
      },
      alerts: [
        { type: 'malware-scan', status: 'All clear', timestamp: new Date() },
        { type: 'system-health', status: 'Optimal', timestamp: new Date() }
      ]
    };

    res.status(200).json(dashboardInfo);
  } catch (error) {
    console.error('Error in /homepage-after-login:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
