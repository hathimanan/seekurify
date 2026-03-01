import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";
import { ArrowLeft, BarChart3, FileSearch, KeyRound, Phone, ShieldAlert, ShieldCheck } from "lucide-react";
import { API_BASE_URL } from '../services/api';
import SecurityChatbotIcon from "./ui/ChatbotIcon";
import BotChat from "./ui/BotChat";
import { tips } from '../config/securityTips';

interface Attack {
  title: string;
  date: string;
  description: string;
  link: string;
}

interface MediumArticle {
  title: string;
  date: string;
  description: string;
  link: string;
}


interface HeaderProps {
  token: string;
  handleLogout: () => void;
  profileImage?: string; // ✅ new prop
}


interface Tip {  // Rename from 'tips' to 'Tip' for proper naming convention
  title: string;
  text: string;
  description: string;
  proTips?: string[];
  importance?: string[];
  realLifeExample?: string;
  link?: string;
  quickTips?: string[];
  bestPractices?: string[];
  backupMethods?: string[];
  backupFrequency?: string;
  backupStrategies?: string[];
  whyBackupsMatter?: string;
  additionalTip?: string;
  additionalTips?: string[];
  verificationSteps?: string[];
  publicWifiRisks?: string[];
  safePractices?: string[];
  otpRisks?: string[];
  antivirusBenefits?: string[];
  updateBenefits?: string[];
  authenticationMethods?: string[];
  passwordTips?: string[];
  passwordBenefits?: string[];
  authenticationBenefits?: string[];
  urlVerificationSteps?: string[];
  urlAdditionalTips?: string[];
  urlFinalNote?: string;
  howTo?: string[];
  tools?: string[];
  recoverySteps?: string[];
  quickTip?: string;
  signs?: string[];
  reference?: string[];
}

const mockRecentAttacks: Attack[] = [
  {
    title: "Workday Breach via Social Engineering",
    date: "August 2025",
    description:
      "HR platform Workday was compromised in a phishing campaign that exposed customer names, emails, and phone numbers.",
    link: "https://www.techradar.com/pro/security/hackers-breach-hr-firm-workday-is-it-the-latest-salesforce-crm-attack-victim",
  },
  {
    title: "Colt Telecom Hit by Warlock Ransomware",
    date: "August 2025",
    description:
      "UK’s Colt Technology Services suffered a ransomware attack exploiting a Microsoft SharePoint vulnerability.",
    link: "https://www.itpro.com/security/cyber-attacks/uk-telecoms-firm-takes-systems-offline-after-cyber-attack",
  },
  {
    title: "ShinyHunters Breach Impacts Google Salesforce Data",
    date: "August 2025",
    description:
      "Google was among victims of the ShinyHunters Salesforce breach, exposing sensitive small-business contact data.",
    link: "https://www.itpro.com/security/cyber-attacks/google-cyber-researchers-were-tracking-the-shinyhunters-groups-salesforce-attacks-then-realized-theyd-fallen-victim",
  },
  {
    title: "Marks & Spencer Recovers After £300m Cyberattack Loss",
    date: "August 2025",
    description:
      "M&S online services are back after an April attack that caused significant losses, showing the long-term impact of breaches.",
    link: "https://www.reuters.com/business/retail-consumer/ms-food-sales-growth-accelerates-cyber-hack-impact-fades-nielseniq-data-shows-2025-08-20",
  },
  {
    title: "AI Deepfake Scams Target Global Corporates",
    date: "August 2025",
    description:
      "Fraudsters using AI-powered deepfakes to impersonate executives have caused global companies losses exceeding $200m.",
    link: "https://www.wsj.com/articles/ai-drives-rise-in-ceo-impersonator-scams-2bd675c4",
  },
];

