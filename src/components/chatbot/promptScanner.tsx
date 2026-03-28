// PromptScanner.tsx
// Main component — paste prompt, get privacy risk analysis
// Stack: React + TypeScript + TailwindCSS (matches Seekurify existing stack)

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usePromptScanner } from "./usePromptScanner";
import { DETECTORS, Severity } from "./detectors";
import { Shield, AlertTriangle, CheckCircle, Copy, RotateCcw, Zap, FileSearch, KeyRound, BarChart3, ShieldCheck, Phone, ShieldAlert } from "lucide-react";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../../services/api";

// ─── Sub-components ───────────────────────────────────────────────────────────

const RiskBadge: React.FC<{ level: "safe" | "moderate" | "high"; score: number }> = ({
  level,
  score,
}) => {
  const config = {
    safe: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-800",
      score: "text-emerald-700",
      label: "Low Risk",
      icon: <CheckCircle size={18} className="text-emerald-600" />,
    },
    moderate: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-800",
      score: "text-amber-700",
      label: "Moderate Risk",
      icon: <AlertTriangle size={18} className="text-amber-600" />,
    },
    high: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-800",
      score: "text-red-700",
      label: "High Risk",
      icon: <AlertTriangle size={18} className="text-red-600" />,
    },
  } as const;

  const c = config[level];
  return (
    <div className={`flex items-center gap-4 rounded-xl border px-5 py-4 ${c.bg}`}>
      <div className="text-center">
        <div className={`text-3xl font-semibold ${c.score}`}>{score}</div>
        <div className="text-xs text-gray-500 mt-0.5">/ 100</div>
      </div>
      <div className="w-px h-10 bg-gray-200" />
      <div className="flex items-center gap-2">
        {c.icon}
        <div>
          <div className={`font-medium text-sm ${c.text}`}>{c.label}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {level === "safe"
              ? "No critical data detected"
              : level === "moderate"
              ? "Some sensitive patterns found"
              : "Sensitive data detected — review before sending"}
          </div>
        </div>
      </div>
    </div>
  );
};

