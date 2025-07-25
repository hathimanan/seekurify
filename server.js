import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

import express from 'express';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import database connection
import './src/api/db.js'; // Ensure this connects to DB

// Import routes
import authRouter from './src/api/auth.js';
import loginRoutes from './src/api/login.js';
import dashboardRouter from './src/api/dashboard.js';
import passwordRoutes from './src/api/passwords.js';
import homepageBeforeloginRoutes from './src/api/homepageBeforelogin.js';
import homepageAfterLoginRoutes from './src/api/homepageAfterLogin.js';
import userdetailsRoutes from './src/models/User.js'; // Import user details route
import malwareAnalyzerRouter from './src/api/malwareanalyzer.js'; // Import malware analyzer routes
import ContactForm from './src/models/Contact.js';
import siemDashboard from './src/api/siemDashboard.js'; // Import SIEM dashboard routes

const app = express();
const PORT = process.env.PORT || 5000;

// --- Session Logic (5 min expiry) ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 5 * 60 * 1000, // 5 minutes
    httpOnly: true,
    sameSite: 'lax', // or 'strict' depending on your frontend
    secure: process.env.NODE_ENV === 'production', // true only in production with HTTPS
  }
}));

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/homepage', homepageBeforeloginRoutes);
app.use('/api/auth', authRouter);
app.use('/api/login', loginRoutes);
app.use('/api/homepageAfterlogin', homepageAfterLoginRoutes);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/passwords', passwordRoutes);
app.use('/api/malware-analysis/', malwareAnalyzerRouter);
app.use('/api/contact', ContactForm);
app.use('/api/siem-dashboard', siemDashboard);

// Serve static files from the React/Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// Catch all non-API routes and send index.html
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
