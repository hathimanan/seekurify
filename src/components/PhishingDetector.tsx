import React, { useState } from 'react';
import { useEffect, useRef } from 'react';
import { ShieldAlert, ShieldCheck, Search, Loader2, AlertCircle } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';
import { FileSearch, KeyRound, BarChart3, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { API_BASE_URL } from '../services/api';
import Header from "../components/ui/Header";
import Footer from '../components/ui/Footer';
import { apiService } from '../services/api';
import { ErrorModal } from './ui/ErrorModal';


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


interface HeaderProps {
    token: string;
    handleLogout: () => void;
    profileImage: string;
    sidebarExpanded: boolean;
    setSidebarExpanded: (expanded: boolean) => void;
    navigate: (path: string | number) => void;
}




export default function PhishingDetector() {
const [userInput, setUserInput] = useState("");
    const [loading, setLoading] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
const [result, setResult] = useState<PhishingResult | null>(null);

const [errorMessage, setErrorMessage] = useState("");
const [showErrorModal, setShowErrorModal] = useState(false);



const [analysisResult, setAnalysisResult] = useState("");

const navigate = useNavigate();
const profileImage = localStorage.getItem("profileImage") || "";

const [recipientData, setRecipientData] = useState<RecipientFields | null>(null);
const [recipientAnalysis, setRecipientAnalysis] = useState<string | null>(null);

const [fromField, setFromField] = useState("");
const [replyToField, setReplyToField] = useState("");
const [toField, setToField] = useState("");
const [ccField, setCcField] = useState("");
const [bccField, setBccField] = useState("");
  const [phishingDetectorEnabled, setPhishingDetectorEnabled] = useState<boolean>(false);
  const [featuresLoaded, setFeaturesLoaded] = useState(false);


type RecipientFields = {
  from: string;
  replyTo: string;
  to: string;
  cc: string;
  bcc: string;
};

useEffect(() => {
    const fetchFeatureFlags = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/feature-flags/read`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch feature flags');
        }
        
        const data = await res.json();
        
        console.log('✅ Header feature flags loaded:', data);
        setPhishingDetectorEnabled(data.phishingDetectorEnabled === true);
        
      } catch (err) {
        console.error("❌ Failed to load header feature flags:", err);
        setPhishingDetectorEnabled(false); // Safe default
      } finally {
        setFeaturesLoaded(true);
      }
    };

    fetchFeatureFlags();
  }, []);



const triggerError = (msg: string) => {
  setErrorMessage(msg);
  setShowErrorModal(true);
};



const handleLogout = () => {    
    localStorage.removeItem("token");
    navigate("/login");
}





const analyzeRecipients = () => {
  // Save structured data for future logic
  const data: RecipientFields = {
    from: fromField.trim(),
    replyTo: replyToField.trim(),
    to: toField.trim(),
    cc: ccField.trim(),
    bcc: bccField.trim(),
  };

  setRecipientData(data);

  // Build analysis report
  let analysis = `📧 EMAIL RECIPIENT ANALYSIS\n`;
  analysis += `----------------------------------\n`;
  analysis += `From: ${data.from || "❌ Missing"}\n`;
  analysis += `Reply-To: ${data.replyTo || "Not provided"}\n`;
  analysis += `To: ${data.to || "❌ Missing"}\n`;
  analysis += `CC: ${data.cc || "None"}\n`;
  analysis += `BCC: ${data.bcc || "None"}\n\n`;

  // FROM field checks
  if (!data.from) {
    analysis += "⚠️ Missing 'From' field — suspicious sender.\n";
  } else if (data.replyTo && data.replyTo !== data.from) {
    analysis += "⚠️ Reply-To differs from From — possible spoof attempt.\n";
  } else {
    analysis += "✅ From and Reply-To seem consistent.\n";
  }

  // TO checks
  if (!data.to) {
    analysis += "⚠️ Missing 'To' field — mass / automated mailing.\n";
  }

  // CC checks
  if (data.cc) {
    analysis += "⚠️ CC used — verify unknown recipients.\n";
  }

  // BCC checks
  if (data.bcc) {
    analysis += "⚠️ BCC detected — hidden recipients or bulk sending.\n";
  }


  const suspiciousIndicators: string[] = [];

  // Basic email regex (RFC-compliant enough for validation)
  const emailRegex =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const checkEmail = (label: string, email: string | undefined) => {
    if (!email) return;

    analysis += `\n🔍 Checking ${label}: ${email}\n`;

    // 1. Basic validity
    if (!emailRegex.test(email)) {
      analysis += "❌ Invalid email format.\n";
      suspiciousIndicators.push(`${label}: invalid format`);
      return;
    } else {
      analysis += "✅ Valid email format.\n";
    }

    // Extract parts
    const [localPart, domain] = email.split("@");

    // 2. Suspicious local-part patterns
    if (/^[0-9a-fA-F]{12,}$/.test(localPart)) {
      analysis += "⚠️ Local part appears randomly generated.\n";
      suspiciousIndicators.push(`${label}: random local part`);
    }

    if (localPart.length <= 2) {
      analysis += "⚠️ Very short local part — could be a throwaway.\n";
      suspiciousIndicators.push(`${label}: short local part`);
    }

    // 3. Domain analysis
    if (domain.split(".").length < 2) {
      analysis += "❌ Invalid domain structure.\n";
      suspiciousIndicators.push(`${label}: invalid domain`);
    }

    // Detect unusual/random subdomain
    const domainParts = domain.split(".");
    const subdomain = domainParts.length > 2 ? domainParts[0] : null;

    if (subdomain && /^[a-zA-Z0-9]{10,}$/.test(subdomain)) {
      analysis += "⚠️ Random-looking subdomain detected.\n";
      suspiciousIndicators.push(`${label}: random subdomain`);
    }

    // Detect suspicious keyword domains
    const riskyKeywords = [
      "mailgun", "proton", "shadow", "temp", "throw",
      "inbox", "anon", "spam", "trk", "click", "track",
      "secure-mail", "trap", "bot"
    ];

    if (riskyKeywords.some(k => domain.includes(k))) {
      analysis += "⚠️ Domain contains risky keywords.\n";
      suspiciousIndicators.push(`${label}: risky keyword in domain`);
    }

    // 4. TLD-based suspicious flags
    const riskyTlds = ["zip", "lol", "click", "work", "monster", "xyz"];
    const tld = domainParts[domainParts.length - 1];

    if (riskyTlds.includes(tld)) {
      analysis += `⚠️ Risky TLD (.${tld}) often used in phishing.\n`;
      suspiciousIndicators.push(`${label}: risky TLD`);
    }

    analysis += "----------------------------------\n";
  };

  // Run the validator on each field
  checkEmail("From", data.from);
  checkEmail("Reply-To", data.replyTo);
  checkEmail("To", data.to);
  if (data.cc) checkEmail("CC", data.cc);
  if (data.bcc) checkEmail("BCC", data.bcc);

  // Add final verdict
  if (suspiciousIndicators.length > 0) {
    analysis += "\n🚨 OVERALL VERDICT: SUSPICIOUS EMAIL DETECTED\n";
    analysis += "Reasons:\n";
    suspiciousIndicators.forEach(r => (analysis += `- ${r}\n`));
  } else {
    analysis += "\n✅ OVERALL VERDICT: Email recipients appear safe.\n";
  }

  // Store final text for UI display
  setRecipientAnalysis(analysis);
};





const handleScan = async () => {
  const text = userInput.trim();

  // 1️⃣ Basic empty check
  if (!text) {
    return triggerError("⚠️ Please paste the email content first.");
  }

  // 2️⃣ Minimum length check
  if (text.length < 30) {
    return triggerError("⚠️ Email content is too short. Paste full headers + body.");
  }

  // 3️⃣ Required header checks
  const requiredHeaders = ["From:", "To:", "Subject:"];
  for (const header of requiredHeaders) {
    if (!text.toLowerCase().includes(header.toLowerCase())) {
      return triggerError(`⚠️ Missing required header: ${header}`);
    }
  }

  // 4️⃣ Detect at least one valid email pattern
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/g;
  const foundEmails = text.match(emailRegex);

  if (!foundEmails || foundEmails.length === 0) {
    return triggerError("⚠️ No valid email addresses found in the content.");
  }

// 5️⃣ Detect suspicious broken headers (more precise)
const brokenHeaderRegex = /^(from|to|subject)\s*[^:]/im;
if (brokenHeaderRegex.test(text)) {
  return triggerError("⚠️ Email headers seem malformed or manipulated (possible spoofing).");
}

  try {
    setLoading(true);

    const response = await fetch(`${API_BASE_URL}/detect-attacker`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailContent: text }),
    });

    if (!response.ok) throw new Error("Server error");

    const data = await response.json();
    setResult(data);

  } catch (err) {
    console.error("Failed:", err);
    triggerError("❌ Unable to connect. Is your backend running?");
  } finally {
    setLoading(false);
  }
};


    const getStatusColor = (status: string = 'NOT FOUND') => {
        const s = status.toUpperCase();
        if (s === 'PASS') return 'text-emerald-500 bg-emerald-50 border-emerald-200';
        if (s === 'FAIL') return 'text-red-500 bg-red-50 border-red-200';
        return 'text-slate-400 bg-slate-50 border-slate-200';
    };


    return (
  <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex flex-col">

    {/* Header */}
    <Header
      token={localStorage.getItem("token") || ""}
      handleLogout={handleLogout}
      profileImage={profileImage}
      sidebarExpanded={sidebarExpanded}
      setSidebarExpanded={setSidebarExpanded}
    />

    <div className="flex flex-1 overflow-hidden">

      {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: sidebarExpanded ? "18rem" : "4rem" }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="bg-gradient-to-b from-gray-800 to-gray-900 text-white p-4 flex flex-col"
        >
          {[
            { label: "Analyze Malware", path: "/malware-analysis", icon: <FileSearch className="w-5 h-5" /> },
            { label: "Password Manager", path: "/dashboard", icon: <KeyRound className="w-5 h-5" /> },
            { label: "System Events Dashboard", path: "/siem-dashboard", icon: <BarChart3 className="w-5 h-5" /> },
            { label: "Security Awareness", path: "/securityAwareness", icon: <ShieldCheck className="w-5 h-5" /> },
            { label: "Contact Us", path: "/contact", icon: <Phone className="w-5 h-5" /> },
...(phishingDetectorEnabled ? [
      { label: "Phishing Detector", path: "/detect-attacker", icon: <ShieldAlert className="w-5 h-5" /> }
    ] : [])
            ].map(({ label, path, icon }) => (
            <div
              key={path}
              onClick={() => navigate(path)}
              className="relative group flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-indigo-600 transition cursor-pointer"
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

      {/* Page Content */}
      <div className="flex-1 p-6 overflow-y-auto">

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 text-white bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 rounded-lg shadow-md hover:scale-105 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200 max-w-4xl mx-auto">

          {/* Title */}
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-2 mb-2">
            <ShieldAlert className="text-blue-600" size={36} /> Phishing Detector
          </h2>
<p className="text-gray-500 text-sm mb-6">
  To check the full original email content in Gmail:<br />
  1. Open Gmail and click the email you want to inspect.<br />
  2. Click the three vertical dots (⋮) next to the Reply button.<br />
  3. Select "Show original".<br />
  4. A new tab will open showing full email headers (SPF/DKIM/DMARC results).<br />
  5. Scroll down to see the raw message body (HTML + text).<br />
  6. Copy the entire content and paste it here for analysis.
</p>



          {/* Textarea */}
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Paste full email including headers…"
            className="w-full h-64 p-5 rounded-2xl border border-gray-300 bg-gray-50 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
          />

          {/* Scan Button */}
        <button
  onClick={handleScan}
  disabled={loading || !userInput.trim()}
  className=" w-full h-14 mt-4 text-lg font-bold 
    bg-blue-600 text-white rounded-xl shadow-md 
    transition
    hover:bg-blue-700
    disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
>
  {loading ? (
    <span className="flex items-center justify-center gap-2">
      <Loader2 className="animate-spin" /> Scanning…
    </span>
  ) : (
    "Analyze Email Body"
  )}
</button>



{/* Reset */}
{result && (
  <button
    onClick={() => { setResult(null); setUserInput(""); setRecipientAnalysis(null); }}
    className="mt-3 text-sm font-semibold text-blue-600 hover:underline text-right block"
  >
    Reset Scan
  </button>
)}

          {/* Results Section */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-10 space-y-6"
              >
                
                {/* Header Authentication Status */}
                <div className="grid grid-cols-3 gap-4">
                  {["SPF", "DKIM", "DMARC"].map((h) => {
const key = h.toLowerCase() as "spf" | "dkim" | "dmarc";
                    return (
                      <div
                        key={h}
                        className={`p-4 rounded-xl border text-center shadow-sm ${getStatusColor(result.headerStats?.[key])}`}
                      >
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{h}</p>
                        <p className="text-lg font-black">{result.headerStats?.[key] ?? "N/A"}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Main Risk Card */}
                <div className={`p-8 rounded-3xl border-4 shadow-xl ${result.isAttacker ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
                  
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    
                    <div className={`p-6 rounded-2xl shadow-inner ${result.isAttacker ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {result.isAttacker ? <ShieldAlert size={48} /> : <ShieldCheck size={48} />}
                    </div>

                    <div className="flex-1 space-y-3">
                      <h3 className={`text-2xl font-black ${result.isAttacker ? 'text-red-800' : 'text-green-800'}`}>
                        {result.isAttacker ? "CYBER ATTACK LIKELY" : "EMAIL LOOKS SAFE"}
                      </h3>

                      <div className="w-full bg-gray-200 h-2 rounded-full">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${result.score}%` }}
                          className={`h-full rounded-full ${result.isAttacker ? 'bg-red-500' : 'bg-green-500'}`}
                        />
                      </div>

                      <p className="text-sm font-semibold text-gray-600">
                        Risk Score: {result.score}%
                      </p>
                    </div>

                  </div>

                  {/* Analysis Logs */}
                  <div className="mt-8 border-t pt-6 space-y-3">
                    <h4 className="text-xs font-black text-gray-500 uppercase">Analysis Logs</h4>

                    {result.detections.length === 0 ? (
                      <p className="text-sm text-gray-600 italic">No suspicious indicators found.</p>
                    ) : (
                      result.detections.map((note, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow border"
                        >
                          <AlertCircle className={result.isAttacker ? "text-red-500" : "text-green-500"} />
                          <span className="text-sm font-medium">{note}</span>
                        </motion.div>
                      ))
                    )}
                  </div>

                </div>

              </motion.div>
            )}
          </AnimatePresence>




{/* Header Fields */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">

  <div>
    <label className="text-sm font-semibold">From:</label>
    <input
      type="text"
      value={fromField}
      onChange={(e) => setFromField(e.target.value)}
      placeholder="sender@example.com"
      className="w-full p-3 rounded-xl border border-gray-300 bg-white text-sm"
    />
  </div>

  <div>
    <label className="text-sm font-semibold">Reply-To:</label>
    <input
      type="text"
      value={replyToField}
      onChange={(e) => setReplyToField(e.target.value)}
      placeholder="reply@example.com"
      className="w-full p-3 rounded-xl border border-gray-300 bg-white text-sm"
    />
  </div>

  <div>
    <label className="text-sm font-semibold">To:</label>
    <input
      type="text"
      value={toField}
      onChange={(e) => setToField(e.target.value)}
      placeholder="recipient@example.com"
      className="w-full p-3 rounded-xl border border-gray-300 bg-white text-sm"
    />
  </div>

  <div>
    <label className="text-sm font-semibold">CC:</label>
    <input
      type="text"
      value={ccField}
      onChange={(e) => setCcField(e.target.value)}
      placeholder="cc1@example.com, cc2@example.com"
      className="w-full p-3 rounded-xl border border-gray-300 bg-white text-sm"
    />
  </div>

  <div>
    <label className="text-sm font-semibold">BCC:</label>
    <input
      type="text"
      value={bccField}
      onChange={(e) => setBccField(e.target.value)}
      placeholder="bcc@example.com"
      className="w-full p-3 rounded-xl border border-gray-300 bg-white text-sm"
    />
  </div>
</div>



<button
  onClick={analyzeRecipients}
 disabled={!fromField.trim() && !toField.trim()}

  className="w-full h-12 mt-3 text-md font-semibold bg-gray-200 text-gray-800 rounded-xl shadow-sm hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
>
  Analyze Email Header Fields
</button>



{/* Separate Analyze To/CC/BCC Button */}



{recipientAnalysis && (
  <div className="mt-5 p-4 border rounded-xl bg-gray-100 font-mono text-sm whitespace-pre-wrap">
    {recipientAnalysis}
  </div>
)}

{showErrorModal && (
<ErrorModal
  message={errorMessage}
  onClose={() => setShowErrorModal(false)}
/>
)}



        </div>
      </div>
    </div>

    <Footer />
  </div>
);
}
