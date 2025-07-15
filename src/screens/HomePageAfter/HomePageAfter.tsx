// HomePageAfter.tsx

import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { SetNewPin } from "../../components/SetNewPin";
import { apiService } from "../../services/api"; // ✅ assume this has `getUserDetails`

export const HomePageAfter = (): JSX.Element => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinUpdateRequired, setPinUpdateRequired] = useState(false);
  const [loading, setLoading] = useState(true); // ✅ wait for PIN check
  const [pinChecked, setPinChecked] = useState(false); // prevents double-fetch

useEffect(() => {
  const checkUserPin = async () => {
    try {
      if (user?.email && !pinChecked) {
        setPinChecked(true);
        const userData = await apiService.getUserDetails(user.email); // ✅ fetch user details with pin
        console.log("Fetched userData:", userData); // ✅ Check if pin is included
        if (userData.pin === "0000") {
          setShowPinModal(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch user PIN:", err);
    } finally {
      setLoading(false);
    }
  };

  checkUserPin();
}, [user, pinChecked]);


  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleCloseModal = () => {
    setShowPinModal(false);
  };

  const handleChangePin = () => {
    handleCloseModal();
    setPinUpdateRequired(true); // Show <SetNewPin />
  };

  // ✅ Block screen until PIN is verified
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-semibold">
        Loading...
      </div>
    );
  }

  // 🔁 Change PIN screen
  if (pinUpdateRequired) {
    return (
      <SetNewPin
        email={user?.email || ""}
        onPinSetSuccess={() => setPinUpdateRequired(false)}
      />
    );
  }

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

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Set a New PIN</h2>
            <p className="text-gray-700 mb-6">
              You are using the default PIN. For your security, please change it.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleChangePin}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Change PIN
              </button>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}

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
