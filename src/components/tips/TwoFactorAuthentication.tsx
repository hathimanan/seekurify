import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";

const TwoFactorAuthentication: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 via-white to-indigo-100">
      <Header
        token={localStorage.getItem("token") || ""}
        handleLogout={() => {
          localStorage.removeItem("token");
          navigate("/login");
        }}
      />

      <main className="flex-grow container mx-auto px-4 py-8">
        <motion.div
          className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-6 md:p-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </button>

          {/* Page Title */}
          <h1 className="text-3xl font-extrabold text-indigo-700 mb-4">
            Enable Two-Factor Authentication (2FA)
          </h1>

          {/* Intro Description */}
          <p className="text-gray-700 mb-4 leading-relaxed">
            Two-factor authentication adds an extra layer of security by
            requiring a second factor, such as a code from an authenticator app
            or SMS, in addition to your password. Even if your password is
            compromised, 2FA can protect your account.
          </p>

          {/* App Recommendations */}
          <p className="text-gray-700 mb-4 leading-relaxed">
            Use app-based authenticators like{" "}
            <span className="font-semibold text-indigo-600">
              Google Authenticator
            </span>
            ,{" "}
            <span className="font-semibold text-indigo-600">Authy</span>, or{" "}
            <span className="font-semibold text-indigo-600">
              Microsoft Authenticator
            </span>{" "}
            for stronger security compared to SMS-based codes.
          </p>

          {/* Benefits List */}
          <h2 className="text-xl font-semibold text-indigo-700 mt-6 mb-3">
            Benefits of 2FA:
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Protects against credential theft.</li>
            <li>
              Prevents unauthorized access even if your password is leaked or
              guessed.
            </li>
            <li>
              Supports multiple verification methods: app, SMS, email, or
              hardware keys.
            </li>
          </ul>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default TwoFactorAuthentication;