const SeverityDot: React.FC<{ severity: Severity; triggered: boolean }> = ({
  severity,
  triggered,
}) => {
  if (!triggered) return <span className="inline-block w-2 h-2 rounded-full bg-gray-200" />;
  const colors = {
    critical: "bg-red-500",
    warning: "bg-amber-400",
    info: "bg-blue-400",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[severity]}`} />;
};

const FlagGrid: React.FC<{ hits: ReturnType<typeof import("./detectors").runLocalScan>["hits"] }> = ({
  hits,
}) => {
  const hitMap = new Map(hits.map((h) => [h.detector.id, h]));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {DETECTORS.map((d) => {
        const hit = hitMap.get(d.id);
        const triggered = !!hit;
        const cardStyle = triggered
          ? d.severity === "critical"
            ? "border-red-200 bg-red-50"
            : d.severity === "warning"
            ? "border-amber-200 bg-amber-50"
            : "border-blue-200 bg-blue-50"
          : "border-gray-100 bg-gray-50";

        return (
          <div
            key={d.id}
            className={`rounded-lg border px-3 py-2.5 ${cardStyle}`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <SeverityDot severity={d.severity} triggered={triggered} />
              <span className="text-xs font-medium text-gray-700 truncate">
                {d.label}
              </span>
            </div>
            <div
              className={`text-xs ${
                triggered
                  ? d.severity === "critical"
                    ? "text-red-600"
                    : "text-amber-600"
                  : "text-gray-400"
              }`}
            >
              {triggered ? `Detected (${hit!.count})` : "Clear"}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const PromptScanner: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { state, scan, reset } = usePromptScanner();
  const navigate = useNavigate();

  const [profileImage, setProfileImage] = useState("");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [phishingDetectorEnabled, setPhishingDetectorEnabled] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved === "true") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    const fetchFeatureFlags = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/feature-flags/read`);
        if (!res.ok) throw new Error("Failed to fetch feature flags");
        const data = await res.json();
        setPhishingDetectorEnabled(data.phishingDetectorEnabled === true);
      } catch {
        setPhishingDetectorEnabled(false);
      }
    };
    fetchFeatureFlags();
  }, []);

  useEffect(() => {
    if (!token) return;
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.profileImage) setProfileImage(data.profileImage);
      } catch {}
    };
    fetchProfile();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  };

  const navItems = [
    { label: "Analyze Malware", path: "/malware-analysis", icon: <FileSearch className="w-5 h-5" /> },
    { label: "Password Manager", path: "/dashboard", icon: <KeyRound className="w-5 h-5" /> },
    { label: "System Events Dashboard", path: "/siem-dashboard", icon: <BarChart3 className="w-5 h-5" /> },
    { label: "Security Awareness", path: "/securityAwareness", icon: <ShieldCheck className="w-5 h-5" /> },
    { label: "Contact Us", path: "/contact", icon: <Phone className="w-5 h-5" /> },
    { label: "Prompt Scanner", path: "/prompt-scanner", icon: <Shield className="w-5 h-5" /> },
    ...(phishingDetectorEnabled
      ? [{ label: "Phishing Detector", path: "/detect-attacker", icon: <ShieldAlert className="w-5 h-5" /> }]
      : []),
  ];

  const handleScan = () => scan(prompt);

  const handleClear = () => {
    setPrompt("");
    reset();
    textareaRef.current?.focus();
  };

  const isDone = state.status === "done";

  const handleCopy = async () => {
    if (!state.analysis?.sanitizedPrompt) return;
    await navigator.clipboard.writeText(state.analysis.sanitizedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <Header
        token={token || ""}
        handleLogout={handleLogout}
        profileImage={profileImage}
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
      />

      <div className="flex justify-end px-6 py-3 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={toggleDarkMode}
          className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-sm font-medium shadow hover:scale-105 transition"
        >
          {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarExpanded ? "18rem" : "4rem" }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="bg-gradient-to-b from-gray-800 to-gray-900 text-white p-4 flex flex-col"
        >
          {navItems.map(({ label, path, icon }) => (
            <div
              key={path}
              onClick={() => navigate(path)}
              className={`relative group flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-indigo-600 transition cursor-pointer ${path === "/prompt-scanner" ? "bg-indigo-700" : ""}`}
            >
              {icon}
              {sidebarExpanded && <span className="truncate">{label}</span>}
              {!sidebarExpanded && (
                <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
                  {label}
                </span>
              )}
            </div>
          ))}
        </motion.aside>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center flex-shrink-0">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Prompt Privacy Scanner
          </h1>
          <p className="text-sm text-gray-500">
            Detect PII and sensitive data before sending to any AI model
          </p>
        </div>
      </div>

      {/* Input */}
      <div className="relative mb-3">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Paste your AI prompt here before sending to ChatGPT, Gemini, or any LLM...\n\nExample: "My name is Rahul Mehta, email rahul@company.com. Review this contract clause for Acme Corp Ltd and tell me if it's enforceable in India."`}
          rows={7}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-mono text-gray-800 placeholder-gray-400 resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
        />
        <span className="absolute bottom-3 right-3 text-xs text-gray-400 font-sans">
          {prompt.length} chars
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mb-7">
        <button
          onClick={handleScan}
          disabled={!prompt.trim()}
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
        >
          <Zap size={14} />
          Scan Prompt
        </button>

        {(isDone || prompt) && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-3 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={13} />
            Clear
          </button>
        )}
      </div>

      {/* Results */}
      {state.localResult && state.analysis && (
        <div className="space-y-5">
          <RiskBadge
            level={state.localResult.riskLevel}
            score={state.localResult.score}
          />

          {/* Detection flags */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5">
              Detection flags
            </h2>
            <FlagGrid hits={state.localResult.hits} />
          </div>

          {/* Summary */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5">
              Analysis
            </h2>
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3.5 text-sm text-gray-700 leading-relaxed">
              {state.analysis.summary}
            </div>
          </div>

          {/* Sanitized prompt */}
          {state.analysis.hasSensitive && state.analysis.sanitizedPrompt && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5">
                Sanitized version
              </h2>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
                <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-2">
                  Safe to send
                </p>
                <pre className="text-sm text-emerald-800 font-mono whitespace-pre-wrap break-words leading-relaxed">
                  {state.analysis.sanitizedPrompt}
                </pre>
                <button
                  onClick={handleCopy}
                  className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-white border border-emerald-300 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Copy size={12} />
                  {copied ? "Copied!" : "Copy sanitized prompt"}
                </button>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {state.analysis.recommendations.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2.5">
                Recommendations
              </h2>
              <div className="space-y-2">
                {state.analysis.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-lg border border-gray-100 bg-white px-3.5 py-2.5 text-sm text-gray-700"
                  >
                    <span className="text-emerald-600 mt-0.5 flex-shrink-0">→</span>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

            {/* Disclaimer */}
            <p className="mt-6 text-xs text-gray-400 leading-relaxed">
              Pattern detection runs entirely in your browser. No data is sent to any server or third-party AI.
              No prompts are stored or logged.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PromptScanner;