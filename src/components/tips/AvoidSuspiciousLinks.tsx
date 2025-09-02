import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";

const AvoidSuspiciousLinks: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      {/* Header */}
      <Header
        token={localStorage.getItem("token") || ""}
        handleLogout={() => {
          localStorage.removeItem("token");
          navigate("/login");
        }}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8 md:p-10"
        >
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 mb-4 transition"
          >
            <ArrowLeft size={18} /> Back
          </button>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-red-600 mb-6 leading-tight">
            Avoid Clicking on Suspicious Links or Attachments
          </h1>

          {/* Description */}
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Suspicious links and attachments are one of the most common entry points for 
            <span className="font-semibold"> phishing</span> and 
            <span className="font-semibold"> malware attacks</span>. 
            Clicking on them can lead to <span className="font-semibold">data theft</span>, 
            <span className="font-semibold"> malware installation</span>, or 
            <span className="font-semibold"> financial fraud</span>.
          </p>

          {/* Subheading */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">How to Stay Safe</h2>

          {/* List of Tips */}
          <ul className="list-disc pl-6 space-y-3 text-gray-700">
            <li className="hover:text-red-600 transition">
              Always check the sender's email address before clicking links.
            </li>
            <li className="hover:text-red-600 transition">
              Hover over links to preview their URL before opening them.
            </li>
            <li className="hover:text-red-600 transition">
              Never download attachments from unknown or untrusted sources.
            </li>
            <li className="hover:text-red-600 transition">
              Use email filters and antivirus tools for added protection.
            </li>
          </ul>
        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AvoidSuspiciousLinks;
