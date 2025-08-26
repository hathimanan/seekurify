// --- Load environment variables ---
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';

// --- Paths for __dirname in ES modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Load correct .env file ---
const NODE_ENV = process.env.NODE_ENV || "development";
dotenv.config({
  path: NODE_ENV === "production"
    ? ".env.production"
    : NODE_ENV === "test"
    ? ".env.test"
    : ".env.development"
});

// --- Determine if production ---
const PROD = NODE_ENV === "production";

// --- App setup ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- CORS setup ---
const allowedOrigins = PROD
  ? ['https://your-domain.com']           // production frontend(s)
  : ['http://localhost:5173'];            // dev frontend

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// --- Security headers ---
const devCsp = {
  useDefaults: true,
  directives: {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", "ws:", "wss:"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"]
  }
};


const prodCsp = {
  useDefaults: true,
  directives: {
    "default-src": ["'self'"],
    "script-src": ["'self'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "upgrade-insecure-requests": []
  }
};

app.use(helmet({
  contentSecurityPolicy: PROD ? prodCsp : devCsp,
  crossOriginEmbedderPolicy: false,
}));

// Extra Helmet hardening
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use(helmet.crossOriginOpenerPolicy());
app.use(helmet.crossOriginResourcePolicy({ policy: 'same-site' }));
app.use(helmet.originAgentCluster());
if (PROD) {
  app.use(helmet.hsts({
    maxAge: 60 * 60 * 24 * 365,
    includeSubDomains: true,
    preload: true
  }));
}


app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "http://localhost:5000"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  })
);


// --- Trust proxy for secure cookies & HSTS ---
app.set('trust proxy', 1);
app.disable('x-powered-by');

// --- Body parsing ---
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --- Sessions (5 min) ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 5 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: PROD,
  }
}));

// --- Database connection ---
import './src/api/db.js';

// --- Routers ---
import authRouter from './src/api/auth.js';
import loginRoutes from './src/api/login.js';
import dashboardRouter from './src/api/dashboard.js';
import passwordRoutes from './src/api/passwords.js';
import homepageBeforeloginRoutes from './src/api/homepageBeforelogin.js';
import homepageAfterLoginRoutes from './src/api/homepageAfterLogin.js';
import malwareAnalyzerRouter from './src/api/malwareanalyzer.js';
import contactRouter from './src/api/contactForm.js';
import SIEMDashboard from './src/api/siemDashboard.js';
import profileRoute from './src/api/profile.js';
import userSchema from './src/models/User.ts';

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

// --- Serve static files from Vite build ---
app.use(express.static(path.join(__dirname, 'securifyy-main')));

// --- SPA fallback (non-API routes) ---
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
});

// --- Graceful shutdown ---
const shutdown = () => {
  console.log('🔻 Server shutting down...');
  if (NODE_ENV === 'development') {
    console.log('⚠️ In-memory sessions will be lost.');
  }
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
