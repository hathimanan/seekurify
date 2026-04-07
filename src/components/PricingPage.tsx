import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  KeyRound, BarChart3, FileSearch, AlertTriangle, ScanEye,
  Target, Cpu, ShieldAlert, Fingerprint, Eye, Globe, ShieldCheck,
  BookOpen, Activity, Bot, Check, Zap, Star, ArrowRight,
} from "lucide-react";
import Header from "./ui/Header";
import Footer from "./ui/Footer";
import { useAuth } from "../context/AuthContext";

// ─── Types ───────────────────────────────────────────────────────────────────
interface GroupPlan {
  id: string;
  label: string;
  tagline: string;
  monthlyPrice: number | null; // null = free
  annualPrice: number | null;
  accentColor: string;         // Tailwind gradient classes
  borderColor: string;
  bgColor: string;
  textColor: string;
  badgeText?: string;
  icon: React.ElementType;
  tools: { name: string; icon: React.ElementType }[];
  highlights: string[];
}

// ─── Plans ────────────────────────────────────────────────────────────────────
const GROUP_PLANS: GroupPlan[] = [
  {
    id: "identity",
    label: "Identity & Access Protection",
    tagline: "Secure credentials and monitor every login event.",
    monthlyPrice: 9,
    annualPrice: 7,
    accentColor: "from-indigo-500 to-indigo-700",
    borderColor: "border-indigo-400",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
    textColor: "text-indigo-600 dark:text-indigo-400",
    icon: KeyRound,
    tools: [
      { name: "Password Vault", icon: KeyRound },
      { name: "SIEM Dashboard", icon: BarChart3 },
    ],
    highlights: [
      "Unlimited encrypted passwords",
      "Secure password sharing via link",
      "Full login event timeline",
      "Device & IP tracking",
      "Password health scoring",
      "Expiry reminders & PIN protection",
    ],
  },
  {
    id: "threat",
    label: "Threat Detection",
    tagline: "Identify malware, phishing, and deepfake threats in real time.",
    monthlyPrice: 12,
    annualPrice: 10,
    accentColor: "from-red-500 to-rose-700",
    borderColor: "border-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/40",
    textColor: "text-red-600 dark:text-red-400",
    icon: ShieldAlert,
    tools: [
      { name: "Malware Analyzer", icon: FileSearch },
      { name: "Phishing Detector", icon: AlertTriangle },
      { name: "Deepfake Detector", icon: ScanEye },
    ],
    highlights: [
      "File & URL malware scanning",
      "Hash-based malware history",
      "Email header phishing analysis",
      "AI-powered threat scoring",
      "Deepfake image & video detection",
      "Confidence scoring & indicators",
    ],
  },
  {
    id: "ai-security",
    label: "AI Security Suite",
    tagline: "Red-team, audit, and harden every AI system you build.",
    monthlyPrice: 29,
    annualPrice: 23,
    accentColor: "from-rose-500 to-pink-700",
    borderColor: "border-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/40",
    textColor: "text-rose-600 dark:text-rose-400",
    badgeText: "Most Popular",
    icon: Target,
    tools: [
      { name: "AI Red-Team Agent", icon: Target },
      { name: "AI Agent Scanner", icon: Cpu },
      { name: "Prompt Injection Scanner", icon: ShieldAlert },
      { name: "PII Detector", icon: Fingerprint },
    ],
    highlights: [
      "6 autonomous attack categories",
      "Agentic red-teaming with 20 iterations",
      "RAG poisoning & exfiltration probes",
      "Prompt injection detection & scoring",
      "PII leakage scanning (text & files)",
      "Risk gauge + PDF export",
    ],
  },
  {
    id: "web-infra",
    label: "Web & Infrastructure Security",
    tagline: "Continuously audit, monitor, and harden your web assets.",
    monthlyPrice: 15,
    annualPrice: 12,
    accentColor: "from-emerald-500 to-teal-700",
    borderColor: "border-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    textColor: "text-emerald-600 dark:text-emerald-400",
    icon: Globe,
    tools: [
      { name: "Watch Agent", icon: Eye },
      { name: "Site Shield & Audit", icon: Globe },
      { name: "CSP Builder", icon: ShieldCheck },
    ],
    highlights: [
      "Nightly automated site scans",
      "SSL, headers & DNS audits",
      "Security grade (A–F) per URL",
      "Alert on score drops",
      "CSP policy builder & validator",
      "Platform-specific deployment snippets",
    ],
  },
  {
    id: "learn",
    label: "Learn & Stay Secure",
    tagline: "Stay informed with AI-powered security guidance — free forever.",
    monthlyPrice: null,
    annualPrice: null,
    accentColor: "from-violet-500 to-purple-700",
    borderColor: "border-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/40",
    textColor: "text-violet-600 dark:text-violet-400",
    icon: BookOpen,
    tools: [
      { name: "Security Awareness", icon: BookOpen },
      { name: "Insights", icon: Activity },
      { name: "Ask Seekurify AI", icon: Bot },
    ],
    highlights: [
      "Curated cybersecurity news feed",
      "Daily security tips",
      "Account risk posture insights",
      "AI security chatbot (unlimited)",
      "Attack trend analysis",
      "Security awareness modules",
    ],
  },
];

