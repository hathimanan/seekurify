import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";

const StrongPasswords: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header
        token={localStorage.getItem("token") || ""}
        handleLogout={() => {
          localStorage.removeItem("token");
          navigate("/login");
        }}
      />

      <main className="flex-1 p-6 md:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-md p-6 md:p-8"
        >
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-indigo-600 mb-4 hover:underline"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Back
          </button>

          {/* Title */}
          <h1 className="text-3xl font-bold text-indigo-700 mb-4">
            Use Strong, Unique Passwords for Each Account
          </h1>

          {/* Description */}
          <p className="text-gray-700 mb-3 leading-relaxed">
            Using strong, unique passwords is the first line of defense against
            hackers. Avoid reusing passwords across multiple sites. Use a
            combination of uppercase and lowercase letters, numbers, and special
            symbols to make your password harder to guess.
          </p>

          {/* Pro Tips */}
          <h2 className="text-xl font-semibold mt-6 mb-3 text-indigo-600">
            Pro Tips:
          </h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Use at least 12 characters in your password.</li>
            <li>Include uppercase, lowercase, numbers, and special symbols.</li>
            <li>Avoid common words or easily guessable patterns.</li>
            <li>
              Use a password manager for generating and securely storing
              passwords.
            </li>
          </ul>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default StrongPasswords;
