import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileSearch, KeyRound, BarChart3, ShieldCheck, Phone,
  Shield, Eye, ShieldAlert, Globe, ScanEye, Bot, Zap,
} from "lucide-react";
import { API_BASE_URL } from "../../services/api";

interface AppSidebarProps {
  sidebarExpanded: boolean;
  setSidebarExpanded: (v: boolean) => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ sidebarExpanded, setSidebarExpanded }) => {
  const navigate  = useNavigate();
  const location  = useLocation();

  const [phishingEnabled, setPhishingEnabled]   = useState(false);
  const [siteShieldEnabled, setSiteShieldEnabled] = useState(false);
  const [injectionEnabled, setInjectionEnabled] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/feature-flags/read`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        setPhishingEnabled(d.phishingDetectorEnabled === true);
        setSiteShieldEnabled(d.siteShieldEnabled === true);
        setInjectionEnabled(d.promptInjectionEnabled === true);
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { label: "Analyze Malware",          path: "/malware-analysis",   icon: <FileSearch  className="w-5 h-5 flex-shrink-0" /> },
    { label: "Password Manager",          path: "/dashboard",          icon: <KeyRound    className="w-5 h-5 flex-shrink-0" /> },
    { label: "System Events Dashboard",   path: "/siem-dashboard",     icon: <BarChart3   className="w-5 h-5 flex-shrink-0" /> },
    { label: "Security Awareness",         path: "/securityAwareness",  icon: <ShieldCheck className="w-5 h-5 flex-shrink-0" /> },
    { label: "Contact Us",                path: "/contact",            icon: <Phone       className="w-5 h-5 flex-shrink-0" /> },
    { label: "Prompt Privacy Scanner",    path: "/prompt-scanner",     icon: <Shield      className="w-5 h-5 flex-shrink-0" /> },
    { label: "Watch Agent",               path: "/watch-agent",        icon: <Eye         className="w-5 h-5 flex-shrink-0" /> },
    ...(phishingEnabled    ? [{ label: "Phishing Detector",   path: "/detect-attacker",  icon: <ShieldAlert className="w-5 h-5 flex-shrink-0" /> }] : []),
    ...(siteShieldEnabled  ? [{ label: "SiteShield Audit",    path: "/site-shield",      icon: <Globe       className="w-5 h-5 flex-shrink-0" /> }] : []),
    ...(injectionEnabled   ? [{ label: "AI Injection Scanner",path: "/injection-scanner",icon: <Zap         className="w-5 h-5 flex-shrink-0" /> }] : []),
    { label: "DeepFake Detector",         path: "/deepfake-detector",  icon: <ScanEye     className="w-5 h-5 flex-shrink-0" /> },
    { label: "AI Agent Scanner",          path: "/ai-agent-scanner",   icon: <Bot         className="w-5 h-5 flex-shrink-0" /> },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarExpanded ? "18rem" : "4rem" }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="bg-gradient-to-b from-gray-800 to-gray-900 text-white p-4 flex flex-col flex-shrink-0 overflow-hidden"
    >
      {/* Toggle button */}
      <button
        onClick={() => setSidebarExpanded(!sidebarExpanded)}
        className="mb-4 self-end text-gray-400 hover:text-white transition focus:outline-none"
        title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
      >
        <motion.div
          animate={{ rotate: sidebarExpanded ? 0 : 180 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </motion.div>
      </button>

      <nav className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
        {navItems.map(({ label, path, icon }) => {
          const active = location.pathname === path;
          return (
            <div
              key={path}
              onClick={() => navigate(path)}
              className={`relative group flex items-center gap-3 px-2 py-2 rounded-lg transition cursor-pointer ${
                active
                  ? "bg-indigo-600 text-white"
                  : "hover:bg-indigo-600 text-gray-300 hover:text-white"
              }`}
            >
              {icon}
              {sidebarExpanded && (
                <span className="truncate text-sm">{label}</span>
              )}
              {!sidebarExpanded && (
                <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </motion.aside>
  );
};

export default AppSidebar;