const BUNDLE = {
  monthlyPrice: 49,
  annualPrice: 39,
  annualSavings: 120,
};

// ─── Component ────────────────────────────────────────────────────────────────
const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [annual, setAnnual] = useState(false);
  const token = localStorage.getItem("token");

  const handleLogout = () => navigate("/");

  const individualTotal = GROUP_PLANS.reduce(
    (sum, p) => sum + (annual ? (p.annualPrice ?? 0) : (p.monthlyPrice ?? 0)),
    0
  );

  const handleCTA = (planId: string) => {
    if (!token) {
      navigate("/signup");
    } else {
      navigate("/homepageAfterLogin");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <title>Pricing — Seekurify</title>
      <Header token={token || ""} handleLogout={handleLogout} />

      <main className="flex-1 px-4 py-12 max-w-7xl mx-auto w-full">

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-500 bg-indigo-100 dark:bg-indigo-900/50 px-3 py-1 rounded-full mb-3">
            Group-wise Pricing
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight">
            Pay only for what<br className="hidden sm:block" /> you actually use
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            Seekurify is organized into 5 security pillars. Subscribe to individual groups or get everything with the All Access Bundle.
          </p>
        </motion.div>

        {/* ── Billing Toggle ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <span className={`text-sm font-semibold ${!annual ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual((v) => !v)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${annual ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"}`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${annual ? "translate-x-6" : "translate-x-0"}`}
            />
          </button>
          <span className={`text-sm font-semibold ${annual ? "text-gray-900 dark:text-white" : "text-gray-400"}`}>
            Annual
          </span>
          {annual && (
            <span className="text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-2 py-0.5 rounded-full">
              Save ~20%
            </span>
          )}
        </motion.div>

        {/* ── Group Plan Cards ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {GROUP_PLANS.map((plan, idx) => {
            const GroupIcon = plan.icon;
            const price = annual ? plan.annualPrice : plan.monthlyPrice;
            const isFree = price === null;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 * idx }}
                className={`relative flex flex-col rounded-2xl border-2 ${plan.borderColor} bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden`}
              >
                {/* top gradient strip */}
                <div className={`h-1.5 bg-gradient-to-r ${plan.accentColor}`} />

                {/* badge */}
                {plan.badgeText && (
                  <div className="absolute top-4 right-4">
                    <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${plan.accentColor} text-white shadow`}>
                      <Star className="w-3 h-3" /> {plan.badgeText}
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* header */}
                  <div className={`flex items-center gap-3 mb-3 ${plan.bgColor} rounded-xl px-3 py-2`}>
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${plan.accentColor} shadow-sm`}>
                      <GroupIcon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className={`text-sm font-bold leading-tight ${plan.textColor}`}>
                      {plan.label}
                    </h2>
                  </div>

                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-4 leading-relaxed">
                    {plan.tagline}
                  </p>

                  {/* price */}
                  <div className="mb-4">
                    {isFree ? (
                      <div className="flex items-end gap-1">
                        <span className={`text-4xl font-extrabold ${plan.textColor}`}>Free</span>
                        <span className="text-gray-400 text-sm mb-1">forever</span>
                      </div>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className={`text-4xl font-extrabold ${plan.textColor}`}>${price}</span>
                        <span className="text-gray-400 text-sm mb-1">/mo</span>
                        {annual && plan.monthlyPrice && (
                          <span className="ml-2 text-xs text-gray-400 mb-1 line-through">
                            ${plan.monthlyPrice}/mo
                          </span>
                        )}
                      </div>
                    )}
                    {!isFree && annual && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                        Billed ${(price! * 12)} / year
                      </p>
                    )}
                  </div>

                  {/* included tools */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Includes</p>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.tools.map((t) => {
                        const TIcon = t.icon;
                        return (
                          <span
                            key={t.name}
                            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${plan.bgColor} ${plan.textColor} font-medium`}
                          >
                            <TIcon className="w-3 h-3" /> {t.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* highlights */}
                  <ul className="space-y-1.5 mb-6 flex-1">
                    {plan.highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${plan.textColor}`} />
                        {h}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleCTA(plan.id)}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                      isFree
                        ? `border-2 ${plan.borderColor} ${plan.textColor} hover:bg-violet-50 dark:hover:bg-violet-950/40`
                        : `bg-gradient-to-r ${plan.accentColor} text-white hover:opacity-90 shadow-sm hover:shadow-md`
                    }`}
                  >
                    {isFree ? "Get Started Free" : `Get ${plan.label.split(" ")[0]} Plan`}
                  </button>
                </div>
              </motion.div>
            );
          })}

          {/* ── All Access Bundle Card ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3 }}
            className="relative flex flex-col rounded-2xl border-2 border-indigo-500 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 shadow-xl hover:shadow-2xl transition-shadow duration-200 overflow-hidden md:col-span-2 lg:col-span-3"
          >
            {/* glow */}
            <div className="absolute inset-0 bg-white/5 pointer-events-none" />

            <div className="p-8 flex flex-col lg:flex-row gap-8 relative">
              {/* left: info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-white/20 rounded-xl">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">
                      Best Value
                    </span>
                    <h2 className="text-2xl font-extrabold text-white leading-tight">
                      All Access Bundle
                    </h2>
                  </div>
                </div>

                <p className="text-indigo-100 text-sm mb-5 max-w-lg">
                  Everything in all 5 security pillars. One plan, zero compromises. Ideal for security professionals, teams, and startups building on AI.
                </p>

                {/* price */}
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-5xl font-extrabold text-white">
                    ${annual ? BUNDLE.annualPrice : BUNDLE.monthlyPrice}
                  </span>
                  <span className="text-indigo-200 text-base mb-1">/mo per user</span>
                  {annual && (
                    <span className="ml-1 text-indigo-300 text-sm mb-1 line-through">
                      ${BUNDLE.monthlyPrice}/mo
                    </span>
                  )}
                </div>
                {annual ? (
                  <p className="text-sm text-green-300 mb-1">
                    Billed ${BUNDLE.annualPrice * 12}/year — save ${BUNDLE.annualSavings}
                  </p>
                ) : (
                  <p className="text-sm text-indigo-200 mb-1">
                    vs <span className="line-through">${individualTotal}/mo</span> if bought separately — save ${individualTotal - BUNDLE.monthlyPrice}/mo
                  </p>
                )}

                <button
                  onClick={() => handleCTA("bundle")}
                  className="mt-5 inline-flex items-center gap-2 bg-white text-indigo-700 font-bold text-sm px-6 py-3 rounded-xl shadow-lg hover:bg-indigo-50 transition-colors"
                >
                  Get All Access <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* right: all tools grid */}
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2 content-start">
                {GROUP_PLANS.flatMap((p) =>
                  p.tools.map((t) => {
                    const TIcon = t.icon;
                    return (
                      <div
                        key={t.name}
                        className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2"
                      >
                        <TIcon className="w-3.5 h-3.5 text-white flex-shrink-0" />
                        <span className="text-xs text-white font-medium truncate">{t.name}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Comparison Note ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            All plans include a{" "}
            <span className="font-semibold text-gray-600 dark:text-gray-300">7-day free trial</span>.
            No credit card required to start. Cancel anytime.
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
            Need a custom enterprise plan?{" "}
            <button
              onClick={() => navigate("/contact")}
              className="text-indigo-500 hover:underline font-medium"
            >
              Contact us
            </button>
          </p>
        </motion.div>

      </main>

      <Footer />
    </div>
  );
};

export default PricingPage;
