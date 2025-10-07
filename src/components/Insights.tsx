import React from "react";
import { ShieldAlert, AlertTriangle, Lock, Globe, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";


const stats = [
  {
    id: 1,
    icon: <ShieldAlert size={50} className="text-red-600" />,
    number: "11s",
    label: "A cyber attack occurs every",
    highlight: "seconds",
  },
  {
    id: 2,
    icon: <AlertTriangle size={50} className="text-yellow-500" />,
    number: "80%",
    label: "Breaches caused by",
    highlight: "human error",
  },
  {
    id: 3,
    icon: <Lock size={50} className="text-blue-600" />,
    number: "$4.45M",
    label: "Average global data breach cost",
    highlight: "(2024)",
  },
  {
    id: 4,
    icon: <Globe size={50} className="text-green-600" />,
    number: "2200+",
    label: "Attacks happen daily worldwide",
    highlight: "",
  },
];

const Insights: React.FC = () => {
    const navigate = useNavigate();

 return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col">
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex flex-col items-center px-6 py-12">

    <div className="mb-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 rounded-lg mb-6">
          <ArrowLeft className="w-5 h-5"/> Back
        </button>
    </div>
    {/* Back Button - top left */}



      <h1 className="text-4xl sm:text-5xl font-extrabold mb-12 text-center">
        Cybersecurity Insights
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl">
        {stats.map((stat) => (
          <motion.div
            key={stat.id}
            className="flex flex-col items-center justify-center p-8 rounded-2xl shadow-lg bg-gradient-to-b from-gray-800 to-gray-900 hover:scale-105 transition-transform duration-300"
            whileHover={{ y: -8 }}
          >
            <div className="mb-4">{stat.icon}</div>
            <h2 className="text-5xl sm:text-6xl font-extrabold text-indigo-400">
              {stat.number}
            </h2>
            <p className="mt-3 text-center text-lg">
              {stat.label}{" "}
              <span className="font-bold text-indigo-300">{stat.highlight}</span>
            </p>
          </motion.div>
        ))}
      </div>

      <p className="mt-12 text-gray-400 text-center max-w-2xl">
        * Data based on 2024–2025 global reports on cybersecurity breaches,
        attacks, and trends.
      </p>
    </div>
    </div>
  );
};

export default Insights;
