import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import db from './db.js'; // MongoDB connection
import User from '../models/User.js';
// Removed: import SIEMDashboard from '../components/SIEMDashboard.tsx';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 🔐 POST /login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const payload = {
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'defaultsecret', {
      expiresIn: '1h',
    });

    res.json({
      message: 'Login successful',
      token,
      user: payload,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 🛡️ JWT Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing auth header' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// 📊 GET /api/dashboard
app.get('/api/dashboard', authenticateToken, (req, res) => {
  const { email, name, role } = req.user;

  res.json({
    message: `Welcome back, ${name} (${role})`,
    email,
    role,
    loginEvents: [2, 5, 3],
    passwordChanges: [1, 5, 3],
    suspiciousLogins: [2, 6, 4],
    passwordHealth: [1, 4, 2],
  });
});

// Removed: app.listen(PORT)

export default app;
