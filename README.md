# Seekurify

**Seekurify** is an all-in-one cybersecurity platform and secure password manager designed to help users stay safe in the digital world. It combines a robust encrypted vault with advanced AI-powered security tools and real-time threat detection.

---

## Features

### Core
- **Secure Password Manager** — Encrypted vault with AES-256, strong password generation, breach detection
- **User Authentication** — JWT-based auth, OTP email verification, suspicious login alerts
- **Real-time Alerts** — Socket.IO-powered notifications for suspicious activity

### Security Tools
- **Malware Analyzer** — Upload and scan files for viruses, malware, and suspicious patterns
- **Phishing Detector** — AI-powered email and link phishing analysis
- **Deepfake Detector** — Video deepfake detection
- **Site Audit** — Comprehensive website security assessment
- **CSP Builder** — Content Security Policy generator
- **Prompt Injection Scanner** — 3-layer detection (regex + ML + Anthropic Claude)
- **PII Leakage Detector** — Regex-based sensitive data scanner
- **Red Team Scanner** — Agentic AI red-team simulation
- **AI Agent Scanner** — Multi-model AI security probe
- **Watchlist Monitor** — Scheduled URL and asset monitoring

### Dashboard & Analytics
- **SIEM Dashboard** — Security event aggregation and visualization
- **LLM SIEM** — AI-specific threat event tracking
- **AI Security Assistant** — Context-aware security advisor (requires local LiteLLM or cloud AI provider)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Backend | Express.js (Node.js) |
| Database | MongoDB (Mongoose) |
| Real-time | Socket.IO |
| AI/ML | Anthropic Claude, OpenAI, Google AI, LiteLLM, Xenova Transformers |
| Styling | Tailwind CSS + Shadcn UI + Framer Motion |
| Deployment | Vercel (serverless) |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v22.6+ (required for TypeScript type stripping)
- MongoDB — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas)

---

## Getting Started

```bash
npm install
```

---

## Environment Setup

Create the following files in the root directory. **Never commit these files** — they are gitignored.

### `.env.development` (local dev)
```env
MONGODB_URI=mongodb://localhost:27017/seekurify
PORT=5000

# Auth
JWT_SECRET=<your-dev-jwt-secret>
secretKey=<your-dev-secret-key>
secretKeyOTP=<your-dev-otp-secret>
SESSION_SECRET=<your-dev-session-secret>

# Email (Gmail OAuth2)
GMAIL_USER=<your-gmail>
GMAIL_CLIENT_ID=<your-client-id>
GMAIL_CLIENT_SECRET=<your-client-secret>
GMAIL_REFRESH_TOKEN=<your-refresh-token>

# Password encryption
PASSWORD_ENCRYPTION_KEY=<64-char-hex>

# AI (optional — pick one or more)
ANTHROPIC_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>
GOOGLE_AI_API_KEY=<your-key>

# Local LiteLLM (for AI Security Assistant in dev)
LITELLM_API_KEY=lm-studio
LITELLM_API_BASE=http://127.0.0.1:5174/v1
LITELLM_MODEL=google/gemma-3-1b

# Other
GOOGLE_SAFE_BROWSING_API_KEY=<your-key>
HF_API_TOKEN=<your-key>
RAZORPAY_KEY_ID=<your-key>
RAZORPAY_KEY_SECRET=<your-key>

# CORS & Socket
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

# Cron
CRON_SECRET=<random-secret>
```

### `.env.production` (Vercel production)
```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/seekurify?retryWrites=true&w=majority
PORT=5000

# Auth (use production-specific keys)
JWT_PROD_SECRET=<your-prod-jwt-secret>
secretKey=<your-secret-key>
secretKeyOTP=<your-otp-secret>
SESSION_SECRET=<your-session-secret>

# Password encryption (production-specific key)
PASSWORD_ENCRYPTION_KEY_PROD=<64-char-hex>

# Email
GMAIL_USER=<your-gmail>
GMAIL_CLIENT_ID=<your-client-id>
GMAIL_CLIENT_SECRET=<your-client-secret>
GMAIL_REFRESH_TOKEN=<your-refresh-token>

# AI
ANTHROPIC_API_KEY=<your-key>
OPENAI_API_KEY=<your-key>
GOOGLE_AI_API_KEY=<your-key>

# Other
GOOGLE_SAFE_BROWSING_API_KEY=<your-key>
HF_API_TOKEN=<your-key>
RAZORPAY_KEY_ID=<your-key>
RAZORPAY_KEY_SECRET=<your-key>

# CORS & Socket
ALLOWED_ORIGINS=https://seekurify.vercel.app
VITE_SOCKET_URL=https://seekurify.vercel.app

# Cron
CRON_SECRET=<random-secret>

# Vercel
DISABLE_ML_WARMUP=1
```