const mockMediumArticles: MediumArticle[] = [
  {
    title: "Security in the Era of Phishing",
    date: "August 2025",
    description:
      "Insights into phishing tactics and how to safeguard against evolving threats.",
    link: "https://medium.com/@hathimanan/security-in-the-era-of-phishing-75203e5c92c9",
  },
  {
    title: "Ransomware Attacks and Akira",
    date: "August 2025",
    description:
      "Exploring the Akira ransomware group and the broader impact of ransomware on organizations.",
    link: "https://medium.com/@hathimanan/ransomware-attacks-and-akira-ec9ef87737d8",
  },
  {
    title: "Security – The Core Aspect of Our Data",
    date: "July 2025",
    description:
      "Understanding why security is the foundation of modern digital trust.",
    link: "https://medium.com/@hathimanan/security-the-core-aspect-of-our-data-56843d7d040f",
  },
  {
    title: "Data Security Chapter 2: Fundamentals of Security",
    date: "July 2025",
    description:
      "A deep dive into the essential principles and practices of data security.",
    link: "https://medium.com/@hathimanan/data-security-chapter-2-fundamentals-of-security-5de97f0f0fb1",
  },
  {
    title: "AI, Cloud Computing & Cybersecurity – The Thin Line Between Them",
    date: "June 2025",
    description:
      "Exploring the intersection of AI, cloud, and cybersecurity in the digital era.",
    link: "https://medium.com/@hathimanan/ai-cloud-computing-cybersecurity-the-thin-line-between-them-f47ea204e875",
  },
];

export const SecurityAwareness: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [profileImage, setProfileImage] = useState<string>(""); // ✅ state for header
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const [selectedTip, setSelectedTip] = useState<Tip | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
const [featureFlags, setFeatureFlags] = useState({
  securityChatbotEnabled: false,
  // ... other flags
});

      const [phishingDetectorEnabled, setPhishingDetectorEnabled] = useState<boolean>(false);
      const [featuresLoaded, setFeaturesLoaded] = useState(false);
  

  const openModal = (tip: Tip) => {
    setSelectedTip(tip);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedTip(null);
    setIsModalOpen(false);
  };


