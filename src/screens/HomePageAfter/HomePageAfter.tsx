import React, { JSX, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, apiService } from "../../services/api";
import { motion } from "framer-motion";
import Header from "../../components/ui/Header";
import Footer from "../../components/ui/Footer";
import { ChevronRight, ShieldAlert } from "lucide-react";
import {
  FileSearch,
  KeyRound,
  BarChart3,
  ShieldCheck,
  Phone,
} from "lucide-react";
// import defaultProfileIcon from "../../../src/assets/default-profile.png"; // fallback image

export const HomePageAfter = (): JSX.Element => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [profileImage, setProfileImage] = useState<string>(""); // ✅ state for header
  const [showPinModal, setShowPinModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pinChecked, setPinChecked] = useState(false);
  const [showPasswordExpiryModal, setShowPasswordExpiryModal] = useState(false);
  const [expireAfterDays, setExpireAfterDays] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true); // ✅ sidebar toggle state
const [darkMode, setDarkMode] = useState(false);


  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!token) return;

        const saved = localStorage.getItem("darkMode");
  if (saved === "true") {
    document.documentElement.classList.add("dark");
    setDarkMode(true);
  }

      try {
        const res = await fetch(`${API_BASE_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Guard against 204 / non-JSON responses
        if (res.status === 204) {
          console.warn('Profile endpoint returned 204 No Content');
          return;
        }
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          console.warn('Profile response not JSON:', res.status, contentType);
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();


        if (data.profileImage) setProfileImage(data.profileImage);
        if (data.isPasswordExpired === true) {
          setExpireAfterDays(data.expireAfterDays);
          setShowPasswordExpiryModal(true);
        }

        if (data.expireAfterDays !== undefined && data.expireAfterDays <= 0) {
  setExpireAfterDays(data.expireAfterDays);
  setShowPasswordExpiryModal(true);
}
      } catch (err) {
        console.error("Failed to load profile image:", err);
      }
    };

    fetchProfileImage();
  }, [token]);

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
  
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleChangePin = () => {
    setShowPinModal(false);
    navigate(`/set-new-pin?token=${token}`);
  };

  const useProtectedNavigation = (path: any) => {
    const navigate = useNavigate();

    const goToPage = () => {
      const token = localStorage.getItem("token");
      if (token) {
        navigate(path); // user is logged in
      } else {
        navigate("/homepagebeforelogin"); // user not logged in
      }
    };
    return goToPage;
  };

  const handleCloseModal = () => setShowPinModal(false);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-semibold">Loading...</div>;

  return (
<div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <title> Seekurify Home</title>
      {showPasswordExpiryModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full text-center"
    >
      <h2 className="text-2xl font-bold text-red-600 mb-3">
        Password Expired
      </h2>

      <p className="text-gray-700 mb-5">
        Your account password has expired.  
        Please update it immediately to keep your account secure.
      </p>

      <button
        onClick={() => navigate("/change-password")}
        className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 shadow"
      >
        Change Password
      </button>

      <div className="mt-3">
        <button
          onClick={() => setShowPasswordExpiryModal(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          Later
        </button>
      </div>
    </motion.div>
  </div>
)}

      <Header
        token={token || ""}
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

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-6 rounded-2xl shadow-2xl text-center max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Set a New PIN</h2>
            <p className="text-gray-700 mb-6">You are using the default PIN. For your security, please change it.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => useProtectedNavigation(handleChangePin)} className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 shadow">Change PIN</button>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">Later</button>
            </div>
          </motion.div>
        </div>
      )}

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
            { label: "Phishing Detector", path: "/detect-attacker", icon: <ShieldAlert className="w-5 h-5" /> },
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



        {/* Main Content */}
        <div className="flex-1 p-10">
          <motion.div
            className="bg-gradient-to-r from-blue-100 to-indigo-100 text-center py-4 rounded-2xl text-2xl font-bold text-indigo-800 mb-8 shadow-lg"
            whileHover={{ scale: 1.02 }}
          >
            About Seekurify
          </motion.div>

          <section className="bg-white py-12 px-6 md:px-20 rounded-xl shadow-lg">
            <div className="max-w-5xl mx-auto text-center">
              <div className="w-12 h-12 bg-yellow-400 rotate-45 mx-auto mb-6 rounded-md shadow-md"></div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-7 leading-snug">
                Secure passwords. Smarter protection. Full control.
              </h2>



              <div className="max-w-3xl mx-auto text-center px-6">
                {/* Decorative line */}
                <div className="w-28 h-1.5 bg-gradient-to-r from-indigo-400 to-indigo-600 mx-auto mb-10 rounded-full shadow-md"></div>

                {/* Main Content */}
                <p className="text-gray-700 text-lg leading-relaxed tracking-wide space-y-6 text-justify">
                  <span className="font-extrabold text-indigo-600">Seekurify</span> is an
                  all-in-one cybersecurity platform designed to empower users with advanced
                  tools and essential knowledge to stay secure in the digital world. Our core
                  mission is twofold: strengthen security through robust features and promote
                  cybersecurity awareness with accessible insights.
                </p>

                <p className="text-gray-700 text-lg leading-relaxed tracking-wide space-y-6 text-justify mt-6">
                  At the heart of the platform lies a
                  <span className="font-semibold text-indigo-500"> secure password manager</span>,
                  enabling users to store, manage, and organize their credentials in an
                  encrypted vault. With built-in strong password generation and advanced
                  hashing techniques, Seekurify promotes better password hygiene and maximum
                  protection.
                </p>

                {/* Features List */}
                <div className="mt-8 text-left bg-gray-50 border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Key Security Utilities</h3>
                  <ul className="list-disc list-inside space-y-3 text-gray-800 text-base">
                    <li>
                      <span className="font-semibold text-indigo-600">Link Checker:</span>
                      Instantly verify if a URL is safe or malicious before clicking.
                    </li>
                    <li>
                      <span className="font-semibold text-indigo-600">File & Malware Scanner:</span>
                      Upload and scan files to detect viruses or malware using trusted detection logic.
                    </li>
                    <li>
                      <span className="font-semibold text-indigo-600">System Dashboard:</span>
                      Monitor system events, track logs, and gain insights into potential threats.
                    </li>
                  </ul>
                </div>

                <p className="text-gray-700 text-lg leading-relaxed tracking-wide mt-8 text-justify">
                  Beyond tools, Seekurify provides real-time alerts and educational content
                  to keep users updated on the latest threats, scams, and cybersecurity best practices.
                </p>

                <p className="text-gray-700 text-lg leading-relaxed tracking-wide mt-6 text-justify">
                  Whether you’re an individual strengthening personal safety or a developer
                  embedding secure practices, <span className="font-extrabold text-indigo-600">Seekurify</span>
                  <> </>delivers a modern, user-focused approach to cybersecurity—all in one seamless interface.
                </p>
              </div>

              {/* <div className="flex justify-center flex-wrap gap-4 mt-10">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="bg-red-600 text-white py-3 px-6 rounded-xl hover:bg-red-700 shadow-lg"
                  onClick={() => useProtectedNavigation("/malware-analysis")}
                >
                  Analyze Malware
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="bg-indigo-600 text-white py-3 px-6 rounded-xl hover:bg-indigo-700 shadow-lg"
                  onClick={() => useProtectedNavigation("/siem-dashboard")}
                >
                  Explore SIEM Dashboard
                </motion.button>
              </div> */}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};
