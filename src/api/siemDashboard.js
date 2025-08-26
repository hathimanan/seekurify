// 📁 backend/routes/SIEMDashboard.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

import db from './db.js';
import User from '../models/User.ts';
import LoginEvent from '../models/LoginEvent.model.js';
import PasswordChangeEvent from '../models/PasswordChangeEvent.model.js';

dotenv.config({ path: '.env.development' });
const SIEMDashboard = express.Router();

SIEMDashboard.use(cors());
SIEMDashboard.use(express.json());

// ✅ Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']; // ✅ Correctly access the Authorization header
  if (!authHeader) return res.status(401).json({ error: 'Missing auth header' });

  const token = authHeader.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ error: 'Token missing' });

  jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// ✅ Dashboard Route
SIEMDashboard.get('/siem-dashboard', authenticateToken, async (req, res) => {
  console.log("✅ SIEM Dashboard hit by:", req.user?.email);
  const { _id: userId, email } = req.user;

  try {
const loginData = await LoginEvent.aggregate([
  { $match: { userId: new mongoose.Types.ObjectId(userId) } },
  {
    $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
      count: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
  { $limit: 15 }, // You can increase to 15 if you want 15 days
]);
const loginEvents = loginData.map(entry => ({
  date: entry._id,
  count: entry.count,
}));

const passwordChangeData = await PasswordChangeEvent.aggregate([
  { $match: { userId: new mongoose.Types.ObjectId(userId) } },
  {
    $group: {
      _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
      count: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } },
  { $limit: 15 },
]);
const passwordChanges = passwordChangeData.map(entry => ({
  date: entry._id,
  count: entry.count,
}));

// intervalMinutes = size of bucket in minutes (e.g. 3, 5, 15, 60)
const intervalMinutes = 15;

const suspiciousLoginAgg = await LoginEvent.aggregate([
  {
    $match: {
      success: false, // only suspicious/failed logins
    },
  },
  {
    $group: {
      _id: {
        $toDate: {
          $subtract: [
            { $toLong: "$timestamp" },
            { $mod: [{ $toLong: "$timestamp" }, 1000 * 60 * intervalMinutes] }
          ]
        }
      },
      count: { $sum: 1 },
    },
  },
  { $sort: { _id: 1 } }
]);

const suspiciousLogins = suspiciousLoginAgg.map(entry => {
  const start = new Date(entry._id);
  const end = new Date(start.getTime() + intervalMinutes * 60000);
  return {
    intervalStart: start.toISOString(),
    intervalEnd: end.toISOString(),
    count: entry.count,
  };
});


const users = await User.find({_id: userId }); // or all users if global dashboard

let poor = 0, medium = 0, good = 0, strong = 0;

users.forEach(user => {
  const strength = user.passwordStrength;
  if (strength === 'Poor') poor++;
  else if (strength === 'Medium') medium++;
  else if (strength === 'Good') good++;
  else if (strength === 'Strong') strong++;
});

const passwordHealth = [
  { category: 'Poor', count: poor },
  { category: 'Medium', count: medium },
  { category: 'Good', count: good },
  { category: 'Strong', count: strong },
];



    res.json({
      message: `Welcome back, ${email}`,
      email,
      loginEvents,
      passwordChanges,
      suspiciousLogins,
      passwordHealth,
    });
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

export default SIEMDashboard;
