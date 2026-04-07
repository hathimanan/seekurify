import React, { useState } from 'react';
import { useEffect, useRef } from 'react';
import { ShieldAlert, ShieldCheck, Search, Loader2, AlertCircle, Brain, TrendingUp, Eye, Zap } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AppSidebar from "./ui/AppSidebar";
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../services/api';
import Header from "../components/ui/Header";
import Footer from '../components/ui/Footer';
import { apiService } from '../services/api';
import { ErrorModal } from './ui/ErrorModal';


// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────

interface PhishingResult {
  headerStats?: {
    spf?: string;
    dkim?: string;
    dmarc?: string;
  };
  isAttacker: boolean;
  score: number;
  detections: string[];
}

/** NEW: structured AI analysis returned from the Anthropic-powered endpoint */
interface AIPhishingAnalysis {
  phishingProbability: number;           // 0–100
  verdict: 'SAFE' | 'SUSPICIOUS' | 'PHISHING';
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  indicators: {
    category: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  urgencyLanguage: { detected: boolean; examples: string[] };
  senderSpoofing: { detected: boolean; details: string };
  maliciousUrls: { found: boolean; urls: string[] };
  emotionalManipulation: { detected: boolean; type: string };
  recommendation: string;
  plainEnglishSummary: string;
}

type RecipientFields = {
  from: string;
  replyTo: string;
  to: string;
  cc: string;
  bcc: string;
};

interface HeaderProps {
  token: string;
  handleLogout: () => void;
  profileImage: string;
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  navigate: (path: string | number) => void;
}


// ─────────────────────────────────────────────
//  AI ANALYSIS HELPER  (calls backend API)
// ─────────────────────────────────────────────

async function runAIPhishingAnalysis(emailContent: string): Promise<AIPhishingAnalysis> {
  const response = await fetch(`${API_BASE_URL}/ai/phishing/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({ emailBody: emailContent }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `AI analysis failed (${response.status})`);
  }

  const { data } = await response.json();

  // Map PhishingAnalysisResult → AIPhishingAnalysis (UI format)
  return {
    phishingProbability: data.phishingProbability,
    verdict: data.verdict.toUpperCase() as AIPhishingAnalysis['verdict'],
    confidenceLevel: data.confidenceLevel.toUpperCase() as AIPhishingAnalysis['confidenceLevel'],
    indicators: (data.indicators || []).map((i: any) => ({
      category: i.type,
      description: i.description,
      severity: i.severity,
    })),
    urgencyLanguage: {
      detected: (data.indicators || []).some((i: any) => /urgency|fear|reward/i.test(i.type)),
      examples: (data.indicators || [])
        .filter((i: any) => /urgency|fear|reward/i.test(i.type))
        .map((i: any) => i.description),
    },
    senderSpoofing: {
      detected: data.senderAnalysis?.spoofingDetected ?? false,
      details: [
        data.senderAnalysis?.domainReputation,
        data.senderAnalysis?.displayNameMismatch ? 'display name mismatch' : '',
      ].filter(Boolean).join(' — ') || 'No issues detected',
    },
    maliciousUrls: {
      found: (data.urlAnalysis?.suspiciousUrls ?? []).length > 0,
      urls: data.urlAnalysis?.suspiciousUrls ?? [],
    },
    emotionalManipulation: {
      detected: (data.indicators || []).some((i: any) => /manipul|urgency|fear/i.test(i.type)),
      type: (data.indicators || []).find((i: any) => /manipul|urgency|fear/i.test(i.type))?.type || 'None',
    },
    recommendation: (data.recommendations ?? [])[0] || 'Exercise caution with this email.',
    plainEnglishSummary: data.explanation || '',
  };
}


// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

const severityColor = (s: 'low' | 'medium' | 'high') => {
  if (s === 'high') return 'bg-red-100 border-red-300 text-red-700';
  if (s === 'medium') return 'bg-orange-100 border-orange-300 text-orange-700';
  return 'bg-yellow-50 border-yellow-300 text-yellow-700';
};

const verdictConfig = {
  SAFE:       { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-700', icon: ShieldCheck, label: 'EMAIL LOOKS SAFE' },
  SUSPICIOUS: { bg: 'bg-orange-50',  border: 'border-orange-400',  text: 'text-orange-700',  icon: Eye,         label: 'SUSPICIOUS EMAIL' },
  PHISHING:   { bg: 'bg-red-50',     border: 'border-red-500',     text: 'text-red-700',     icon: ShieldAlert, label: 'PHISHING DETECTED' },
};


// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────

export default function PhishingDetector() {
  const [userInput, setUserInput]           = useState('');
  const [loading, setLoading]               = useState(false);
  const [aiLoading, setAiLoading]           = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [errorMessage, setErrorMessage]     = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);

  // Legacy result (rule-based backend)
  const [result, setResult] = useState<PhishingResult | null>(null);

  // NEW: AI result
  const [aiResult, setAiResult] = useState<AIPhishingAnalysis | null>(null);
  const [aiError, setAiError]   = useState<string | null>(null);

  // Recipient fields
  const [recipientAnalysis, setRecipientAnalysis] = useState<string | null>(null);
  const [fromField, setFromField]   = useState('');
  const [replyToField, setReplyToField] = useState('');
  const [toField, setToField]       = useState('');
  const [ccField, setCcField]       = useState('');
  const [bccField, setBccField]     = useState('');

  const [phishingDetectorEnabled, setPhishingDetectorEnabled] = useState(false);
  const [featuresLoaded, setFeaturesLoaded] = useState(false);

  const navigate     = useNavigate();
  const profileImage = localStorage.getItem('profileImage') || '';

  useEffect(() => {
    const fetchFeatureFlags = async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/feature-flags/read`);
        const data = await res.json();
        setPhishingDetectorEnabled(data.phishingDetectorEnabled === true);
      } catch { setPhishingDetectorEnabled(false); }
      finally  { setFeaturesLoaded(true); }
    };
    fetchFeatureFlags();
  }, []);

  const triggerError  = (msg: string) => { setErrorMessage(msg); setShowErrorModal(true); };
  const handleLogout  = () => { localStorage.removeItem('token'); navigate('/login'); };

  // ── validation ──────────────────────────────
  const validateInput = (text: string) => {
    if (!text)              { triggerError('⚠️ Please paste the email content first.'); return false; }
    if (text.length < 30)  { triggerError('⚠️ Email content is too short.'); return false; }
    const required = ['From:', 'To:', 'Subject:'];
    for (const h of required) {
      if (!text.toLowerCase().includes(h.toLowerCase())) {
        triggerError(`⚠️ Missing required header: ${h}`); return false;
      }
    }
    if (!(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g).test(text)) {
      triggerError('⚠️ No valid email addresses found.'); return false;
    }
    return true;
  };

  // ── rule-based scan (existing backend) ──────
  const handleScan = async () => {
    const text = userInput.trim();
    if (!validateInput(text)) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/detect-attacker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailContent: text }),
      });
      if (!response.ok) throw new Error('Server error');
      setResult(await response.json());
    } catch { triggerError('❌ Unable to connect. Is your backend running?'); }
    finally  { setLoading(false); }
  };

  // ── NEW: AI-powered scan ─────────────────────
  const handleAIScan = async () => {
    const text = userInput.trim();
    if (!validateInput(text)) return;
    setAiResult(null);
    setAiError(null);
    try {
      setAiLoading(true);
      const analysis = await runAIPhishingAnalysis(text);
      setAiResult(analysis);
    } catch (err) {
      console.error('AI scan failed:', err);
      setAiError('AI analysis failed. Check your API connection.');
    } finally {
      setAiLoading(false);
    }
  };

  // ── recipient field analysis (unchanged logic) ─
  const analyzeRecipients = () => {
    const data: RecipientFields = {
      from: fromField.trim(), replyTo: replyToField.trim(),
      to: toField.trim(), cc: ccField.trim(), bcc: bccField.trim(),
    };
    let analysis = `📧 EMAIL RECIPIENT ANALYSIS\n----------------------------------\n`;
    analysis += `From: ${data.from || '❌ Missing'}\nReply-To: ${data.replyTo || 'Not provided'}\nTo: ${data.to || '❌ Missing'}\nCC: ${data.cc || 'None'}\nBCC: ${data.bcc || 'None'}\n\n`;
    if (!data.from) analysis += '⚠️ Missing From field — suspicious sender.\n';
    else if (data.replyTo && data.replyTo !== data.from) analysis += '⚠️ Reply-To differs from From — possible spoof.\n';
    else analysis += '✅ From and Reply-To seem consistent.\n';
    if (!data.to)  analysis += '⚠️ Missing To field — mass mailing.\n';
    if (data.cc)   analysis += '⚠️ CC used — verify recipients.\n';
    if (data.bcc)  analysis += '⚠️ BCC detected — hidden recipients.\n';
    setRecipientAnalysis(analysis);
  };

  const getStatusColor = (status = 'NOT FOUND') => {
    const s = status.toUpperCase();
    if (s === 'PASS') return 'text-emerald-500 bg-emerald-50 border-emerald-200';
    if (s === 'FAIL') return 'text-red-500 bg-red-50 border-red-200';
    return 'text-slate-400 bg-slate-50 border-slate-200';
  };

  const resetAll = () => {
    setResult(null); setAiResult(null); setAiError(null);
    setUserInput(''); setRecipientAnalysis(null);
  };

  // ─────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col">

      <Header
        token={localStorage.getItem('token') || ''}
        handleLogout={handleLogout}
        profileImage={profileImage}
      />

      <div className="flex flex-1 overflow-hidden">

        <AppSidebar sidebarExpanded={sidebarExpanded} setSidebarExpanded={setSidebarExpanded} />

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mb-6 text-white/80 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="max-w-4xl mx-auto space-y-6">

            {/* ── Title Card ── */}
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                  <ShieldAlert className="text-indigo-400 w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Phishing Detector</h2>
                  <p className="text-indigo-300 text-sm font-medium flex items-center gap-1">
                    <Brain className="w-3 h-3" /> AI-Powered NLP Analysis
                  </p>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed mt-3">
                In Gmail: Open email → Three dots (⋮) → "Show original" → Copy the full content and paste below.
              </p>
            </div>

            {/* ── Input Card ── */}
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Paste full email including headers (From, To, Subject, body)…"
                className="w-full h-52 p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
              />

              {/* ── Two scan buttons ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">

                {/* Rule-based (existing) */}
                <button
                  onClick={handleScan}
                  disabled={loading || !userInput.trim()}
                  className="h-12 text-sm font-bold bg-slate-800 text-white rounded-xl shadow hover:bg-slate-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="animate-spin w-4 h-4" /> Scanning…</> : <><Search className="w-4 h-4" /> Rule-Based Scan</>}
                </button>

                {/* AI-powered (NEW) */}
                <button
                  onClick={handleAIScan}
                  disabled={aiLoading || !userInput.trim()}
                  className="h-12 text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl shadow hover:from-indigo-700 hover:to-violet-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {aiLoading
                    ? <><Loader2 className="animate-spin w-4 h-4" /> AI Analyzing…</>
                    : <><Brain className="w-4 h-4" /> AI-Powered Analysis</>}
                </button>
              </div>

              {(result || aiResult) && (
                <button onClick={resetAll} className="mt-3 text-sm font-semibold text-indigo-600 hover:underline block">
                  Reset Scan
                </button>
              )}
            </div>


            {/* ══════════════════════════════════════
                 AI RESULT SECTION (NEW)
            ══════════════════════════════════════ */}
            <AnimatePresence>
              {aiError && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm"
                >
                  ⚠️ {aiError}
                </motion.div>
              )}

              {aiResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* AI badge */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      <Brain className="w-3 h-3" /> AI Analysis Result
                    </div>
                    <span className="text-xs text-gray-500">Confidence: {aiResult.confidenceLevel}</span>
                  </div>

                  {/* ── Main Verdict Card ── */}
                  {(() => {
                    const cfg = verdictConfig[aiResult.verdict];
                    const Icon = cfg.icon;
                    return (
                      <div className={`${cfg.bg} border-2 ${cfg.border} rounded-2xl p-6`}>
                        <div className="flex items-center gap-4 mb-4">
                          <Icon className={`w-10 h-10 ${cfg.text}`} />
                          <div>
                            <h3 className={`text-xl font-black ${cfg.text}`}>{cfg.label}</h3>
                            <p className="text-gray-500 text-sm mt-0.5">{aiResult.plainEnglishSummary}</p>
                          </div>
                        </div>

                        {/* Probability bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-gray-500">
                            <span>Phishing Probability</span>
                            <span>{aiResult.phishingProbability}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${aiResult.phishingProbability}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={`h-3 rounded-full ${
                                aiResult.phishingProbability >= 70
                                  ? 'bg-red-500'
                                  : aiResult.phishingProbability >= 40
                                  ? 'bg-orange-400'
                                  : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                        </div>

                        {/* Recommendation */}
                        <div className="mt-4 p-3 bg-white/60 rounded-xl border border-white/80">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Recommended Action</p>
                          <p className="text-sm font-semibold text-gray-800">{aiResult.recommendation}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* ── Signal Cards Row ── */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      {
                        label: 'Urgency Language',
                        detected: aiResult.urgencyLanguage.detected,
                        detail: aiResult.urgencyLanguage.examples.slice(0, 1).join(', ') || 'None found',
                        icon: <Zap className="w-4 h-4" />,
                      },
                      {
                        label: 'Sender Spoofing',
                        detected: aiResult.senderSpoofing.detected,
                        detail: aiResult.senderSpoofing.details,
                        icon: <Eye className="w-4 h-4" />,
                      },
                      {
                        label: 'Malicious URLs',
                        detected: aiResult.maliciousUrls.found,
                        detail: aiResult.maliciousUrls.urls.slice(0, 1).join('') || 'None found',
                        icon: <Search className="w-4 h-4" />,
                      },
                      {
                        label: 'Manipulation',
                        detected: aiResult.emotionalManipulation.detected,
                        detail: aiResult.emotionalManipulation.type || 'None detected',
                        icon: <AlertCircle className="w-4 h-4" />,
                      },
                    ].map((signal) => (
                      <div
                        key={signal.label}
                        className={`p-3 rounded-xl border text-center ${
                          signal.detected
                            ? 'bg-red-50 border-red-200'
                            : 'bg-emerald-50 border-emerald-200'
                        }`}
                      >
                        <div className={`flex justify-center mb-1 ${signal.detected ? 'text-red-500' : 'text-emerald-500'}`}>
                          {signal.icon}
                        </div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{signal.label}</p>
                        <p className={`text-xs font-black mt-1 ${signal.detected ? 'text-red-600' : 'text-emerald-600'}`}>
                          {signal.detected ? 'DETECTED' : 'CLEAR'}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 truncate" title={signal.detail}>{signal.detail}</p>
                      </div>
                    ))}
                  </div>

                  {/* ── Indicators List ── */}
                  {aiResult.indicators.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-5">
                      <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Detected Indicators
                      </h4>
                      <div className="space-y-2">
                        {aiResult.indicators.map((ind, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${severityColor(ind.severity)}`}
                          >
                            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/50 shrink-0">
                              {ind.severity}
                            </span>
                            <div>
                              <span className="font-bold">{ind.category}: </span>
                              {ind.description}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>


            {/* ══════════════════════════════════════
                 LEGACY RULE-BASED RESULT (unchanged)
            ══════════════════════════════════════ */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow border border-gray-100 p-6 space-y-6"
                >
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Rule-Based Scan Result</p>

                  {/* SPF / DKIM / DMARC */}
                  <div className="grid grid-cols-3 gap-4">
                    {(['SPF', 'DKIM', 'DMARC'] as const).map((h) => {
                      const key = h.toLowerCase() as 'spf' | 'dkim' | 'dmarc';
                      return (
                        <div key={h} className={`p-4 rounded-xl border text-center shadow-sm ${getStatusColor(result.headerStats?.[key])}`}>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{h}</p>
                          <p className="text-lg font-black">{result.headerStats?.[key] ?? 'N/A'}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Risk card */}
                  <div className={`p-6 rounded-2xl border-4 ${result.isAttacker ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
                    <div className="flex items-center gap-4 mb-4">
                      {result.isAttacker ? <ShieldAlert size={40} className="text-red-500" /> : <ShieldCheck size={40} className="text-green-500" />}
                      <div>
                        <h3 className={`text-xl font-black ${result.isAttacker ? 'text-red-800' : 'text-green-800'}`}>
                          {result.isAttacker ? 'CYBER ATTACK LIKELY' : 'EMAIL LOOKS SAFE'}
                        </h3>
                        <div className="w-full bg-gray-200 h-2 rounded-full mt-2 w-48">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${result.score}%` }}
                            className={`h-full rounded-full ${result.isAttacker ? 'bg-red-500' : 'bg-green-500'}`}
                          />
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mt-1">Risk Score: {result.score}%</p>
                      </div>
                    </div>

                    {result.detections.length === 0
                      ? <p className="text-sm italic text-gray-500">No suspicious indicators found.</p>
                      : result.detections.map((note, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow border mb-2">
                            <AlertCircle className={result.isAttacker ? 'text-red-500' : 'text-green-500'} size={16} />
                            <span className="text-sm">{note}</span>
                          </div>
                        ))
                    }
                  </div>

                  {result.score > 50 && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                      <div className="bg-white rounded-2xl p-8 w-96 shadow-2xl border-4 border-red-500">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">🚨 Phishing Risk Detected</h2>
                        <p className="text-sm text-gray-600 mb-4">This email appears malicious. Do NOT click any links or enter credentials.</p>
                        <button onClick={() => setResult(null)} className="w-full bg-red-600 text-white py-2 rounded-xl hover:bg-red-700">Dismiss</button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>


            {/* ── Recipient Header Fields (unchanged) ── */}
            <div className="bg-white rounded-2xl shadow border border-gray-100 p-6">
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-4">Analyze Email Header Fields</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'From:', value: fromField,    setter: setFromField,    placeholder: 'sender@example.com' },
                  { label: 'Reply-To:', value: replyToField, setter: setReplyToField, placeholder: 'reply@example.com' },
                  { label: 'To:', value: toField,       setter: setToField,      placeholder: 'recipient@example.com' },
                  { label: 'CC:', value: ccField,       setter: setCcField,      placeholder: 'cc@example.com' },
                  { label: 'BCC:', value: bccField,     setter: setBccField,     placeholder: 'bcc@example.com' },
                ].map(({ label, value, setter, placeholder }) => (
                  <div key={label}>
                    <label className="text-xs font-semibold text-gray-500 block mb-1">{label}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={placeholder}
                      className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={analyzeRecipients}
                disabled={!fromField.trim() && !toField.trim()}
                className="w-full h-11 mt-4 text-sm font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Analyze Header Fields
              </button>

              {recipientAnalysis && (
                <div className="mt-4 p-4 border rounded-xl bg-gray-50 font-mono text-xs whitespace-pre-wrap text-gray-700">
                  {recipientAnalysis}
                </div>
              )}
            </div>

          </div>{/* /max-w-4xl */}
        </div>{/* /main content */}
      </div>{/* /flex */}

      {showErrorModal && <ErrorModal message={errorMessage} onClose={() => setShowErrorModal(false)} />}
      <Footer />
    </div>
  );
}











































// import React, { useState } from 'react';
// import { useEffect, useRef } from 'react';
// import { ShieldAlert, ShieldCheck, Search, Loader2, AlertCircle } from 'lucide-react';
// import { ArrowLeft } from 'lucide-react';
// import { FileSearch, KeyRound, BarChart3, Phone } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Button } from './ui/button';
// import { API_BASE_URL } from '../services/api';
// import Header from "../components/ui/Header";
// import Footer from '../components/ui/Footer';
// import { apiService } from '../services/api';
// import { ErrorModal } from './ui/ErrorModal';


// interface PhishingResult {
//   headerStats?: {
//     spf?: string;
//     dkim?: string;
//     dmarc?: string;
//   };
//   isAttacker: boolean;
//   score: number;
//   detections: string[];
  
// }


// interface HeaderProps {
//     token: string;
//     handleLogout: () => void;
//     profileImage: string;
//     sidebarExpanded: boolean;
//     setSidebarExpanded: (expanded: boolean) => void;
//     navigate: (path: string | number) => void;
// }




// export default function PhishingDetector() {
// const [userInput, setUserInput] = useState("");
//     const [loading, setLoading] = useState(false);
//   const [sidebarExpanded, setSidebarExpanded] = useState(true);

// const [errorMessage, setErrorMessage] = useState("");
// const [showErrorModal, setShowErrorModal] = useState(false);



// const [analysisResult, setAnalysisResult] = useState("");

// const navigate = useNavigate();
// const profileImage = localStorage.getItem("profileImage") || "";

// const [recipientData, setRecipientData] = useState<RecipientFields | null>(null);
// const [recipientAnalysis, setRecipientAnalysis] = useState<string | null>(null);

// const [fromField, setFromField] = useState("");
// const [replyToField, setReplyToField] = useState("");
// const [toField, setToField] = useState("");
// const [ccField, setCcField] = useState("");
// const [bccField, setBccField] = useState("");
//   const [phishingDetectorEnabled, setPhishingDetectorEnabled] = useState<boolean>(false);
//   const [featuresLoaded, setFeaturesLoaded] = useState(false);
// const [result, setResult] = useState<PhishingResult | null>(null);

// type RecipientFields = {
//   from: string;
//   replyTo: string;
//   to: string;
//   cc: string;
//   bcc: string;
// };

// useEffect(() => {
//     const fetchFeatureFlags = async () => {
//       try {
//         const res = await fetch(`${API_BASE_URL}/feature-flags/read`);
        
//         if (!res.ok) {
//           throw new Error('Failed to fetch feature flags');
//         }
        
//         const data = await res.json();
        
//         console.log('✅ Header feature flags loaded:', data);
//         setPhishingDetectorEnabled(data.phishingDetectorEnabled === true);
        
//       } catch (err) {
//         console.error("❌ Failed to load header feature flags:", err);
//         setPhishingDetectorEnabled(false); // Safe default
//       } finally {
//         setFeaturesLoaded(true);
//       }
//     };

//     fetchFeatureFlags();
//   }, []);



// const triggerError = (msg: string) => {
//   setErrorMessage(msg);
//   setShowErrorModal(true);
// };



// const handleLogout = () => {    
//     localStorage.removeItem("token");
//     navigate("/login");
// }





// const analyzeRecipients = () => {
//   // Save structured data for future logic
//   const data: RecipientFields = {
//     from: fromField.trim(),
//     replyTo: replyToField.trim(),
//     to: toField.trim(),
//     cc: ccField.trim(),
//     bcc: bccField.trim(),
//   };

//   setRecipientData(data);

//   // Build analysis report
//   let analysis = `📧 EMAIL RECIPIENT ANALYSIS\n`;
//   analysis += `----------------------------------\n`;
//   analysis += `From: ${data.from || "❌ Missing"}\n`;
//   analysis += `Reply-To: ${data.replyTo || "Not provided"}\n`;
//   analysis += `To: ${data.to || "❌ Missing"}\n`;
//   analysis += `CC: ${data.cc || "None"}\n`;
//   analysis += `BCC: ${data.bcc || "None"}\n\n`;

//   // FROM field checks
//   if (!data.from) {
//     analysis += "⚠️ Missing 'From' field — suspicious sender.\n";
//   } else if (data.replyTo && data.replyTo !== data.from) {
//     analysis += "⚠️ Reply-To differs from From — possible spoof attempt.\n";
//   } else {
//     analysis += "✅ From and Reply-To seem consistent.\n";
//   }

//   // TO checks
//   if (!data.to) {
//     analysis += "⚠️ Missing 'To' field — mass / automated mailing.\n";
//   }

//   // CC checks
//   if (data.cc) {
//     analysis += "⚠️ CC used — verify unknown recipients.\n";
//   }

//   // BCC checks
//   if (data.bcc) {
//     analysis += "⚠️ BCC detected — hidden recipients or bulk sending.\n";
//   }


//   const suspiciousIndicators: string[] = [];

//   // Basic email regex (RFC-compliant enough for validation)
//   const emailRegex =
//     /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

//   const checkEmail = (label: string, email: string | undefined) => {
//     if (!email) return;

//     analysis += `\n🔍 Checking ${label}: ${email}\n`;

//     // 1. Basic validity
//     if (!emailRegex.test(email)) {
//       analysis += "❌ Invalid email format.\n";
//       suspiciousIndicators.push(`${label}: invalid format`);
//       return;
//     } else {
//       analysis += "✅ Valid email format.\n";
//     }

//     // Extract parts
//     const [localPart, domain] = email.split("@");

//     // 2. Suspicious local-part patterns
//     if (/^[0-9a-fA-F]{12,}$/.test(localPart)) {
//       analysis += "⚠️ Local part appears randomly generated.\n";
//       suspiciousIndicators.push(`${label}: random local part`);
//     }

//     if (localPart.length <= 2) {
//       analysis += "⚠️ Very short local part — could be a throwaway.\n";
//       suspiciousIndicators.push(`${label}: short local part`);
//     }

//     // 3. Domain analysis
//     if (domain.split(".").length < 2) {
//       analysis += "❌ Invalid domain structure.\n";
//       suspiciousIndicators.push(`${label}: invalid domain`);
//     }

//     // Detect unusual/random subdomain
//     const domainParts = domain.split(".");
//     const subdomain = domainParts.length > 2 ? domainParts[0] : null;

//     if (subdomain && /^[a-zA-Z0-9]{10,}$/.test(subdomain)) {
//       analysis += "⚠️ Random-looking subdomain detected.\n";
//       suspiciousIndicators.push(`${label}: random subdomain`);
//     }

//     // Detect suspicious keyword domains
//     const riskyKeywords = [
//       "mailgun", "proton", "shadow", "temp", "throw",
//       "inbox", "anon", "spam", "trk", "click", "track",
//       "secure-mail", "trap", "bot"
//     ];

//     if (riskyKeywords.some(k => domain.includes(k))) {
//       analysis += "⚠️ Domain contains risky keywords.\n";
//       suspiciousIndicators.push(`${label}: risky keyword in domain`);
//     }

//     // 4. TLD-based suspicious flags
//     const riskyTlds = ["zip", "lol", "click", "work", "monster", "xyz"];
//     const tld = domainParts[domainParts.length - 1];

//     if (riskyTlds.includes(tld)) {
//       analysis += `⚠️ Risky TLD (.${tld}) often used in phishing.\n`;
//       suspiciousIndicators.push(`${label}: risky TLD`);
//     }

//     analysis += "----------------------------------\n";
//   };

//   // Run the validator on each field
//   checkEmail("From", data.from);
//   checkEmail("Reply-To", data.replyTo);
//   checkEmail("To", data.to);
//   if (data.cc) checkEmail("CC", data.cc);
//   if (data.bcc) checkEmail("BCC", data.bcc);

//   // Add final verdict
//   if (suspiciousIndicators.length > 0) {
//     analysis += "\n🚨 OVERALL VERDICT: SUSPICIOUS EMAIL DETECTED\n";
//     analysis += "Reasons:\n";
//     suspiciousIndicators.forEach(r => (analysis += `- ${r}\n`));
//   } else {
//     analysis += "\n✅ OVERALL VERDICT: Email recipients appear safe.\n";
//   }

//   // Store final text for UI display
//   setRecipientAnalysis(analysis);
// };





// const handleScan = async () => {
//   const text = userInput.trim();

//   // 1️⃣ Basic empty check
//   if (!text) {
//     return triggerError("⚠️ Please paste the email content first.");
//   }

//   // 2️⃣ Minimum length check
//   if (text.length < 30) {
//     return triggerError("⚠️ Email content is too short. Paste full headers + body.");
//   }

//   // 3️⃣ Required header checks
//   const requiredHeaders = ["From:", "To:", "Subject:"];
//   for (const header of requiredHeaders) {
//     if (!text.toLowerCase().includes(header.toLowerCase())) {
//       return triggerError(`⚠️ Missing required header: ${header}`);
//     }
//   }

//   // 4️⃣ Detect at least one valid email pattern
//   const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g;
//   const foundEmails = text.match(emailRegex);

//   if (!foundEmails || foundEmails.length === 0) {
//     return triggerError("⚠️ No valid email addresses found in the content.");
//   }

// // 5️⃣ Detect suspicious broken headers (more precise)
// const brokenHeaderRegex = /^(from|to|subject)\s*[^:]/im;
// if (brokenHeaderRegex.test(text)) {
//   return triggerError("⚠️ Email headers seem malformed or manipulated (possible spoofing).");
// }

//   try {
//     setLoading(true);

//     const response = await fetch(`${API_BASE_URL}/detect-attacker`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ emailContent: text }),
//     });

//     if (!response.ok) throw new Error("Server error");

//     const data = await response.json();
//     setResult(data);

//   } catch (err) {
//     console.error("Failed:", err);
//     triggerError("❌ Unable to connect. Is your backend running?");
//   } finally {
//     setLoading(false);
//   }
// };


//     const getStatusColor = (status: string = 'NOT FOUND') => {
//         const s = status.toUpperCase();
//         if (s === 'PASS') return 'text-emerald-500 bg-emerald-50 border-emerald-200';
//         if (s === 'FAIL') return 'text-red-500 bg-red-50 border-red-200';
//         return 'text-slate-400 bg-slate-50 border-slate-200';
//     };


//     return (
//   <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col">

//     {/* Header */}
//     <Header
//       token={localStorage.getItem("token") || ""}
//       handleLogout={handleLogout}
//       profileImage={profileImage}
//       sidebarExpanded={sidebarExpanded}
//       setSidebarExpanded={setSidebarExpanded}
//     />

//     <div className="flex flex-1 overflow-hidden">

//       {/* Sidebar */}
//         <motion.aside
//           initial={false}
//           animate={{ width: sidebarExpanded ? "18rem" : "4rem" }}
//           transition={{ type: "spring", stiffness: 260, damping: 30 }}
//           className="bg-gradient-to-b from-gray-800 to-gray-900 text-white p-4 flex flex-col"
//         >
//           {[
//             { label: "Analyze Malware", path: "/malware-analysis", icon: <FileSearch className="w-5 h-5" /> },
//             { label: "Password Manager", path: "/dashboard", icon: <KeyRound className="w-5 h-5" /> },
//             { label: "System Events Dashboard", path: "/siem-dashboard", icon: <BarChart3 className="w-5 h-5" /> },
//             { label: "Security Awareness", path: "/securityAwareness", icon: <ShieldCheck className="w-5 h-5" /> },
//             { label: "Contact Us", path: "/contact", icon: <Phone className="w-5 h-5" /> },
// ...(phishingDetectorEnabled ? [
//       { label: "Phishing Detector", path: "/detect-attacker", icon: <ShieldAlert className="w-5 h-5" /> }
//     ] : [])
//             ].map(({ label, path, icon }) => (
//             <div
//               key={path}
//               onClick={() => navigate(path)}
//               className="relative group flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-indigo-600 transition cursor-pointer"
//             >
//               {icon}
//               {sidebarExpanded && <span className="truncate">{label}</span>}

//               {!sidebarExpanded && (
//                 <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
//                   {label}
//                 </span>
//               )}
//             </div>
//           ))}
//         </motion.aside>

//       {/* Page Content */}
//       <div className="flex-1 p-6 overflow-y-auto">

//         {/* Back Button */}
//         <button
//           onClick={() => navigate(-1)}
//           className="flex items-center gap-2 mb-6 text-white bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 rounded-lg shadow-md hover:scale-105 transition-transform"
//         >
//           <ArrowLeft className="w-5 h-5" /> Back
//         </button>

//         <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200 max-w-4xl mx-auto">

//           {/* Title */}
//           <h2 className="text-3xl font-black tracking-tight flex items-center gap-2 mb-2">
//             <ShieldAlert className="text-blue-600" size={36} /> Phishing Detector
//           </h2>
// <p className="text-gray-500 text-sm mb-6">
//   To check the full original email content in Gmail:<br />
//   1. Open Gmail and click the email you want to inspect.<br />
//   2. Click the three vertical dots (⋮) next to the Reply button.<br />
//   3. Select "Show original".<br />
//   4. A new tab will open showing full email headers (SPF/DKIM/DMARC results).<br />
//   5. Scroll down to see the raw message body (HTML + text).<br />
//   6. Copy the entire content and paste it here for analysis.
// </p>



//           {/* Textarea */}
//           <textarea
//             value={userInput}
//             onChange={(e) => setUserInput(e.target.value)}
//             placeholder="Paste full email including headers…"
//             className="w-full h-64 p-5 rounded-2xl border border-gray-300 bg-gray-50 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
//           />

//           {/* Scan Button */}
//         <button
//   onClick={handleScan}
//   disabled={loading || !userInput.trim()}
//   className=" w-full h-14 mt-4 text-lg font-bold 
//     bg-blue-600 text-white rounded-xl shadow-md 
//     transition
//     hover:bg-blue-700
//     disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
// >
//   {loading ? (
//     <span className="flex items-center justify-center gap-2">
//       <Loader2 className="animate-spin" /> Scanning…
//     </span>
//   ) : (
//     "Analyze Email Body"
//   )}
// </button>



// {/* Reset */}
// {result && (
//   <button
//     onClick={() => { setResult(null); setUserInput(""); setRecipientAnalysis(null); }}
//     className="mt-3 text-sm font-semibold text-blue-600 hover:underline text-right block"
//   >
//     Reset Scan
//   </button>
// )}

//           {/* Results Section */}
//           <AnimatePresence>
//             {result && (
//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className="mt-10 space-y-6"
//               >
                
//                 {/* Header Authentication Status */}
//                 <div className="grid grid-cols-3 gap-4">
//                   {["SPF", "DKIM", "DMARC"].map((h) => {
// const key = h.toLowerCase() as "spf" | "dkim" | "dmarc";
//                     return (
//                       <div
//                         key={h}
//                         className={`p-4 rounded-xl border text-center shadow-sm ${getStatusColor(result.headerStats?.[key])}`}
//                       >
//                         <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{h}</p>
//                         <p className="text-lg font-black">{result.headerStats?.[key] ?? "N/A"}</p>
//                       </div>
//                     );
//                   })}
//                 </div>

//                 {/* Main Risk Card */}
//                 <div className={`p-8 rounded-3xl border-4 shadow-xl ${result.isAttacker ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
                  
//                   <div className="flex flex-col md:flex-row items-center gap-6">
                    
//                     <div className={`p-6 rounded-2xl shadow-inner ${result.isAttacker ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
//                       {result.isAttacker ? <ShieldAlert size={48} /> : <ShieldCheck size={48} />}
//                     </div>

//                     <div className="flex-1 space-y-3">
//                       <h3 className={`text-2xl font-black ${result.isAttacker ? 'text-red-800' : 'text-green-800'}`}>
//                         {result.isAttacker ? "CYBER ATTACK LIKELY" : "EMAIL LOOKS SAFE"}
//                       </h3>

//                       <div className="w-full bg-gray-200 h-2 rounded-full">
//                         <motion.div
//                           initial={{ width: 0 }}
//                           animate={{ width: `${result.score}%` }}
//                           className={`h-full rounded-full ${result.isAttacker ? 'bg-red-500' : 'bg-green-500'}`}
//                         />
//                       </div>

//                       <p className="text-sm font-semibold text-gray-600">
//                         Risk Score: {result.score}%
//                       </p>
//                     </div>

//                   </div>

//                   {/* Analysis Logs */}
//                   <div className="mt-8 border-t pt-6 space-y-3">
//                     <h4 className="text-xs font-black text-gray-500 uppercase">Analysis Logs</h4>

//                     {result.detections.length === 0 ? (
//                       <p className="text-sm text-gray-600 italic">No suspicious indicators found.</p>
//                     ) : (
//                       result.detections.map((note, index) => (
//                         <motion.div
//                           key={index}
//                           initial={{ opacity: 0, x: -10 }}
//                           animate={{ opacity: 1, x: 0 }}
//                           transition={{ delay: index * 0.05 }}
//                           className="flex items-center gap-3 p-4 bg-white rounded-xl shadow border"
//                         >
//                           <AlertCircle className={result.isAttacker ? "text-red-500" : "text-green-500"} />
//                           <span className="text-sm font-medium">{note}</span>
//                         </motion.div>
//                       ))
//                     )}



//                     {result?.score > 50 && (
//   <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
//     <div className="bg-white rounded-2xl p-8 w-96 shadow-2xl border-4 border-red-500">
//       <h2 className="text-2xl font-bold text-red-600 mb-4">
//         🚨 Phishing Risk Detected
//       </h2>
//       <p className="text-sm text-gray-600 mb-4">
//         This page appears malicious. Do NOT enter credentials.
//       </p>
//       <button
//         onClick={() => window.close()}
//         className="w-full bg-red-600 text-white py-2 rounded-xl hover:bg-red-700"
//       >
//         Close Tab
//       </button>
//     </div>
//   </div>
// )}
//                   </div>

//                 </div>

//               </motion.div>
//             )}
//           </AnimatePresence>




// {/* Header Fields */}
// <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

//   <div>
//     <label className="text-sm font-semibold">From:</label>
//     <input
//       type="text"
//       value={fromField}
//       onChange={(e) => setFromField(e.target.value)}
//       placeholder="sender@example.com"
//       className="w-full p-3 rounded-xl border border-gray-300 bg-white text-sm"
//     />
//   </div>

//   <div>
//     <label className="text-sm font-semibold">Reply-To:</label>
//     <input
//       type="text"
//       value={replyToField}
//       onChange={(e) => setReplyToField(e.target.value)}
//       placeholder="reply@example.com"
//       className="w-full p-3 rounded-xl border border-gray-300 bg-white text-sm"
//     />
//   </div>

//   <div>
//     <label className="text-sm font-semibold">To:</label>
//     <input
//       type="text"
//       value={toField}
//       onChange={(e) => setToField(e.target.value)}
//       placeholder="recipient@example.com"
//       className="w-full p-3 rounded-xl border border-gray-300 bg-white text-sm"
//     />
//   </div>

//   <div>
//     <label className="text-sm font-semibold">CC:</label>
//     <input
//       type="text"
//       value={ccField}
//       onChange={(e) => setCcField(e.target.value)}
//       placeholder="cc1@example.com, cc2@example.com"
//       className="w-full p-3 rounded-xl border border-gray-300 bg-white text-sm"
//     />
//   </div>

//   <div>
//     <label className="text-sm font-semibold">BCC:</label>
//     <input
//       type="text"
//       value={bccField}
//       onChange={(e) => setBccField(e.target.value)}
//       placeholder="bcc@example.com"
//       className="w-full p-3 rounded-xl border border-gray-300 bg-white text-sm"
//     />
//   </div>
// </div>



// <button
//   onClick={analyzeRecipients}
//  disabled={!fromField.trim() && !toField.trim()}

//   className="w-full h-12 mt-3 text-md font-semibold bg-gray-200 text-gray-800 rounded-xl shadow-sm hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
// >
//   Analyze Email Header Fields
// </button>



// {/* Separate Analyze To/CC/BCC Button */}




// {recipientAnalysis && (
//   <div className="mt-5 p-4 border rounded-xl bg-gray-100 font-mono text-sm whitespace-pre-wrap">
//     {recipientAnalysis}
//   </div>
// )}

// {showErrorModal && (
// <ErrorModal
//   message={errorMessage}
//   onClose={() => setShowErrorModal(false)}
// />
// )}



//         </div>
//       </div>
//     </div>

//     <Footer />
//   </div>
// );
// }
