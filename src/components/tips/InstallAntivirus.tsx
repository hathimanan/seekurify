import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";

const InstallAntivirus: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
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
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 mb-4 transition"
          >
            <ArrowLeft size={18} /> Back
          </button>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-green-600 mb-6 leading-tight">
            Install Antivirus Software and Run Regular Scans
          </h1>

          {/* Description */}
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Antivirus software protects your devices by detecting and removing
            <span className="font-semibold"> malicious software</span>. Regular
            scans help detect threats that might bypass
            <span className="font-semibold"> real-time protection</span>.
          </p>

          {/* Subheading */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            How to Implement
          </h2>

          {/* Tips List */}
          <ul className="list-disc pl-6 space-y-3 text-gray-700">
            <li className="hover:text-green-600 transition">
              Install a <span className="font-semibold">trusted antivirus</span>{" "}
              from a reputable vendor.
            </li>
            <li className="hover:text-green-600 transition">
              Schedule <span className="font-semibold">weekly</span> or{" "}
              <span className="font-semibold">bi-weekly full system scans</span>.
            </li>
            <li className="hover:text-green-600 transition">
              Update <span className="font-semibold">virus definitions</span>{" "}
              regularly to stay protected.
            </li>
            <li className="hover:text-green-600 transition">
              Enable <span className="font-semibold">real-time scanning</span> to
              block threats instantly.
            </li>
          </ul>
        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default InstallAntivirus;
