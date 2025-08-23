import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import { fileURLToPath } from 'url';

// --- Paths ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- App ---
const app = express();
const PORT = process.envPORT || 5000;
const PROD = process.env.NODE_ENV === 'production';

// If you're behind a reverse proxy (Render, Railway, Nginx, Heroku), enable this so secure cookies & HSTS behave correctly
app.set('trust proxy', 1);

// Turn off the Express signature
app.disable('x-powered-by');

// --- DB ---
import './src/api/db.js';

// --- Routers ---
import authRouter from './src/api/auth.js';
import loginRoutes from './src/api/login.js';
import dashboardRouter from './src/api/dashboard.js';
import passwordRoutes from './src/api/passwords.js';
import homepageBeforeloginRoutes from './src/api/homepageBeforelogin.js';
import homepageAfterLoginRoutes from './src/api/homepageAfterLogin.js';
import userSchema from './src/models/User.ts';
import malwareAnalyzerRouter from './src/api/malwareanalyzer.js';
import contactRouter from './src/api/contactForm.js';
import SIEMDashboard from './src/api/siemDashboard.js';
import profileRoute from './src/api/profile.js';

// --- CORS first (so Helmet COEP/CORP don't conflict in dev) ---
app.use(cors({
  origin: PROD ? ['https://your-domain.com'] : true, // adjust for your domains
  credentials: true
}));

// --- Helmet: security headers ---
const devCsp = {
  useDefaults: true,
  directives: {
    // In dev, Vite dev server & React Fast Refresh may need inline/eval
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", "ws:", "wss:"], // APIs, websockets (Vite dev)
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"]
  }
};

const prodCsp = {
  useDefaults: true,
  directives: {
    "default-src": ["'self'"],
    "script-src": ["'self'"], // no inline/eval in prod builds
    "style-src": ["'self'", "'unsafe-inline'"], // allow inline styles from frameworks; remove if fully hashed
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'"], // add external API origins here if any
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "upgrade-insecure-requests": [] // if your site is fully HTTPS
  }
};

app.use(helmet({
  // Leave defaults on; add/override below
  contentSecurityPolicy: PROD ? prodCsp : devCsp,
  crossOriginEmbedderPolicy: false, // often needed for third-party iframes/canvases
}));

// Extra hardening (some are already included by helmet defaults; kept explicit for clarity)
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use(helmet.crossOriginOpenerPolicy());
app.use(helmet.crossOriginResourcePolicy({ policy: 'same-site' }));
app.use(helmet.originAgentCluster());

// HSTS only in production (requires HTTPS)
if (PROD) {
  app.use(helmet.hsts({
    maxAge: 60 * 60 * 24 * 365, // 1 year
    includeSubDomains: true,
    preload: true
  }));
}

// --- Body parsing ---
app.use(express.json());

// --- Session (5 min) ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 5 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: PROD, // secure cookies only over HTTPS
  }
}));
app.use(express.urlencoded({ extended: false }));
// --- API Routes ---
app.use('/api/homepage', homepageBeforeloginRoutes);
app.use('/api/auth', authRouter);
app.use('/api/login', loginRoutes);
app.use('/api/homepageAfterlogin', homepageAfterLoginRoutes);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/passwords', passwordRoutes);
app.use('/api/malware-analysis', malwareAnalyzerRouter);
app.use('/api', contactRouter);
app.use('/api', SIEMDashboard);
app.use('/api/profile', profileRoute);
app.use('/api/user', userSchema);

// --- Static (Vite build) ---
app.use(express.static(path.join(__dirname, 'dist')));

// --- SPA fallback for non-API routes ---
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- Start ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// --- Graceful shutdown ---
const shutdown = () => {
  console.log('🔻 Server shutting down...');
  if (app.get('env') === 'development') {
    console.log('⚠️ In-memory sessions will be lost automatically on shutdown.');
  }
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
