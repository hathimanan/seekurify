import React  from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";

const AvoidPublicWiFi: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
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
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 mb-4 transition"
          >
            <ArrowLeft size={18} /> Back
          </button>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-orange-600 mb-6 leading-tight">
            Avoid Accessing Sensitive Information Over Public Wi-Fi
          </h1>

          {/* Description */}
          <p className="text-gray-700 text-lg leading-relaxed mb-6">
            Public Wi-Fi networks are often <span className="font-semibold">unsecured</span>, making it easier for hackers to intercept your data. 
            Using them for sensitive tasks like <span className="font-semibold">online banking</span> or 
            <span className="font-semibold"> shopping</span> is highly risky.
          </p>

          {/* Subheading */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Secure Practices</h2>

          {/* List of Tips */}
          <ul className="list-disc pl-6 space-y-3 text-gray-700">
            <li className="hover:text-orange-600 transition">Use a VPN when connected to public Wi-Fi.</li>
            <li className="hover:text-orange-600 transition">Avoid logging into bank accounts or making online payments.</li>
            <li className="hover:text-orange-600 transition">Disable file sharing and Bluetooth when not needed.</li>
            <li className="hover:text-orange-600 transition">Use mobile data for sensitive activities instead of public Wi-Fi.</li>
          </ul>
        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AvoidPublicWiFi;
