import React, { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bot,
  Check,
  Cpu,
  Eye,
  FileSearch,
  Fingerprint,
  Globe,
  KeyRound,
  ScanEye,
  ShieldAlert,
  ShieldCheck,
  Star,
  Target,
  Users,
  Zap,
} from "lucide-react";
import Header from "./ui/Header";
import Footer from "./ui/Footer";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../services/api";

interface GroupPlan {
  id: string;
  label: string;
  tagline: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  accentColor: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  badgeText?: string;
  ctaLabel?: string;
  icon: React.ElementType;
  tools: { name: string; icon: React.ElementType }[];
  highlights: string[];
}

type BackendPlan = "free" | "pro" | "premium" | "business";

interface CheckoutPlan {
  backendPlan: BackendPlan;
  amount: number;
  description: string;
}

interface FeatureFlagsResponse {
  ownedFeatureFlags?: string[];
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: any) => void) => void;
    };
  }
}

const GROUP_PLANS: GroupPlan[] = [
  {
    id: "identity",
    label: "Identity & Access Protection",
    tagline: "Secure credentials and monitor every login event.",
    monthlyPrice: 299,
    annualPrice: 249,
    accentColor: "from-sky-600 to-sky-800",
    borderColor: "border-sky-400",
    bgColor: "bg-sky-50 dark:bg-sky-950/40",
    textColor: "text-sky-600 dark:text-sky-400",
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
    monthlyPrice: 399,
    annualPrice: 329,
    accentColor: "from-orange-600 to-orange-800",
    borderColor: "border-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-950/40",
    textColor: "text-orange-600 dark:text-orange-400",
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
    monthlyPrice: 699,
    annualPrice: 579,
    accentColor: "from-amber-500 to-amber-700",
    borderColor: "border-amber-500",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    textColor: "text-amber-600 dark:text-amber-400",
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
    monthlyPrice: 399,
    annualPrice: 329,
    accentColor: "from-teal-600 to-teal-800",
    borderColor: "border-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/40",
    textColor: "text-teal-600 dark:text-teal-400",
    icon: Globe,
    tools: [
      { name: "Watch Agent", icon: Eye },
      { name: "Site Shield & Audit", icon: Globe },
      { name: "CSP Builder", icon: ShieldCheck },
    ],
    highlights: [
      "Nightly automated site scans",
      "SSL, headers & DNS audits",
      "Security grade (A-F) per URL",
      "Alert on score drops",
      "CSP policy builder & validator",
      "Platform-specific deployment snippets",
    ],
  },
  {
    id: "team-workspaces",
    label: "Findings & Team Workspaces",
    tagline: "Turn scan output into tracked remediation work and collaborate in shared security spaces.",
    monthlyPrice: 499,
    annualPrice: 399,
    accentColor: "from-fuchsia-600 to-fuchsia-800",
    borderColor: "border-fuchsia-400",
    bgColor: "bg-fuchsia-50 dark:bg-fuchsia-950/40",
    textColor: "text-fuchsia-600 dark:text-fuchsia-400",
    badgeText: "Teams",
    ctaLabel: "Get Team Plan",
    icon: Users,
    tools: [
      { name: "Findings Board", icon: ShieldAlert },
      { name: "Team Workspaces", icon: Users },
    ],
    highlights: [
      "Track findings from scanner results",
      "Status-based remediation workflow",
      "Team assignment and ownership visibility",
      "Shared password vaults inside workspaces",
      "Member roles, invites, and access control",
      "Built for analysts, security leads, and client-facing teams",
    ],
  },
  {
    id: "learn",
    label: "Learn & Stay Secure",
    tagline: "Stay informed with AI-powered security guidance, free forever.",
    monthlyPrice: null,
    annualPrice: null,
    accentColor: "from-lime-600 to-lime-800",
    borderColor: "border-lime-500",
    bgColor: "bg-lime-50 dark:bg-lime-950/40",
    textColor: "text-lime-600 dark:text-lime-400",
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
  monthlyPrice: 1799,
  annualPrice: 1449,
  annualSavings: 5232,
};

const GROUP_OWNED_FEATURES: Record<string, string[]> = {
  identity: ["password_vault", "siem_dashboard"],
  threat: ["malware_analyzer", "phishing_detector", "deepfake_detector"],
  "ai-security": ["ai_red_team", "ai_agent_scanner", "prompt_injection", "pii_detector"],
  "web-infra": ["watch_agent", "site_shield", "csp_builder"],
  "team-workspaces": ["findings_board", "team_workspaces"],
  learn: ["security_awareness", "insights", "security_chatbot"],
};

const ALL_GROUP_FEATURES = Array.from(
  new Set(Object.values(GROUP_OWNED_FEATURES).flat())
);

const formatInr = (amount: number) =>
  new Intl.NumberFormat("en-IN").format(amount);

const getCheckoutPlan = (planId: string, annual: boolean): CheckoutPlan | null => {
  switch (planId) {
    case "identity":
      return {
        backendPlan: "pro",
        amount: annual ? 249 : 299,
        description: "Identity & Access Protection",
      };
    case "threat":
      return {
        backendPlan: "pro",
        amount: annual ? 329 : 399,
        description: "Threat Detection",
      };
    case "ai-security":
      return {
        backendPlan: "premium",
        amount: annual ? 579 : 699,
        description: "AI Security Suite",
      };
    case "web-infra":
      return {
        backendPlan: "pro",
        amount: annual ? 329 : 399,
        description: "Web & Infrastructure Security",
      };
    case "team-workspaces":
      return {
        backendPlan: "business",
        amount: annual ? 399 : 499,
        description: "Findings & Team Workspaces",
      };
    case "bundle":
      return {
        backendPlan: "business",
        amount: annual ? BUNDLE.annualPrice : BUNDLE.monthlyPrice,
        description: "All Access Bundle",
      };
    default:
      return null;
  }
};

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [annual, setAnnual] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const [ownedFeatureFlags, setOwnedFeatureFlags] = useState<string[]>([]);
  const token = localStorage.getItem("token");
  const isProduction = process.env.NODE_ENV === "production";

  const handleLogout = () => navigate("/");

  const individualTotal = GROUP_PLANS.reduce(
    (sum, plan) => sum + (annual ? plan.annualPrice ?? 0 : plan.monthlyPrice ?? 0),
    0
  );

  useEffect(() => {
    const loadOwnedFeatures = async () => {
      if (!token) {
        setOwnedFeatureFlags([]);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/feature-flags/read`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to load feature access");
        }

        const data: FeatureFlagsResponse = await response.json();
        setOwnedFeatureFlags(data.ownedFeatureFlags || []);
      } catch {
        setOwnedFeatureFlags([]);
      }
    };

    loadOwnedFeatures();
  }, [token]);

  const isPlanOwned = (planId: string) => {
    if (planId === "bundle") {
      return ALL_GROUP_FEATURES.every((feature) => ownedFeatureFlags.includes(feature));
    }

    const requiredFeatures = GROUP_OWNED_FEATURES[planId];
    if (!requiredFeatures) return false;
    return requiredFeatures.every((feature) => ownedFeatureFlags.includes(feature));
  };

  const handleCTA = async (planId: string) => {
    if (!token) {
      navigate("/signup");
      return;
    }

    if (isPlanOwned(planId)) {
      return;
    }

    if (planId === "learn") {
      setPaymentError("");
      setProcessingPlan(planId);

      try {
        const response = await fetch(`${API_BASE_URL}/auth/activate-free-plan`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ featureGroup: "learn" }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to activate free plan.");
        }

        setOwnedFeatureFlags(data.ownedFeatureFlags || []);
        localStorage.setItem("plan", data.plan || "free");
        navigate("/homepageAfterLogin");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unable to activate free plan.";
        setPaymentError(message);
      } finally {
        setProcessingPlan(null);
      }
      return;
    }

    const checkoutPlan = getCheckoutPlan(planId, annual);
    if (!checkoutPlan) {
      navigate("/contact");
      return;
    }

    if (!window.Razorpay) {
      setPaymentError("Razorpay SDK failed to load. Please refresh and try again.");
      return;
    }

    setPaymentError("");
    setProcessingPlan(planId);

    try {
      const paymentIdentity = {
        name:
          user?.username ||
          user?.email?.split("@")[0] ||
          (isProduction ? "Seekurify User" : "Seekurify Test User"),
        email: user?.email || (isProduction ? "" : "success@razorpay.com"),
        contact: isProduction ? "" : "9999999999",
      };

      const orderResponse = await fetch(`${API_BASE_URL}/auth/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...paymentIdentity,
          amount: checkoutPlan.amount,
          currency: "INR",
          receipt: `pricing_${planId}_${Date.now()}`,
        }),
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.message || "Failed to create payment order.");
      }

      const razorpay = new window.Razorpay({
        key: orderData.key,
        amount: checkoutPlan.amount * 100,
        currency: "INR",
        name: "Seekurify",
        description: `${checkoutPlan.description}${annual ? " Annual" : " Monthly"} Plan`,
        order_id: orderData.orderId,
        prefill: paymentIdentity,
        notes: isProduction
          ? {
              plan: checkoutPlan.backendPlan,
            }
          : {
              plan: checkoutPlan.backendPlan,
              mode: "test",
              test_email: "success@razorpay.com",
              test_contact: "9999999999",
            },
        theme: { color: "#f59e0b" },
        modal: {
          ondismiss: () => setProcessingPlan(null),
        },
        handler: async (response: any) => {
          try {
            const verifyResponse = await fetch(`${API_BASE_URL}/auth/payment-success`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                ...response,
                plan: checkoutPlan.backendPlan,
                featureGroup: planId,
              }),
            });

            const verifyData = await verifyResponse.json();
            if (!verifyResponse.ok || !verifyData.success) {
              throw new Error(verifyData.message || "Payment verification failed.");
            }

            localStorage.setItem("plan", verifyData.plan);
            localStorage.setItem("hasPaid", "true");
            navigate("/homepageAfterLogin");
          } catch (error) {
            const message =
              error instanceof Error
                ? error.message
                : "Server error while verifying payment.";
            setPaymentError(message);
          } finally {
            setProcessingPlan(null);
          }
        },
      });

      razorpay.on("payment.failed", (response: any) => {
        const message =
          response?.error?.description || "Payment failed. Please try again.";
        setPaymentError(message);
        setProcessingPlan(null);
      });

      razorpay.open();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start payment.";
      setPaymentError(message);
      setProcessingPlan(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <title>Pricing - Seekurify</title>
      <Header token={token || ""} handleLogout={handleLogout} />

      <main className="flex-1 px-4 py-12 max-w-7xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-100 dark:bg-amber-900/50 px-3 py-1 rounded-full mb-3">
            Group-wise Pricing
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Pay only for what
            <br className="hidden sm:block" /> you actually use
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
            Seekurify is organized into 6 security pillars. Subscribe to
            individual groups or get everything with the All Access Bundle.
          </p>
          {paymentError && (
            <div className="mt-4 inline-flex max-w-2xl items-center rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
              {paymentError}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <span
            className={`text-sm font-semibold ${
              !annual ? "text-gray-900 dark:text-white" : "text-gray-400"
            }`}
          >
            Monthly
          </span>
          <button
            onClick={() => setAnnual((value) => !value)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
              annual ? "bg-amber-500" : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${
                annual ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`text-sm font-semibold ${
              annual ? "text-gray-900 dark:text-white" : "text-gray-400"
            }`}
          >
            Annual
          </span>
          {annual && (
            <span className="text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-2 py-0.5 rounded-full">
              Save ~20%
            </span>
          )}
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {GROUP_PLANS.map((plan, idx) => {
            const GroupIcon = plan.icon;
            const price = annual ? plan.annualPrice : plan.monthlyPrice;
            const isFree = price === null;
            const isProcessing = processingPlan === plan.id;
            const isOwned = isPlanOwned(plan.id);

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 * idx }}
                className={`relative flex flex-col rounded-2xl border-2 ${plan.borderColor} bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-shadow duration-200 overflow-hidden`}
              >
                <div className={`h-1.5 bg-gradient-to-r ${plan.accentColor}`} />

                {plan.badgeText && (
                  <div className="absolute top-4 right-4">
                    <span
                      className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${plan.accentColor} text-white shadow`}
                    >
                      <Star className="w-3 h-3" /> {plan.badgeText}
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  <div
                    className={`flex items-center gap-3 mb-3 ${plan.bgColor} rounded-xl px-3 py-2`}
                  >
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-br ${plan.accentColor} shadow-sm`}
                    >
                      <GroupIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className={`text-sm font-bold leading-tight ${plan.textColor}`}>
                        {plan.label}
                      </h2>
                      {isOwned && (
                        <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          Paid
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-4 leading-relaxed">
                    {plan.tagline}
                  </p>

                  <div className="mb-4">
                    {isFree ? (
                      <div className="flex items-end gap-1">
                        <span className={`text-4xl font-extrabold ${plan.textColor}`}>
                          Free
                        </span>
                        <span className="text-gray-400 text-sm mb-1">forever</span>
                      </div>
                    ) : (
                      <div className="flex items-end gap-1">
                        <span className={`text-4xl font-extrabold ${plan.textColor}`}>
                          ₹{formatInr(price)}
                        </span>
                        <span className="text-gray-400 text-sm mb-1">/mo</span>
                        {annual && plan.monthlyPrice && (
                          <span className="ml-2 text-xs text-gray-400 mb-1 line-through">
                            ₹{formatInr(plan.monthlyPrice)}/mo
                          </span>
                        )}
                      </div>
                    )}
                    {!isFree && annual && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                        Billed ₹{formatInr(price! * 12)} / year
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Includes
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.tools.map((tool) => {
                        const ToolIcon = tool.icon;
                        return (
                          <span
                            key={tool.name}
                            className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${plan.bgColor} ${plan.textColor} font-medium`}
                          >
                            <ToolIcon className="w-3 h-3" /> {tool.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <ul className="space-y-1.5 mb-6 flex-1">
                    {plan.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300"
                      >
                        <Check className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${plan.textColor}`} />
                        {highlight}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleCTA(plan.id)}
                    disabled={isProcessing || isOwned}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                      isFree
                        ? `border-2 ${plan.borderColor} ${plan.textColor} hover:bg-amber-50 dark:hover:bg-amber-950/40`
                        : `bg-gradient-to-r ${plan.accentColor} text-white hover:opacity-90 shadow-sm hover:shadow-md`
                    } ${(isProcessing || isOwned) ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    {isOwned
                      ? "Paid"
                      : isProcessing
                      ? "Opening Checkout..."
                      : isFree
                        ? "Get Started Free"
                        : plan.ctaLabel || `Get ${plan.label.split(" ")[0]} Plan`}
                  </button>
                </div>
              </motion.div>
            );
          })}

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.3 }}
            className="relative flex flex-col rounded-2xl border-2 border-amber-500 bg-gradient-to-br from-slate-800 via-slate-700 to-amber-600 shadow-xl hover:shadow-2xl transition-shadow duration-200 overflow-hidden md:col-span-2 lg:col-span-3"
          >
            <div className="absolute inset-0 bg-white/5 pointer-events-none" />

            <div className="p-8 flex flex-col lg:flex-row gap-8 relative">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-white/20 rounded-xl">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-100">
                      Best Value
                    </span>
                    <h2 className="text-2xl font-extrabold text-white leading-tight">
                      All Access Bundle
                    </h2>
                  </div>
                </div>

                <p className="text-amber-50 text-sm mb-5 max-w-lg">
                  Everything in all 6 security pillars. One plan, zero
                  compromises. Ideal for security professionals, teams, and
                  startups building on AI.
                </p>

                <div className="flex items-end gap-2 mb-2">
                  <span className="text-5xl font-extrabold text-white">
                    ₹{formatInr(annual ? BUNDLE.annualPrice : BUNDLE.monthlyPrice)}
                  </span>
                  <span className="text-amber-100 text-base mb-1">/mo per user</span>
                  {annual && (
                    <span className="ml-1 text-amber-200 text-sm mb-1 line-through">
                      ₹{formatInr(BUNDLE.monthlyPrice)}/mo
                    </span>
                  )}
                </div>
                {annual ? (
                  <p className="text-sm text-green-300 mb-1">
                    Billed ₹{formatInr(BUNDLE.annualPrice * 12)}/year - save ₹{formatInr(BUNDLE.annualSavings)}
                  </p>
                ) : (
                  <p className="text-sm text-amber-100 mb-1">
                    vs <span className="line-through">₹{formatInr(individualTotal)}/mo</span> if bought
                    separately - save ₹{formatInr(individualTotal - BUNDLE.monthlyPrice)}/mo
                  </p>
                )}

                <button
                  onClick={() => handleCTA("bundle")}
                  disabled={processingPlan === "bundle" || isPlanOwned("bundle")}
                  className={`mt-5 inline-flex items-center gap-2 bg-white text-slate-900 font-bold text-sm px-6 py-3 rounded-xl shadow-lg hover:bg-amber-50 transition-colors ${
                    (processingPlan === "bundle" || isPlanOwned("bundle")) ? "cursor-not-allowed opacity-70" : ""
                  }`}
                >
                  {isPlanOwned("bundle")
                    ? "Paid"
                    : processingPlan === "bundle"
                      ? "Opening Checkout..."
                      : "Get All Access"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2 content-start">
                {GROUP_PLANS.flatMap((plan) =>
                  plan.tools.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                      <div
                        key={tool.name}
                        className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2"
                      >
                        <ToolIcon className="w-3.5 h-3.5 text-white flex-shrink-0" />
                        <span className="text-xs text-white font-medium truncate">
                          {tool.name}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <p className="text-gray-400 dark:text-gray-500 text-sm">
            All plans include a{" "}
            <span className="font-semibold text-gray-600 dark:text-gray-300">
              7-day free trial
            </span>
            . No credit card required to start. Cancel anytime.
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
            Need a custom enterprise plan?{" "}
            <button
              onClick={() => navigate("/contact")}
              className="text-amber-400 hover:text-amber-300 hover:underline font-medium"
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
