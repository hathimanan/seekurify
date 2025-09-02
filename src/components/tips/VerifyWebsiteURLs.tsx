import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";

const VerifyWebsiteURLs: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
      {/* Header */}
      <Header
        token={localStorage.getItem("token") || ""}
        handleLogout={() => {
          localStorage.removeItem("token");
          navigate("/login");
        }}
      />

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 md:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="bg-white p-6 md:p-10 rounded-2xl shadow-lg"
        >
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-yellow-700 hover:text-yellow-800 mb-6 transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          {/* Title */}
          <h1 className="text-3xl font-bold text-yellow-700 mb-4">
            Verify Website URLs Before Entering Personal Information
          </h1>

          {/* Description */}
          <p className="text-gray-700 mb-4 leading-relaxed">
            Cybercriminals often create fake websites that look identical to real
            ones to steal your personal data. Always verify the URL before entering
            sensitive information like your credentials, banking details, or personal
            IDs.
          </p>

          {/* Steps */}
          <h2 className="text-xl font-semibold text-yellow-800 mt-6 mb-3">
            Verification Steps:
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Look for <strong>HTTPS</strong> and a secure lock icon in the URL bar.</li>
            <li>Check for typos or slight misspellings in the domain name.</li>
            <li>Manually type the URL instead of clicking on email links.</li>
            <li>Use browser security plugins or password managers to validate URLs.</li>
          </ul>
        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default VerifyWebsiteURLs;
