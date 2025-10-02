import React, { FC } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { HomePageAfter } from "../HomePageAfter/HomePageAfter";
import Footer from "../../components/ui/FooterBeforeLogin";
import dashboardPreview from "../../../src/assets/dashboard-preview.png"; // Corrected path
import {
  ShieldCheck,
  Lock,
  Activity,
  Bell,
  FileCheck,
  Link as LinkIcon,
} from "lucide-react";

export const HomePageBefore: FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

const useProtectedNavigation = () => {
  const navigate = useNavigate();

  const goToPage = (path: string) => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate(path); // user is logged in
    } else {
      navigate("/homepagebeforelogin"); // user not logged in
    }
  };

  return goToPage;
};

  if (isAuthenticated) {
    return <HomePageAfter />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between overflow-hidden relative bg-black text-white">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center items-center text-center overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-500 animate-gradient-slow z-0" />

        {/* Overlay for readability */}
        <div className="absolute inset-0 bg-black/70 z-10 backdrop-blur-sm" />

        {/* Floating Security Icons */}
        <ShieldCheck className="absolute top-20 left-10 h-16 w-16 text-indigo-400 opacity-20 animate-float-slow z-20" />
        <Lock className="absolute top-1/4 right-20 h-14 w-14 text-blue-400 opacity-15 animate-float-delay z-20" />
        <Activity className="absolute bottom-32 left-32 h-20 w-20 text-purple-400 opacity-15 animate-float-delay z-20" />

        {/* Content */}
        <div className="relative z-20 px-6">
          <h2
            onClick={() => navigate("/")}
            className="cursor-pointer flex items-center gap-2 justify-center mb-8 text-2xl sm:text-3xl font-extrabold tracking-wide"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" />
              <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
            Vaultence

          </h2>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500 leading-tight max-w-4xl mx-auto">
            Secure. Smart. Simple.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
            Vaultence empowers you with a password vault, malware scanner, and real-time threat insights — all in one seamless interface.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate("/signup")}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold shadow-lg hover:scale-105 transition-transform"
            >
              Get Started
            </button>
            <button
              onClick={() => navigate("/features")}
              className="px-8 py-3 rounded-full border border-gray-500 text-gray-300 hover:bg-gray-800 hover:text-white transition"
            >
              Learn More
            </button>
          </div>

          {/* Trust Signals */}
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-gray-400 text-sm">
            <span className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-indigo-400" /> AES-256 Encryption
            </span>
            <span className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-400" /> Zero-Knowledge Policy
            </span>
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-400" /> OWASP Compliant
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-20 py-20 px-8 text-center bg-black/70 backdrop-blur-sm">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-12">
          Why Choose Vaultence?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {[
            {
              icon: <Lock className="h-8 w-8 text-indigo-400" />,
              title: "Password Vault",
              desc: "Store, manage, and auto-generate strong passwords securely.",
            },
            {
              icon: <FileCheck className="h-8 w-8 text-indigo-400" />,
              title: "Malware Scanner",
              desc: "Upload and detect malicious files with trusted scanning logic.",
            },
            {
              icon: <LinkIcon className="h-8 w-8 text-indigo-400" />,
              title: "Link Checker",
              desc: "Verify links before clicking to avoid phishing and malware.",
            },
            {
              icon: <Bell className="h-8 w-8 text-indigo-400" />,
              title: "Real-Time Alerts",
              desc: "Stay updated with instant security notifications.",
            },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white/10 backdrop-blur-md shadow-lg hover:scale-105 transition"
            >
              <div className="flex justify-center mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-indigo-400 mb-2">{feature.title}</h3>
              <p className="text-gray-300 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="relative z-20 py-20 px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          A Dashboard Built for Security
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto mb-12">
          Monitor system logs, check vulnerabilities, and manage password health — all within a clean, intuitive interface.
        </p>
        <div className="max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-xl border border-gray-700">
          <img src={dashboardPreview} alt="Vaultence Dashboard" />
        </div>
      </section>

      {/* Awareness Section */}
      <section className="relative z-20 py-20 px-8 text-center bg-black/70 backdrop-blur-sm">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Stay Ahead of Threats
        </h2>
        <p className="text-gray-400 max-w-3xl mx-auto mb-10">
          Get the latest updates on scams, cyber attacks, and security tips through Vaultence Insights.
        </p>
        <button
          onClick={() => {
            const token = localStorage.getItem("token");
            if (token) navigate("/securityAwareness");
            else navigate("/login");
          }}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold shadow-lg hover:scale-105 transition-transform"
        >
          Visit Insights
        </button>
      </section>

      {/* Final CTA */}
      <section className="relative z-20 py-20 px-6 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">Your Security, Simplified.</h2>
        <p className="text-gray-400 max-w-2xl mx-auto mb-8">
          Start protecting your digital life today with Vaultence.
        </p>
        <button
          onClick={() => navigate("/signup")}
          className="px-10 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 text-white font-semibold shadow-lg hover:scale-105 transition-transform text-lg"
        >
          Get Started for Free
        </button>
      </section>

      {/* Footer */}
      <Footer />

      {/* Tailwind Animations */}
      <style>
        {`
          @keyframes gradient-slow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-gradient-slow {
            background-size: 300% 300%;
            animation: gradient-slow 20s ease infinite;
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
          }
          .animate-float-slow { animation: float 8s ease-in-out infinite; }
          .animate-float-delay { animation: float 12s ease-in-out infinite; }
        `}
      </style>
    </div>
  );
};