> In production, `JWT_PROD_SECRET` is automatically aliased to `JWT_SECRET` and `PASSWORD_ENCRYPTION_KEY_PROD` to `PASSWORD_ENCRYPTION_KEY` via `src/lib/resolveSecrets.js`.

## Running the Application

### Development (frontend + backend together)
```bash
npm run dev:full
```

### Frontend only (Vite dev server)
```bash
npm run vite
```

### Backend only
```bash
npm run dev:backend
```

---

## Building for Production

```bash
npm run build
```

Output goes to `./dist/`. The Express server serves this directory as the SPA.

---

## Deployment (Vercel)

This project is configured for Vercel serverless deployment via `vercel.json`.

### Deployment pipeline
- **GitHub** → push to `main` → Vercel auto-deploys to production
- **Feature branches** → Vercel creates a preview deployment automatically

### Key serverless adaptations
- `server.js` exports the Express app as a handler (`export default server`)
- File uploads use `/tmp` on Vercel (ephemeral, cleaned after each request)
- Node-cron replaced with Vercel Cron Jobs (`/api/cron/nightly-watch`, `/api/cron/scheduled-scans`)
- AI conversation history persisted in MongoDB (not in-memory)
- ML model cache redirected to `/tmp/.model-cache`

### Environment variables
Set all variables from `.env.production` in Vercel → Project Settings → Environment Variables under the **Production** scope.

---

## API Endpoints (Key Routes)

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Send OTP |
| POST | `/api/auth/reset-password` | Reset password with OTP |

### Passwords
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/passwords` | Get all passwords |
| POST | `/api/passwords` | Add password |
| PUT | `/api/passwords/:id` | Update password |
| DELETE | `/api/passwords/:id` | Delete password |

### Security Tools
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/malware-analysis/scan` | Scan file for malware |
| POST | `/api/phishing/analyze` | Analyze email for phishing |
| POST | `/api/prompt-injection/scan` | Scan text for prompt injection |
| POST | `/api/pii/scan` | Scan for PII leakage |
| POST | `/api/red-team/scan` | Run red team simulation |
| POST | `/api/ai/assistant/chat` | Chat with AI security assistant |

### Cron (Vercel-triggered)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cron/nightly-watch` | Nightly watchlist scan (2 AM) |
| GET | `/api/cron/scheduled-scans` | Scheduled watchlist scans (every minute) |

> Cron endpoints require `Authorization: Bearer <CRON_SECRET>` header.

---

## Security Architecture

- **AES-256-GCM** encryption for stored passwords
- **bcrypt** password hashing
- **JWT** authentication with production-specific secrets
- **Rate limiting** — 100 req/15min general, 5 req/15min on auth routes
- **Helmet.js** security headers with strict production CSP
- **CORS** restricted to configured origins per environment
- **Input sanitization** — XSS and NoSQL injection protection on all requests
- **HPP** (HTTP Parameter Pollution) protection

---

## AI Features

| Feature | Provider | Works in Production |
|---------|----------|-------------------|
| AI Agent Scanner | LiteLLM → Google → Anthropic | ✅ (with API key) |
| Phishing Detection | LiteLLM → Google → Anthropic | ✅ (with API key) |
| Prompt Injection (ML) | Xenova ONNX (local) | ✅ Always |
| Prompt Injection (Claude) | Anthropic | ✅ (with API key) |
| Red Team Scanner | Anthropic | ✅ (with API key) |
| PII Leakage | Regex only | ✅ Always |
| LLM SIEM | Aggregation only | ✅ Always |
| Security Assistant | LiteLLM (local) | ⚠️ Dev only — configure cloud provider for production |

---

## License

Private — All rights reserved.