useEffect(() => {
  const fetchFeatureFlags = async () => {
    try {
      const response = await fetch('/api/feature-flags/read');
      const data = await response.json();
      setFeatureFlags(data);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
    }
  };

  fetchFeatureFlags();
}, []);

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

  const token = localStorage.getItem('token');
  useEffect(() => {



      const saved = localStorage.getItem("darkMode");
  if (saved === "true") {
    document.documentElement.classList.add("dark");
    setDarkMode(true);
  }


    let isMounted = true; // prevent state updates after unmount

    // Interval for rotating attacks
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % mockRecentAttacks.length);
    }, 4000);

    // Fetch profile image safely
    const fetchProfileImage = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_BASE_URL}/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          console.error("Failed to fetch profile:", res.status, res.statusText);
          return;
        }

        const data = await res.json();
        if (isMounted && data?.profileImage) {
          setProfileImage(data.profileImage); // ✅ update state safely
        }
      } catch (err) {
        console.error("Error fetching profile image:", err);
      }
    };

    fetchProfileImage();

    return () => {
      clearInterval(interval);
      isMounted = false;
    };
  }, []); // no token dependency needed, read it directly inside effect

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


  const handleLogout = async () => {
    try {
      // Call backend to clear cookies (if using httpOnly or session cookies)
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include', // important to include cookies
      });
    } catch (err) {
      console.error('Failed to call logout endpoint', err);
    } finally {
      // Remove token from localStorage
      localStorage.removeItem('token');
      // Redirect to login
      navigate('/login');
    }
  };

  return (
<div className="min-h-screen flex flex-col 
  bg-gradient-to-br from-indigo-100 via-white to-pink-100
  dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-700
  text-gray-900 dark:text-gray-100">
      <title> Security Awareness </title>
      <Header
        token={localStorage.getItem("token") || ""}
        handleLogout={handleLogout}
        profileImage={profileImage} // ✅ pass state
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
      />

    <div className="flex justify-end px-6 py-3 border-b border-gray-200 dark:border-gray-800">
      <button
        onClick={toggleDarkMode}
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
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

          {/* Expand/Collapse */}
          {/* <div
            onClick={() => setSidebarExpanded((s) => !s)}
            className="flex items-center justify-center mt-auto cursor-pointer bg-white/10 hover:bg-white/20 px-2 py-2 rounded-md transition relative group"
          >
            {sidebarExpanded ? "Collapse" : "Expand"}
            {!sidebarExpanded && (
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
                {sidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
              </span>
            )}
          </div> */}
        </motion.aside>


        <div className="mt-6 ml-6 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 rounded-lg shadow-md hover:scale-105 transition-transform duration-200"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        </div>


        <main className="flex-grow px-6 py-6 max-w-6xl mx-auto">
          {/* Page Header */}
          <header className="text-center mb-12">
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-600 drop-shadow-md">
              Stay Safe Online
            </h1>
            <p className="text-gray-600 mt-2 text-lg">
              Simple steps to protect your digital life
            </p>
          </header>

          {/* Security Tips */}
          <section className="mb-14 border rounded-2xl p-6 bg-white/70 shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-indigo-700">
              Steps to Stay Secure Online
            </h2>

            {/* Tip Cards */}
            <ul className="grid md:grid-cols-2 gap-5">
              {tips.map((tip, index) => (
                <li
                  key={index}
                  className="bg-white shadow-md hover:shadow-lg p-4 rounded-xl border-l-4 border-indigo-500 hover:border-pink-500 
              transition-all duration-300 cursor-pointer hover:bg-gray-100"
                  onClick={() => openModal(tip)}
                >
                  <span className="font-medium text-gray-800">✅ {tip.title}</span>
                </li>
              ))}
            </ul>

            {/* Modal */}
            {isModalOpen && selectedTip && (
              <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
                <div className="bg-white rounded-2xl shadow-lg p-6 w-11/12 md:w-1/2 max-h-[80vh] overflow-auto relative animate-fadeIn">
                  <button
                    onClick={closeModal}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
                  >
                    ✖
                  </button>

                  <h3 className="text-2xl font-semibold mb-4 text-indigo-700">
                    {selectedTip.title}
                  </h3>

                  <div className="text-gray-700 whitespace-pre-line space-y-4">
                    {/* Description */}
                    <p>{selectedTip.description}</p>

                    {/* Importance */}
                    {selectedTip.importance && selectedTip.importance.length > 0 && (
                      <div>
                        <h4 className="font-semibold">Why it Matters:</h4>
                        <ul className="list-disc list-inside">
                          {selectedTip.importance.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Pro Tips */}
                    {selectedTip.proTips && selectedTip.proTips.length > 0 && (
                      <div>
                        <h4 className="font-semibold">Pro Tips:</h4>
                        <ul className="list-disc list-inside">
                          {selectedTip.proTips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}


                    {selectedTip.bestPractices && selectedTip.bestPractices.length > 0 && (
                      <div>
                        <h4 className="font-semibold">Best Practices:</h4>
                        <ul className="list-disc list-inside">
                          {selectedTip.bestPractices.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* How To */}
                    {selectedTip.howTo && selectedTip.howTo.length > 0 && (
                      <div>
                        <h4 className="font-semibold">How To:</h4>
                        <ol className="list-decimal list-inside">
                          {selectedTip.howTo.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}

{/* Signs */}
{selectedTip.signs && selectedTip.signs.length > 0 && (
  <div className="mt-4">
    <h4 className="font-semibold text-red-600">Signs:</h4>
    <ul className="list-disc list-inside">
      {selectedTip.signs.map((sign, idx) => (
        <li key={idx}>{sign}</li>
      ))}
    </ul>
  </div>
)}



                    {/* Quick Tip */}
                    {selectedTip.quickTip && (
                      <p className="italic font-medium">💡 Quick Tip: {selectedTip.quickTip}</p>
                    )}

                    {/* Real Life Example */}
                    {selectedTip.realLifeExample && (
                      <p className="mt-2 text-gray-800">📖 {selectedTip.realLifeExample}</p>
                    )}

                    {/* Tools */}
                    {selectedTip.tools && selectedTip.tools.length > 0 && (
                      <div>
                        <h4 className="font-semibold">Recommended Tools:</h4>
                        <ul className="list-disc list-inside">
                          {selectedTip.tools.map((tool, idx) => (
                            <li key={idx}>{tool}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recovery Steps */}
                    {selectedTip.recoverySteps && selectedTip.recoverySteps.length > 0 && (
                      <div>
                        <h4 className="font-semibold">Recovery Steps:</h4>
                        <ol className="list-decimal list-inside">
                          {selectedTip.recoverySteps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}

{/* References */}
{selectedTip.reference && selectedTip.reference.length > 0 && (
  <div className="mt-4">
    <h4 className="font-semibold text-blue-700">References:</h4>
    <ul className="list-disc list-inside">
      {selectedTip.reference.map((ref, idx) => (
        <li key={idx}>
          <a
            href={ref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            {ref}
          </a>
        </li>
      ))}
    </ul>
  </div>
)}



                  </div>
                </div>
              </div>
            )}

          </section>



          {/* Account Breach Checker */}
          <section className="mb-14 border rounded-2xl p-6 bg-white/80 shadow-md text-center">
            <h2 className="text-2xl font-semibold mb-4 text-purple-700">
              Check if Your Account Has Been Breached
            </h2>
            <p className="mb-4 text-gray-700">
              Visit the official Have I Been Pwned website to see if your email or
              account has been involved in a data breach.
            </p>
            <button
              onClick={() =>
                window.open("https://www.haveibeenpwned.com/", "_blank")
              }
              className="bg-purple-500 text-white px-6 py-3 rounded hover:bg-purple-600 transition-colors"
            >
              Go to Have I Been Pwned
            </button>
          </section>

          {/* Recent Cyber Attacks */}
          <section className="mb-14 border rounded-2xl p-6 bg-gradient-to-r from-red-100 to-rose-200 shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-rose-700">
              Recent Cyber Attacks
            </h2>
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white/80 p-6 rounded-xl shadow-md"
            >
              <h3 className="text-lg font-bold text-red-900 mb-1">
                {mockRecentAttacks[current].title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {mockRecentAttacks[current].date}
              </p>
              <p className="mb-3">{mockRecentAttacks[current].description}</p>
              <a
                href={mockRecentAttacks[current].link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-700 font-medium hover:underline"
              >
                🔗 Read more →
              </a>
            </motion.div>
          </section>

          {/* Medium Articles */}
          <section className="border rounded-2xl p-6 bg-white/70 shadow-md">
            <h2 className="text-2xl font-semibold mb-6 text-green-700">
              Latest Medium Articles
            </h2>
            <div className="overflow-hidden">
              <motion.div
                className="flex gap-6"
                animate={{ x: ["0%", "-100%"] }}
                transition={{
                  ease: "linear",
                  duration: 22,
                  repeat: Infinity,
                }}
              >
                {mockMediumArticles.concat(mockMediumArticles).map(
                  (article, index) => (
                    <div
                      key={index}
                      className="min-w-[320px] bg-white rounded-xl shadow-md hover:shadow-xl p-6 transition-all duration-300"
                    >
                      <h3 className="font-bold text-lg text-green-800">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-500">{article.date}</p>
                      <p className="mt-2 text-gray-700">{article.description}</p>
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-3 text-indigo-600 hover:underline font-medium"
                      >
                        Read on Medium →
                      </a>
                    </div>
                  )
                )}
              </motion.div>
            </div>
            <p className="text-gray-500 text-sm mt-3 text-center">
              📰 Articles auto-scroll continuously
            </p>
          </section>
        </main>

        {/* Add fixed SecurityChatbotIcon */}
        {featureFlags.securityChatbotEnabled && (
  <div
    className="fixed bottom-8 right-8 z-50 cursor-pointer"
    onClick={() => setIsOpen(!isOpen)}
  >
    <SecurityChatbotIcon />
  </div>
)}

        {/* Chat Window */}
        {/* {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition"
          >
            Chat with Nick 💬
          </button>
        )} */}

        {/* Chat Window */}
        {isOpen && (
          <div
            className={`fixed z-50 bg-white rounded-xl shadow-xl flex flex-col overflow-hidden transition-all duration-300 ease-in-out
      ${isFullScreen
                ? "inset-0 w-full h-full m-0 rounded-none" // Fullscreen mode
                : "bottom-20 right-4 sm:right-8 sm:bottom-24 w-[90vw] h-[75vh] sm:w-96 sm:h-[500px]" // Responsive size
              }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-3 bg-blue-600 text-white">
              <span className="font-semibold text-sm sm:text-base">Chat with Nick</span>
              <div className="flex space-x-3">
                {/* Fullscreen Toggle */}
                <button
                  onClick={() => setIsFullScreen((prev) => !prev)}
                  className="text-lg font-bold hover:text-gray-200 transition"
                  title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
                >
                  {isFullScreen ? "🗕" : "🗖"}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-lg font-bold hover:text-gray-200 transition"
                  title="Close Chat"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-hidden">
              <BotChat />
            </div>
          </div>
        )}


      </div>
      <Footer />
    </div>
  );
};
