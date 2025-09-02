import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";

const KeepDevicesUpdated: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
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
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-4 transition"
          >
            <ArrowLeft size={18} /> Back
          </button>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-600 mb-6 leading-tight">
            Keep Your Devices and Apps Updated Regularly
          </h1>

          {/* Description */}
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Regular updates patch <span className="font-semibold">vulnerabilities</span> 
            that hackers often exploit. Neglecting updates makes your systems 
            susceptible to <span className="font-semibold">ransomware</span>, 
            <span className="font-semibold"> data breaches</span>, or 
            <span className="font-semibold"> performance issues</span>.
          </p>

          {/* Subheading */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Best Practices
          </h2>

          {/* Tips List */}
          <ul className="list-disc pl-6 space-y-3 text-gray-700">
            <li className="hover:text-blue-600 transition">
              Enable <span className="font-semibold">automatic updates</span> for operating systems and apps.
            </li>
            <li className="hover:text-blue-600 transition">
              Update your <span className="font-semibold">antivirus definitions</span> regularly.
            </li>
            <li className="hover:text-blue-600 transition">
              Remove <span className="font-semibold">outdated software</span> or plugins that you no longer use.
            </li>
            <li className="hover:text-blue-600 transition">
              Stay informed about <span className="font-semibold">critical security patches</span>.
            </li>
          </ul>
        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default KeepDevicesUpdated;

