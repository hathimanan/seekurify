/**
 * Seekurify — AI Pipeline Red-Team Agent API
 *
 * POST /api/red-team/scan      — start a scan (SSE stream)
 * GET  /api/red-team/history   — list past scans for the user
 * GET  /api/red-team/scan/:id  — get a single scan result
 */

import express from 'express';
import jwt     from 'jsonwebtoken';
import { runRedTeamAgent } from '../agents/redTeamAgent.js';
import RedTeamScanLog       from '../models/RedTeamScanLog.js';

const router = express.Router();

// ─── Auth helper ──────────────────────────────────────────────────────────────
function extractUserId(req) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    return decoded.id ?? decoded.userId ?? decoded._id ?? null;
  } catch (_) { return null; }
}

function requireAuth(req, res, next) {
  const userId = extractUserId(req);
  if (!userId) return res.status(401).json({ error: 'Authentication required.' });
  req._userId = userId;
  next();
}

// ─── Simple per-user in-memory rate limit (1 concurrent scan) ────────────────
const activeScans = new Set();

// ─── POST /red-team/scan ──────────────────────────────────────────────────────
router.post('/red-team/scan', requireAuth, async (req, res) => {
  const userId = req._userId;

  if (activeScans.has(userId)) {
    return res.status(429).json({ error: 'A scan is already running. Please wait for it to complete.' });
  }

  const { targetUrl, apiKey, authHeader, requestFormat, customBodyTemplate } = req.body;
  if (!targetUrl) return res.status(400).json({ error: 'targetUrl is required.' });

  // ── Set up SSE ──────────────────────────────────────────────────────────
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');  // disable nginx buffering
  res.flushHeaders();

  const emit = (event, data) => {
    if (res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Keep-alive ping every 20s to prevent proxy timeouts
  const ping = setInterval(() => {
    if (res.writableEnded) { clearInterval(ping); return; }
    res.write(': ping\n\n');
  }, 20_000);

  activeScans.add(userId);

  try {
    await runRedTeamAgent({
      config: { targetUrl, apiKey, authHeader, requestFormat, customBodyTemplate },
      emit,
      userId,
    });
  } catch (err) {
    emit('error', { message: err.message });
    // Mark scan as failed in DB if it was saved
    await RedTeamScanLog.findOneAndUpdate(
      { userId, status: 'running' },
      { $set: { status: 'failed' } },
      { sort: { createdAt: -1 } }
    ).catch(() => {});
  } finally {
    clearInterval(ping);
    activeScans.delete(userId);
    if (!res.writableEnded) res.end();
  }
});

// ─── GET /red-team/history ────────────────────────────────────────────────────
router.get('/red-team/history', requireAuth, async (req, res) => {
  try {
    const logs = await RedTeamScanLog.find({ userId: req._userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('targetUrl requestFormat status score riskLevel totalProbes successfulAttacks duration createdAt summary')
      .lean();
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scan history.' });
  }
});

// ─── GET /red-team/scan/:id ───────────────────────────────────────────────────
router.get('/red-team/scan/:id', requireAuth, async (req, res) => {
  try {
    const log = await RedTeamScanLog.findOne({
      _id: req.params.id,
      userId: req._userId,
    }).lean();
    if (!log) return res.status(404).json({ error: 'Scan not found.' });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scan.' });
  }
});

export default router;
