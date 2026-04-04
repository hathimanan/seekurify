import express from 'express';
import jwt from 'jsonwebtoken';
import InjectionScanLog from '../models/InjectionScanLog.js';
import AIAgentScanLog   from '../models/AIAgentScanLog.js';
import PIIScanLog       from '../models/PIIScanLog.js';

const router = express.Router();

// ─── Auth ─────────────────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid token' });
  }
}

// ─── Normalise risk levels to a common scale ──────────────────────────────────
// InjectionScanLog uses 'clean' instead of 'safe'; unify to safe/low/medium/high/critical
function normalizeRisk(raw) {
  if (!raw) return 'safe';
  if (raw === 'clean') return 'safe';
  return raw;
}

// ─── Risk ordering for sorting ────────────────────────────────────────────────
const RISK_ORDER = { critical: 5, high: 4, medium: 3, low: 2, safe: 1 };

// ─── GET /api/llm-siem/events ─────────────────────────────────────────────────
// Returns the 50 most recent LLM security events across all three sources.
router.get('/llm-siem/events', auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const limit  = Math.min(parseInt(req.query.limit) || 50, 200);

    const [injections, agentScans, piiScans] = await Promise.all([
      InjectionScanLog.find({ userId })
        .sort({ createdAt: -1 }).limit(limit).lean(),
      AIAgentScanLog.find({ userId })
        .sort({ createdAt: -1 }).limit(limit).lean(),
      PIIScanLog.find({ userId })
        .sort({ createdAt: -1 }).limit(limit).lean(),
    ]);

    const events = [
      ...injections.map(d => ({
        _id:       d._id.toString(),
        type:      'injection',
        typeLabel: 'Prompt Injection',
        icon:      'zap',
        riskLevel: normalizeRisk(d.riskLevel),
        score:     d.score,
        summary:   d.inputSummary
          ? `${d.inputType.toUpperCase()} — ${d.inputSummary.slice(0, 80)}`
          : `${d.inputType.toUpperCase()} scan`,
        findingCount: d.findings?.length ?? 0,
        timestamp: d.createdAt,
      })),
      ...agentScans.map(d => ({
        _id:       d._id.toString(),
        type:      d.scanType === 'exfil' ? 'exfil' : 'rag',
        typeLabel: d.scanType === 'exfil' ? 'System Prompt Exfiltration' : 'RAG Poisoning',
        icon:      d.scanType === 'exfil' ? 'bot' : 'database',
        riskLevel: normalizeRisk(d.riskLevel),
        score:     d.score,
        summary:   d.summary || (d.endpointUrl ? `Endpoint: ${d.endpointUrl.slice(0, 60)}` : 'Agent scan'),
        findingCount: null,
        timestamp: d.createdAt,
      })),
      ...piiScans.map(d => ({
        _id:       d._id.toString(),
        type:      'pii',
        typeLabel: 'PII Leakage',
        icon:      'scan',
        riskLevel: normalizeRisk(d.riskLevel),
        score:     d.score,
        summary:   d.summary || d.label || 'PII scan',
        findingCount: d.findingCount ?? 0,
        timestamp: d.createdAt,
      })),
    ];

    // Sort by timestamp desc, then by risk desc
    events.sort((a, b) => {
      const tDiff = new Date(b.timestamp) - new Date(a.timestamp);
      if (tDiff !== 0) return tDiff;
      return (RISK_ORDER[b.riskLevel] || 0) - (RISK_ORDER[a.riskLevel] || 0);
    });

    res.json(events.slice(0, limit));
  } catch (err) {
    console.error('LLM SIEM events error:', err);
    res.status(500).json({ error: 'Failed to fetch LLM SIEM events' });
  }
});

// ─── GET /api/llm-siem/stats ──────────────────────────────────────────────────
// Aggregated counts, risk breakdown, 7-day trend, and top threat type.
router.get('/llm-siem/stats', auth, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    // 7-day window
    const since = new Date();
    since.setDate(since.getDate() - 6);
    since.setHours(0, 0, 0, 0);

    const [injections, agentScans, piiScans] = await Promise.all([
      InjectionScanLog.find({ userId }).lean(),
      AIAgentScanLog.find({ userId }).lean(),
      PIIScanLog.find({ userId }).lean(),
    ]);

    // Build unified flat list
    const all = [
      ...injections.map(d => ({ type: 'injection', riskLevel: normalizeRisk(d.riskLevel), ts: new Date(d.createdAt) })),
      ...agentScans.map(d => ({ type: d.scanType === 'exfil' ? 'exfil' : 'rag', riskLevel: normalizeRisk(d.riskLevel), ts: new Date(d.createdAt) })),
      ...piiScans.map(d => ({ type: 'pii', riskLevel: normalizeRisk(d.riskLevel), ts: new Date(d.createdAt) })),
    ];

    // Totals
    const total = all.length;

    // By type
    const byType = { injection: 0, exfil: 0, rag: 0, pii: 0 };
    for (const e of all) byType[e.type] = (byType[e.type] || 0) + 1;

    // By risk
    const byRisk = { critical: 0, high: 0, medium: 0, low: 0, safe: 0 };
    for (const e of all) byRisk[e.riskLevel] = (byRisk[e.riskLevel] || 0) + 1;

    // 7-day trend (last 7 days, grouped by date string)
    const trendMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      trendMap[d.toLocaleDateString('en-CA')] = 0; // YYYY-MM-DD
    }
    for (const e of all) {
      const key = e.ts.toLocaleDateString('en-CA');
      if (key in trendMap) trendMap[key]++;
    }
    const trend = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

    // Top threat: highest-count type that has critical/high events
    const highRiskByType = {};
    for (const e of all) {
      if (e.riskLevel === 'critical' || e.riskLevel === 'high') {
        highRiskByType[e.type] = (highRiskByType[e.type] || 0) + 1;
      }
    }
    const topThreatType = Object.entries(highRiskByType).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    res.json({ total, byType, byRisk, trend, topThreatType });
  } catch (err) {
    console.error('LLM SIEM stats error:', err);
    res.status(500).json({ error: 'Failed to fetch LLM SIEM stats' });
  }
});

export default router;
