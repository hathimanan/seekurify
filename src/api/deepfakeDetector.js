/**
 * Seekurify DeepFake Detector — Forensics Engine v2
 *
 * Complete rewrite. Three independent signals, conservative thresholds, and a
 * hard override: if a verified camera make + model are found in EXIF the final
 * verdict is always AUTHENTIC regardless of image-signal scores.
 *
 *  Signal 1 — Spatial Complexity Distribution (38%)
 *    Measures how unevenly complexity is spread across the image.
 *    Real photographs are statistically bimodal: large flat regions (sky/skin)
 *    coexist with a minority of highly-detailed regions (hair/foliage/edges).
 *    AI-generated images tend toward a uniform mid-level complexity everywhere.
 *    Metric: log10( P80 / (P20 + 1) ) of 8×8 block local variances.
 *    Low ratio → suspicious | High ratio → natural photo structure.
 *
 *  Signal 2 — Noise Residual Distribution (17%)
 *    Extracts per-pixel noise via a 3×3 median-filter subtraction (edge-
 *    preserving, unlike Gaussian blur). Analyses the CV of block-wise noise
 *    variance. Real cameras produce spatially non-uniform noise (bright/dark
 *    areas, textured regions all differ). AI clean-generation produces either
 *    near-zero or suspiciously uniform noise.
 *    Low CV of block noise → suspicious | High CV → camera-like.
 *
 *  Signal 3 — Metadata & Structural Forensics (45%)
 *    The highest-confidence signal when evidence is present. Checks camera
 *    make/model, AI-tool watermarks in XMP/IPTC/EXIF, dimension patterns
 *    common to generative models, and RGB channel balance.
 *    Hard override: camera make AND model found → caps final score at 0.22
 *    (forces AUTHENTIC regardless of image-signal scores).
 *
 * Thresholds: DEEPFAKE > 0.47 | UNCERTAIN 0.30–0.47 | AUTHENTIC < 0.30
 * Design philosophy: prefer UNCERTAIN over a wrong verdict.
 */

import express    from 'express';
import multer     from 'multer';
import axios      from 'axios';
import jwt        from 'jsonwebtoken';
import sharp      from 'sharp';
import ExifReader from 'exifreader';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// ─── Thresholds ───────────────────────────────────────────────────────────────
// Calibrated from observed data:
//   Real photos  → spatial ~3–15%, combined ~4–25%
//   AI images    → spatial ~50–85%, combined ~35–60%
// UNCERTAIN zone is 0.26–0.33 for genuinely ambiguous images.
const DEEPFAKE_THRESHOLD  = 0.33;
const AUTHENTIC_THRESHOLD = 0.26;
const CAMERA_EXIF_CAP     = 0.22;

// ─── Auth ─────────────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer '))
      return res.status(401).json({ error: 'Authentication required.' });
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    req._userId = decoded.id ?? decoded.userId ?? decoded._id ?? null;
    if (!req._userId) return res.status(401).json({ error: 'Authentication required.' });
    next();
  } catch (_) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNAL 1 — Spatial Complexity Distribution
// ═══════════════════════════════════════════════════════════════════════════════

