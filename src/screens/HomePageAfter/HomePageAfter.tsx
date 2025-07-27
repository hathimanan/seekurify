import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { apiService } from "../../services/api";

import defaultProfileIcon from "../../../src/assets/default-profile.png"; // fallback image

export const HomePageAfter = (): JSX.Element => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
 const [profileIconUrl, setProfileIconUrl] = useState<string>("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [loading, setLoading] = useState(false); // wait for PIN check
  const [pinChecked, setPinChecked] = useState(false);
const [showDropdown, setShowDropdown] = useState(false);
const token = localStorage.getItem('token');



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
          console.log("Fetched userData:", userData);
          if (userData.pin === "0000") {
            setShowPinModal(true);
          }
          setPinChecked(true); // ✅ Only after fetch
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
  <div className="min-h-screen flex flex-col">
    {/* Top Navbar */}
    <div className="bg-blue-600 text-white flex justify-between items-center px-6 py-4">
      <h1 className="text-2xl font-bold">Securify</h1>

      {/* Profile Icon + Dropdown */}
      <div className="flex items-center space-x-4">
        <img
          src={profileIconUrl || defaultProfileIcon}
          alt="Profile"
          onClick={() => setShowDropdown(!showDropdown)}
          onError={(e) => {
            e.currentTarget.src = defaultProfileIcon;
            e.currentTarget.onerror = null;
          }}
          className="w-10 h-10 rounded-full border-2 border-white object-cover cursor-pointer"
        />

        {/* Dropdown */}
        {showDropdown && (
          <div className="absolute right-0 top-12 w-48 bg-white text-gray-800 shadow-md rounded-lg z-50">
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={() => navigate("/profile")}
            >
              Profile
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={() => navigate(`/set-new-pin?token=${token}`)}
            >
              Change PIN
            </button>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={() => navigate("/change-password")}
            >
              Change Password
            </button>
            <button
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}

        {/* <button
          onClick={handleLogout}
          className="bg-white text-blue-600 font-medium py-2 px-4 rounded hover:bg-gray-100"
        >
          Logout
        </button> */}
      </div>
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
          {/* <div className="hover:text-yellow-300 cursor-pointer">Home Page</div>
          <div className="hover:text-yellow-300 cursor-pointer">About Securify</div> */}
          <div className="hover:text-yellow-300 cursor-pointer" onClick={() => navigate("/malware-analysis")}>Analyze Malware </div>
          <div className="hover:text-yellow-300 cursor-pointer"onClick={() => navigate("/dashboard")}>Password Manager</div>
          <div className="hover:text-yellow-300 cursor-pointer" onClick={() => navigate("/siem-dashboard")}>SIEM Dashboard</div>
          <div className="hover:text-yellow-300 cursor-pointer" onClick={() => navigate("/securityAwareness")}>Security Awareness</div>
          <div className="hover:text-yellow-300 cursor-pointer" onClick={() => navigate("/contact")}>Contact Us</div>
        </div>

        {/* Main Content */}
      <div className="flex-1 p-8 bg-white">
  {/* Heading */}
  <div className="bg-blue-100 text-center py-4 rounded-xl text-2xl font-bold text-blue-800 mb-6 shadow">
    About Securify
  </div>

  {/* About Section */}
<section className="bg-white py-16 px-6 md:px-20">
  <div className="max-w-5xl mx-auto text-center">
    {/* Artistic shape (like PIBOCO's triangle or blob) */}
    <div className="w-10 h-10 bg-yellow-400 rotate-45 mx-auto mb-6"></div>

    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
      We believe in security awareness, protection,<br />
      and user control — all in one place.
    </h2>

    {/* Floating shape effect */}
    <div className="w-24 h-8 bg-blue-200 mx-auto mb-8 rounded-full -rotate-2"></div>
{/* <div className="bg-white rounded-xl border border-blue-300 p-6 shadow-lg"> */}
    <p className="text-gray-700 text-justify leading-relaxed space-y-4 text-base">
      <strong>Securify</strong> is an all-in-one cybersecurity platform built to empower users with advanced tools and essential knowledge to stay secure in the digital world. The core mission of Securify is twofold: to enhance user security through robust features and to promote cybersecurity awareness through accessible information and insights.
      <br /><br />
      At the heart of the platform is a secure password manager, enabling users to store, manage, and organize their passwords within an encrypted environment. All passwords are securely stored using hashing techniques to ensure maximum protection. Users also have the flexibility to generate strong, random passwords tailored to their preferences, promoting better password hygiene.
      <br /><br />
      Securify goes beyond password protection by integrating multiple real-time security utilities, including:
      <ul className="list-disc list-inside mt-2 text-gray-800">
        <li><strong>Link Checker:</strong> Quickly determine if a URL is safe or potentially malicious before clicking.</li>
        <li><strong>File & Malware Scanner:</strong> Upload and scan files to detect viruses or malware using reliable detection APIs.</li>
        <li><strong>System Information & Event Log Dashboard:</strong> Monitor system activities, track events, and gain insights into potential threats through a well-organized dashboard.</li>
      </ul>
      <br />
      In addition to these features, the platform includes educational content and real-time alerts to keep users informed about the latest threats, scams, and best practices in cybersecurity.
      <br /><br />
      Whether you're an individual looking to improve your digital safety or a developer interested in integrating secure practices, Securify offers a modern, user-centric approach to personal and professional cybersecurity—all from a single, intuitive interface.
    </p>
  
    <br></br>

    <div className="flex justify-center flex-wrap gap-4">
      <button
        className="bg-red-600 text-white py-3 px-6 rounded-xl hover:bg-red-700 transition"
        onClick={() => navigate("/malware-analysis")}
      >
        Analyze Malware
      </button>
      <button
        className="bg-indigo-600 text-white py-3 px-6 rounded-xl hover:bg-indigo-700 transition"
        onClick={() => navigate("/siem-dashboard")}
      >
        Explore SIEM Dashboard
      </button>
    </div>
  </div>
</section>


  {/* Description Box */}

          </div>
        </div>
      </div>
  );
};
