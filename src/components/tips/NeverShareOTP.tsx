import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";

const NeverShareOTP: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
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
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 mb-4 transition"
          >
            <ArrowLeft size={18} /> Back
          </button>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-purple-600 mb-6 leading-tight">
            Never Share Your OTP or Banking PIN
          </h1>

          {/* Description */}
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            OTPs (<span className="font-semibold">One-Time Passwords</span>) and
            PINs are confidential security codes used to verify your identity.
            Sharing them with anyone puts your
            <span className="font-semibold"> accounts</span> and
            <span className="font-semibold"> finances</span> at serious risk.
          </p>

          {/* Subheading */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Safety Guidelines
          </h2>

          {/* Tips List */}
          <ul className="list-disc pl-6 space-y-3 text-gray-700">
            <li className="hover:text-purple-600 transition">
              Never share <span className="font-semibold">OTPs</span> or
              <span className="font-semibold"> PINs</span> over calls, messages, or emails.
            </li>
            <li className="hover:text-purple-600 transition">
              Remember: <span className="font-semibold">Banks</span> and official organizations 
              never ask for your OTP.
            </li>
            <li className="hover:text-purple-600 transition">
              Report any <span className="font-semibold">suspicious requests</span> for your OTP 
              to your bank immediately.
            </li>
            <li className="hover:text-purple-600 transition">
              Use <span className="font-semibold">strong and unique PINs</span> for different accounts.
            </li>
          </ul>
        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default NeverShareOTP;