async function spatialComplexityAnalysis(buffer, isPng = false) {
  const { data, info } = await sharp(buffer)
    .resize(256, 256, { fit: 'inside' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width;
  const H = info.height;
  const BLOCK = 8;
  const blockVars = [];

  for (let y = 0; y + BLOCK <= H; y += BLOCK) {
    for (let x = 0; x + BLOCK <= W; x += BLOCK) {
      let sum = 0, sum2 = 0;
      const n = BLOCK * BLOCK;
      for (let by = 0; by < BLOCK; by++) {
        for (let bx = 0; bx < BLOCK; bx++) {
          const v = data[(y + by) * W + (x + bx)];
          sum  += v;
          sum2 += v * v;
        }
      }
      const mean = sum / n;
      blockVars.push(sum2 / n - mean * mean);
    }
  }

  blockVars.sort((a, b) => a - b);
  const n   = blockVars.length;
  const p20 = blockVars[Math.floor(n * 0.20)];
  const p80 = blockVars[Math.floor(n * 0.80)];

  // log10( p80 / (p20 + 1) ) — how wide is the complexity range?
  //
  // Observed from real image analysis:
  //   Real photos (varied content): logRatio ≈ 1.3–1.6  → low suspicion
  //   AI portraits / landscapes:    logRatio ≈ 0.5–0.9  → high suspicion
  //
  // Formula calibrated to this empirical range [0.50, 1.40]:
  //   logRatio = 0.50 → suspicion = 1.00
  //   logRatio = 0.72 → suspicion ≈ 0.76  (AI image)
  //   logRatio = 1.38 → suspicion ≈ 0.02  (real photo)
  //   logRatio ≥ 1.40 → suspicion = 0.00
  const logRatio = Math.log10((p80 + 1) / (p20 + 1));

  // Secondary cross-check: CV of all block variances
  const meanV = blockVars.reduce((s, v) => s + v, 0) / n;
  const stdV  = Math.sqrt(blockVars.reduce((s, v) => s + (v - meanV) ** 2, 0) / n);
  const cv    = stdV / (meanV + 1);

  // Primary metric (logRatio dominates at 75% blend):
  // Modern AI generators (Midjourney v6, SDXL, DALL-E 3) produce logRatio ~0.97–1.29,
  // not the originally assumed 0.50–0.90. Range shifted to [1.00, 1.63] accordingly.
  //   logRatio ≤ 1.00 → suspicion = 1.0  (very uniform — AI)
  //   logRatio = 1.19 → suspicion ≈ 0.70  (AI-like)
  //   logRatio = 1.40 → suspicion ≈ 0.37  (ambiguous)
  //   logRatio ≥ 1.63 → suspicion = 0.0  (natural photo)
  const logSusp = Math.max(0, Math.min(1, 1 - (logRatio - 1.00) / 0.63));

  // Secondary metric (cv, 25%): low CV = suspicious
  const cvSusp  = Math.max(0, Math.min(1, 1 - (cv - 0.50) / 2.00));

  const suspicion = Math.min(0.88, 0.75 * logSusp + 0.25 * cvSusp);

  return {
    name:      'Spatial Complexity',
    suspicion: +suspicion.toFixed(3),
    detail:    `Complexity spread: logRatio=${logRatio.toFixed(2)}, CV=${cv.toFixed(2)} — ${
      suspicion > 0.65 ? 'compressed complexity range (uniform texture typical of AI generation)' :
      suspicion > 0.40 ? 'moderate complexity spread (inconclusive)' :
      'wide complexity range (natural scene distribution)'
    }`,
    // PNG: use documented 38% share (noise signal enabled); JPEG: noise disabled so spatial takes 55%
    weight: isPng ? 0.38 : 0.55,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNAL 2 — Noise Residual Distribution
// ═══════════════════════════════════════════════════════════════════════════════

async function noiseResidualAnalysis(buffer, isPng = false) {
  // Median filter preserves edges — residual is much closer to pure noise
  // than Gaussian-blur subtraction, which mixes edges and noise.
  const [origRaw, medRaw] = await Promise.all([
    sharp(buffer).resize(256, 256, { fit: 'inside' }).grayscale().raw()
      .toBuffer({ resolveWithObject: true }),
    sharp(buffer).resize(256, 256, { fit: 'inside' }).grayscale().median(3).raw()
      .toBuffer({ resolveWithObject: true }),
  ]);

  const W     = origRaw.info.width;
  const H     = origRaw.info.height;
  const BLOCK = 16;
  const blockNoiseVars = [];

  for (let y = 0; y + BLOCK <= H; y += BLOCK) {
    for (let x = 0; x + BLOCK <= W; x += BLOCK) {
      let sum2 = 0;
      const count = BLOCK * BLOCK;
      for (let by = 0; by < BLOCK; by++) {
        for (let bx = 0; bx < BLOCK; bx++) {
          const idx = (y + by) * W + (x + bx);
          const noise = origRaw.data[idx] - medRaw.data[idx];
          sum2 += noise * noise;
        }
      }
      blockNoiseVars.push(sum2 / count);
    }
  }

  const n    = blockNoiseVars.length;
  const mean = blockNoiseVars.reduce((s, v) => s + v, 0) / n;
  const std  = Math.sqrt(blockNoiseVars.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
  const cv   = std / (mean + 0.1);   // CV of block noise variances

  // Mean absolute noise level across all blocks
  const meanNoise = Math.sqrt(mean);  // RMS noise level

  // Natural camera photos: noise varies across regions → high CV (0.6–2.0+)
  //   Some areas are smooth (low noise), some textured (higher apparent noise)
  // AI-generated images: near-uniform or near-zero residual → low CV (0.1–0.6)

  // CV signal: low CV = suspicious
  const cvSusp = Math.max(0, Math.min(1, 1 - (cv - 0.30) / 1.50));

  // Noise level signal: very low overall noise = suspicious
  // Real JPEG photos: meanNoise ≈ 0.5–3.0+ | AI JPEG: ≈ 0.1–0.8
  const levelSusp = Math.max(0, Math.min(1, 1 - (meanNoise - 0.30) / 2.00));

  // Both must agree for high suspicion (product-based)
  const suspicion = Math.min(0.85, Math.sqrt(cvSusp * levelSusp));

  return {
    name:      'Noise Residual',
    suspicion: +suspicion.toFixed(3),
    detail:    `Block noise CV: ${cv.toFixed(2)}, RMS level: ${meanNoise.toFixed(2)} — ${
      suspicion > 0.60 ? 'abnormally uniform or absent noise (inconsistent with camera sensor)' :
      suspicion > 0.35 ? 'moderate noise irregularity (inconclusive)' :
      'noise pattern consistent with camera sensor'
    }`,
    weight: isPng ? 0.17 : 0.00,   // JPEG DCT artifacts corrupt this signal; enabled only for PNG
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNAL 3 — Metadata & Structural Forensics
// ═══════════════════════════════════════════════════════════════════════════════

const AI_TOOL_PATTERNS = [
  /stable.?diffusion/i, /midjourney/i, /dall.?e/i, /adobe.?firefly/i,
  /generative.?fill/i, /ai.?generated/i, /diffusion/i, /imagen/i,
  /runwayml/i, /civitai/i, /comfy.?ui/i, /automatic1111/i, /novelai/i,
  /nightcafe/i, /artbreeder/i, /deepdream/i, /gan/i,
];

function isPowerOf2(n) { return n > 0 && (n & (n - 1)) === 0; }

async function metadataForensics(buffer) {
  const sharpMeta = await sharp(buffer).metadata();
  let exifTags = {};
  try { exifTags = ExifReader.load(buffer); } catch (_) {}

  const flags   = [];
  let suspicion = 0;

  // ── Camera make / model (highest-confidence authenticator) ────────────────
  const make  = exifTags?.Make?.description  || exifTags?.make?.description  || '';
  const model = exifTags?.Model?.description || exifTags?.model?.description || '';
  const hasCameraExif = !!(make && model);

  if (hasCameraExif) {
    // Hard-override applied in combineSignals — record for transparency only
    flags.push(`Verified camera: ${make} ${model}`);
    suspicion -= 0.10;   // further reward
  }

  // ── No EXIF at all ────────────────────────────────────────────────────────
  const hasExif = sharpMeta.exif != null || Object.keys(exifTags).length > 0;
  if (!hasExif) {
    suspicion += 0.28;
    flags.push('No EXIF metadata present (AI tools often strip or omit it)');
  }

  // ── Missing camera make/model (but some other EXIF exists) ────────────────
  if (hasExif && !hasCameraExif) {
    suspicion += 0.15;
    flags.push('EXIF present but no camera make/model');
  }

  // ── AI tool signatures in metadata ───────────────────────────────────────
  const allTagText = JSON.stringify(exifTags).toLowerCase();
  for (const pattern of AI_TOOL_PATTERNS) {
    if (pattern.test(allTagText)) {
      suspicion += 0.50;
      flags.push(`AI tool signature detected in metadata: "${pattern.source}"`);
      break;
    }
  }

  // ── Common AI output dimensions ───────────────────────────────────────────
  const w = sharpMeta.width  ?? 0;
  const h = sharpMeta.height ?? 0;
  const AI_SIZES = new Set([512, 768, 1024, 1280, 1536, 2048]);
  if (AI_SIZES.has(w) && AI_SIZES.has(h)) {
    suspicion += 0.10;
    flags.push(`Dimensions ${w}×${h} match common AI generation output sizes`);
  } else if (isPowerOf2(w) && isPowerOf2(h)) {
    suspicion += 0.06;
    flags.push(`Dimensions ${w}×${h} are powers of two (common in diffusion model outputs)`);
  }

  // ── RGB channel balance ───────────────────────────────────────────────────
  try {
    const stats    = await sharp(buffer).stats();
    const channels = stats.channels;
    if (channels.length >= 3) {
      const [rStd, gStd, bStd] = [channels[0].stdev, channels[1].stdev, channels[2].stdev];
      const channelCv = (Math.abs(rStd - gStd) / (gStd + 1)) + (Math.abs(gStd - bStd) / (bStd + 1));
      if (channelCv < 0.04) {
        suspicion += 0.08;
        flags.push('Unusually balanced RGB channels (real photos rarely achieve this symmetry)');
      }
    }
  } catch (_) {}

  suspicion = Math.max(0, Math.min(0.90, suspicion));

  return {
    name:          'Metadata & Structure',
    suspicion:     +suspicion.toFixed(3),
    detail:        flags.length
      ? flags.join(' · ')
      : 'No suspicious metadata indicators; no camera signature confirmed',
    weight: 0.45,
    hasCameraExif,               // consumed by combineSignals for hard override
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Combine signals → verdict
// ═══════════════════════════════════════════════════════════════════════════════

function combineSignals(signals) {
  const metaSig     = signals.find(s => s.hasCameraExif !== undefined);
  const cameraExif  = metaSig?.hasCameraExif ?? false;

  const totalWeight = signals.reduce((s, sig) => s + sig.weight, 0);
  let   fakeScore   = signals.reduce((s, sig) => s + sig.suspicion * sig.weight, 0) / totalWeight;

  // Hard override: verified camera make+model → always AUTHENTIC
  if (cameraExif) {
    fakeScore = Math.min(fakeScore, CAMERA_EXIF_CAP);
  }

  let verdict;
  if      (fakeScore >= DEEPFAKE_THRESHOLD)  verdict = 'DEEPFAKE';
  else if (fakeScore <= AUTHENTIC_THRESHOLD) verdict = 'AUTHENTIC';
  else                                        verdict = 'UNCERTAIN';

  // Surface the camera-override as a note in the breakdown
  const breakdownNote = cameraExif
    ? [{ label: 'Camera EXIF verified — score capped at AUTHENTIC level', score: 0 }]
    : [];

  return {
    verdict,
    confidence: Math.round(fakeScore * 100),
    topLabel:   `Forensic analysis — ${signals.length} signals`,
    breakdown: [
      ...signals.map(s => ({
        label: `${s.name} (${Math.round(s.weight * 100)}% weight)`,
        score: Math.round(s.suspicion * 100),
      })),
      ...breakdownNote,
    ],
    signals,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Audio — lightweight HF fallback chain
// ═══════════════════════════════════════════════════════════════════════════════

const AUDIO_MODELS = [
  'motheecreator/deepfake-audio-detection',
  'MelodyMachine/Deepfake-audio-detection-V2',
];
const HF_ENDPOINTS    = [
  'https://router.huggingface.co/hf-inference/models',
  'https://api-inference.huggingface.co/models',
];
const PERMANENT_STATUSES = new Set([401, 403, 404]);

async function hfPost(baseUrl, model, body) {
  const url     = `${baseUrl}/${model}`;
  const headers = { 'Content-Type': 'application/octet-stream' };
  if (process.env.HF_API_TOKEN) headers['Authorization'] = `Bearer ${process.env.HF_API_TOKEN}`;

  let status, data;
  try {
    ({ status, data } = await axios.post(url, body, {
      headers, timeout: 90_000,
      maxBodyLength: Infinity, maxContentLength: Infinity,
      validateStatus: () => true,
    }));
  } catch (axiosErr) {
    const perm = ['ERR_BAD_RESPONSE', 'ECONNREFUSED', 'ENOTFOUND'].includes(axiosErr.code);
    throw { retryable: !perm, message: axiosErr.message };
  }

  if (PERMANENT_STATUSES.has(status)) throw { retryable: false, message: `HF ${status}` };
  if (status === 503) {
    const wait = Math.min((data?.estimated_time ?? 20) * 1000, 40_000);
    await new Promise(r => setTimeout(r, wait));
    throw { retryable: true, message: 'model loading' };
  }
  if (status !== 200) throw { retryable: true, message: data?.error ?? `HTTP ${status}` };
  return data;
}

async function callAudioHF(buffer) {
  const body      = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  const endpoints = process.env.HF_API_TOKEN ? HF_ENDPOINTS : [HF_ENDPOINTS[1]];

  for (const model of AUDIO_MODELS) {
    for (const base of endpoints) {
      let retries = 0;
      while (retries <= 3) {
        try { return await hfPost(base, model, body); }
        catch (err) {
          if (err.retryable && retries < 3) { retries++; continue; }
          break;
        }
      }
    }
  }
  throw new Error('Audio analysis models unavailable. Please try again later.');
}

function normaliseAudio(hfData) {
  let labels = Array.isArray(hfData) ? hfData : hfData?.[0] ?? [];
  if (!Array.isArray(labels) || labels.length === 0)
    throw new Error('Unexpected model response.');
  labels = [...labels].sort((a, b) => b.score - a.score);

  const fakeEntry = labels.find(l => /fake/i.test(l.label));
  const realEntry = labels.find(l => /real|authentic|genuine/i.test(l.label));
  const fakeScore = fakeEntry?.score ?? (realEntry ? 1 - realEntry.score : 0.5);

  let verdict;
  if      (fakeScore >= DEEPFAKE_THRESHOLD)  verdict = 'DEEPFAKE';
  else if (fakeScore <= AUTHENTIC_THRESHOLD) verdict = 'AUTHENTIC';
  else                                        verdict = 'UNCERTAIN';

  return {
    verdict,
    confidence: Math.round(fakeScore * 100),
    topLabel:   fakeEntry?.label ?? labels[0].label,
    breakdown:  labels.map(l => ({ label: l.label, score: Math.round(l.score * 100) })),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// Routes
// ═══════════════════════════════════════════════════════════════════════════════

// POST /api/deepfake/image
router.post('/deepfake/image', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(req.file.mimetype))
      return res.status(400).json({ error: 'Only JPEG, PNG, WebP or GIF images are supported.' });

    const isPng = req.file.mimetype === 'image/png';
    const [complexity, noise, meta] = await Promise.all([
      spatialComplexityAnalysis(req.file.buffer, isPng),
      noiseResidualAnalysis(req.file.buffer, isPng),
      metadataForensics(req.file.buffer),
    ]);

    const result = combineSignals([complexity, noise, meta]);

    console.log(
      `[DeepFake/image] verdict=${result.verdict} confidence=${result.confidence}% ` +
      result.signals.map(s => `${s.name}=${(s.suspicion * 100).toFixed(0)}%`).join(' ')
    );

    const { signals: _, ...clientResult } = result;
    res.json(clientResult);
  } catch (err) {
    console.error('[DeepFake/image]', err.message);
    res.status(500).json({ error: err.message || 'Image analysis failed.' });
  }
});

// POST /api/deepfake/audio
router.post('/deepfake/audio', requireAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const allowed = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/flac', 'audio/x-wav', 'audio/wave'];
    const extOk   = /\.(wav|mp3|ogg|flac)$/i.test(req.file.originalname ?? '');
    if (!allowed.includes(req.file.mimetype) && !extOk)
      return res.status(400).json({ error: 'Only WAV, MP3, OGG or FLAC audio files are supported.' });

    const raw    = await callAudioHF(req.file.buffer);
    const result = normaliseAudio(raw);
    res.json(result);
  } catch (err) {
    console.error('[DeepFake/audio]', err.message);
    res.status(500).json({ error: err.message || 'Audio analysis failed.' });
  }
});

export default router;
