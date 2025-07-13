import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export const HomePageAfter = (): JSX.Element => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <div className="bg-blue-600 text-white flex justify-between items-center px-6 py-4">
        <h1 className="text-2xl font-bold">Securify</h1>
        <button
          onClick={handleLogout}
          className="bg-white text-blue-600 font-medium py-2 px-4 rounded hover:bg-gray-100"
        >
          Logout
        </button>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="bg-gray-600 text-white w-64 p-6 space-y-4 font-semibold text-lg">
          <div className="hover:text-yellow-300 cursor-pointer">Home Page</div>
          <div className="hover:text-yellow-300 cursor-pointer">About Securify</div>
          <div className="hover:text-yellow-300 cursor-pointer">Analyze Malware</div>
          <div className="hover:text-yellow-300 cursor-pointer">Password Manager</div>
          <div className="hover:text-yellow-300 cursor-pointer">SIEM Dashboard</div>
          <div className="hover:text-yellow-300 cursor-pointer">Security Awareness</div>
          <div className="hover:text-yellow-300 cursor-pointer">Contact Us</div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 bg-white">
          <div className="bg-gray-200 text-center py-4 rounded text-xl font-semibold mb-6">
            About Securify
          </div>

          <div className="bg-gray-300 h-64 rounded border border-blue-500 mb-6"></div>

          <div className="flex gap-6 justify-center">
            <button
              className="bg-red-600 text-white py-3 px-6 rounded hover:bg-red-700 transition"
              onClick={() => navigate("/malware-analysis")}
            >
              Analyze Malware
            </button>
            <button
              className="bg-red-600 text-white py-3 px-6 rounded hover:bg-red-700 transition"
              onClick={() => navigate("/siem-dashboard")}
            >
              SIEM DASHBOARD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
