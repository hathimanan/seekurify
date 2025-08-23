import React, { JSX, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiService } from "../../services/api";
import { motion } from "framer-motion";
import Header from "../../components/ui/Header";
import Footer from "../../components/ui/Footer";
// import defaultProfileIcon from "../../../src/assets/default-profile.png"; // fallback image

export const HomePageAfter = (): JSX.Element => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profileIconUrl, setProfileIconUrl] = useState<string>("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pinChecked, setPinChecked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfileIcon = async () => {
      try {
        if (user?.id) {
          setProfileIconUrl(`/api/profile/profile-icon/${user.id}`);
        }
      } catch (error) {
        console.error("Error fetching profile icon:", error);
      }
    };

    const checkUserPin = async () => {
      try {
        if (user?.email && !pinChecked) {
          const userData = await apiService.getUserDetails(user.email);
          // if (userData.pin === "0000") {
          //   setShowPinModal(true);
          // }
          setPinChecked(true);
        }
      } catch (err) {
        console.error("Failed to fetch user PIN:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileIcon();
    checkUserPin();
  }, [user, pinChecked]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleChangePin = () => {
    setShowPinModal(false);
    navigate("/set-new-pin", { state: { email: user?.email || "" } });
  };

  const handleCloseModal = () => {
    setShowPinModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-semibold">
        Loading...
      </div>
    );
  }

  return (
    
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
          <Header token={"token"} handleLogout={function (): void {
        throw new Error("Function not implemented.");
      } } />
      {/* Navbar */}
      {/* <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex justify-between items-center px-8 py-4 shadow-md">
        <motion.h1
          className="text-3xl font-extrabold tracking-wide cursor-pointer"
          whileHover={{ scale: 1.05 }}
        >
          Securify
        </motion.h1>

        <div className="relative">
          <motion.img
            whileHover={{ scale: 1.1 }}
            src={profileIconUrl || defaultProfileIcon}
            alt="Profile"
            onClick={() => setShowDropdown(!showDropdown)}
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const target = e.currentTarget;
                target.src = defaultProfileIcon;
                target.onerror = null; // prevent infinite loop
              }}
            className="w-11 h-11 rounded-full border-2 border-white object-cover cursor-pointer shadow-md"
          />

          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-14 w-52 bg-white text-gray-700 shadow-lg rounded-xl overflow-hidden"
            >
              <button
                className="w-full px-4 py-2 hover:bg-indigo-50"
                onClick={() => navigate("/profile")}
              >
                Profile
              </button>
              <button
                className="w-full px-4 py-2 hover:bg-indigo-50"
                onClick={() => navigate(`/set-new-pin?token=${token}`)}
              >
                Change PIN
              </button>
              <button
                className="w-full px-4 py-2 hover:bg-indigo-50"
                onClick={() => navigate("/change-password")}
              >
                Change Password
              </button>
              <button
                className="w-full px-4 py-2 text-red-600 hover:bg-red-50"
                onClick={handleLogout}
              >
                Logout
              </button>
            </motion.div>
          )}
        </div>
      </div> */}

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-6 rounded-2xl shadow-2xl text-center max-w-sm w-full"
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Set a New PIN
            </h2>
            <p className="text-gray-700 mb-6">
              You are using the default PIN. For your security, please change
              it.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleChangePin}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 shadow"
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
          </motion.div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 text-white w-64 p-6 space-y-6 font-medium shadow-lg">
          {[
            ["Analyze Malware", "/malware-analysis"],
            ["Password Manager", "/dashboard"],
            ["SIEM Dashboard", "/siem-dashboard"],
            ["Security Awareness", "/securityAwareness"],
            ["Contact Us", "/contact"],
          ].map(([label, path]) => (
            <motion.div
              key={path}
              onClick={() => navigate(path)}
              className="cursor-pointer px-3 py-2 rounded-lg hover:bg-indigo-600 transition"
              whileHover={{ x: 5 }}
            >
              {label}
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 p-10">
          <motion.div
            className="bg-gradient-to-r from-blue-100 to-indigo-100 text-center py-4 rounded-2xl text-2xl font-bold text-indigo-800 mb-8 shadow-lg"
            whileHover={{ scale: 1.02 }}
          >
            About Securify
          </motion.div>

          <section className="bg-white py-12 px-6 md:px-20 rounded-xl shadow-lg">
            <div className="max-w-5xl mx-auto text-center">
              <div className="w-12 h-12 bg-yellow-400 rotate-45 mx-auto mb-6 rounded-md shadow-md"></div>

              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">
                We believe in security awareness, protection, <br />
                and user control — all in one place.
              </h2>

              <div className="w-28 h-3 bg-indigo-200 mx-auto mb-8 rounded-full"></div>

              {/* Full Original Content */}
              <p className="text-gray-700 text-justify leading-relaxed space-y-4 text-base">
                <strong>Securify</strong> is an all-in-one cybersecurity platform
                built to empower users with advanced tools and essential
                knowledge to stay secure in the digital world. The core mission
                of Securify is twofold: to enhance user security through robust
                features and to promote cybersecurity awareness through
                accessible information and insights.
                <br />
                <br />
                At the heart of the platform is a secure password manager,
                enabling users to store, manage, and organize their passwords
                within an encrypted environment. All passwords are securely
                stored using hashing techniques to ensure maximum protection.
                Users also have the flexibility to generate strong, random
                passwords tailored to their preferences, promoting better
                password hygiene.
                <br />
                <br />
                Securify goes beyond password protection by integrating multiple
                real-time security utilities, including:
                <ul className="list-disc list-inside mt-2 text-gray-800">
                  <li>
                    <strong>Link Checker:</strong> Quickly determine if a URL is
                    safe or potentially malicious before clicking.
                  </li>
                  <li>
                    <strong>File & Malware Scanner:</strong> Upload and scan
                    files to detect viruses or malware using reliable detection
                    APIs.
                  </li>
                  <li>
                    <strong>System Information & Event Log Dashboard:</strong>{" "}
                    Monitor system activities, track events, and gain insights
                    into potential threats through a well-organized dashboard.
                  </li>
                </ul>
                <br />
                In addition to these features, the platform includes educational
                content and real-time alerts to keep users informed about the
                latest threats, scams, and best practices in cybersecurity.
                <br />
                <br />
                Whether you're an individual looking to improve your digital
                safety or a developer interested in integrating secure
                practices, Securify offers a modern, user-centric approach to
                personal and professional cybersecurity—all from a single,
                intuitive interface.
              </p>

              <div className="flex justify-center flex-wrap gap-4 mt-10">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="bg-red-600 text-white py-3 px-6 rounded-xl hover:bg-red-700 shadow-lg"
                  onClick={() => navigate("/malware-analysis")}
                >
                  Analyze Malware
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="bg-indigo-600 text-white py-3 px-6 rounded-xl hover:bg-indigo-700 shadow-lg"
                  onClick={() => navigate("/siem-dashboard")}
                >
                  Explore SIEM Dashboard
                </motion.button>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};
