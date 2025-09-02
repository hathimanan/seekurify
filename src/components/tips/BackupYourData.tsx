import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";

const BackupYourData: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100">
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
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 mb-4 transition"
          >
            <ArrowLeft size={18} /> Back
          </button>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-600 mb-6 leading-tight">
            Regularly Backup Your Data
          </h1>

          {/* Description */}
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Data loss can occur due to 
            <span className="font-semibold"> accidental deletion</span>, 
            <span className="font-semibold"> hardware failure</span>, 
            <span className="font-semibold"> ransomware</span>, or 
            <span className="font-semibold"> cyberattacks</span>. 
            Regular backups ensure your important files remain 
            <span className="font-semibold"> safe and recoverable</span>.
          </p>

          {/* Subheading */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Backup Strategies
          </h2>

          {/* List of Tips */}
          <ul className="list-disc pl-6 space-y-3 text-gray-700">
            <li className="hover:text-indigo-600 transition">
              Follow the <span className="font-semibold">3-2-1 backup rule</span>: 3 copies, 2 different mediums, 1 offsite.
            </li>
            <li className="hover:text-indigo-600 transition">
              Use <span className="font-semibold">cloud backup solutions</span> with encryption for security.
            </li>
            <li className="hover:text-indigo-600 transition">
              Regularly <span className="font-semibold">test your backups</span> for integrity and accessibility.
            </li>
            <li className="hover:text-indigo-600 transition">
              Schedule <span className="font-semibold">automatic backups</span> to reduce manual effort.
            </li>
          </ul>
        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default BackupYourData;

