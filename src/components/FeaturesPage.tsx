import React, { FC } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "./ui/FooterBeforeLogin";
import { ArrowLeft } from "lucide-react";
import { Lock, Link2, FileSearch, Activity, Bell } from "lucide-react";


export const FeaturesPage: FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: "Secure Password Manager",
      description:
        "Store, manage, and generate strong encrypted passwords for better security.",
      icon: <Lock className="w-10 h-10 text-blue-400" />,
    },
    {
      title: "Link Checker",
      description:
        "Verify URLs before clicking and protect yourself from phishing and malicious links.",
      icon: <Link2 className="w-10 h-10 text-green-400" />,
    },
    {
      title: "Malware Analyzer",
      description:
        "Upload files and scan for malware or viruses using reliable detection methods.",
      icon: <FileSearch className="w-10 h-10 text-red-400" />,
    },
    {
      title: "SIEM Dashboard",
      description:
        "Monitor system activities and analyze event logs with real-time insights.",
      icon: <Activity className="w-10 h-10 text-indigo-400" />,
    },
    {
      title: "Cybersecurity Awareness",
      description:
        "Stay updated with alerts, best practices, and insights into the latest threats.",
      icon: <Bell className="w-10 h-10 text-yellow-400" />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* Hero Header */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 py-20 px-6 text-center shadow-md">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white bg-gradient-to-r from-red-500 to-red-600 px-3 py-2 rounded-lg shadow-md hover:scale-105 transition transform duration-200"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
          Seekurify Features
        </h1>
        <p className="text-lg sm:text-xl text-gray-200 max-w-3xl mx-auto">
          Core tools designed to secure your digital world.
        </p>
      </section>

      {/* Features Grid */}
      <section className="flex-1 px-6 lg:px-16 py-12 max-w-6xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              className="bg-gray-900 p-6 rounded-2xl shadow-lg flex flex-col items-center text-center"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-300 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};