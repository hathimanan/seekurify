import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import defaultProfileIcon from "../../assets/default-profile.png";
import { Menu, X } from "lucide-react";
// import { Logo } from "./logo";
interface HeaderProps {
  profileImage?: string; // uploaded image from profile
  token: string;
  handleLogout: () => void;
  sidebarExpanded: boolean;
  setSidebarExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

const navItems = [
  { name: "Analyze Malware", path: "/malware-analysis" },
  { name: "Password Manager", path: "/dashboard" },
  { name: "SIEM Dashboard", path: "/siem-dashboard" },
  { name: "Security Awareness", path: "/securityAwareness" },
  { name: "Contact Us", path: "/contact" },
];

const Header: React.FC<HeaderProps> = ({ profileImage, handleLogout, sidebarExpanded, setSidebarExpanded }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const logout = () => {
    localStorage.removeItem("token");
    handleLogout();
  };

  const useProtectedNavigation = (path: string) => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate(path);
    } else {
      navigate("/homepageBefore");
    }
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 text-white shadow-md z-50">
      <div className="w-full flex justify-between items-center">
          <div className="relative group">
            <div
              onClick={() => setSidebarExpanded((s) => !s)}
              className="flex items-center justify-center cursor-pointer bg-white/20 px-3 py-2 rounded-lg hover:bg-white/30 transition shadow-sm"
            >
              {sidebarExpanded ? (
                <X size={18} className="text-white" />
              ) : (
                <Menu size={18} className="text-white" />
              )}
            </div>

            {/* Tooltip */}
            <span className="absolute left-1/2 -translate-x-1/2 -top-8 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
              {sidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
            </span>
          </div>
        {/* Left Section: Logo (white card) */}
        <div className="flex items-center gap-3">
          {/* <div className="flex items-center bg-white/90 backdrop-blur-md rounded-xl shadow-md px-3 py-0.5 border border-gray-100"> */}
          <div className="flex flex-col items-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-blue-400 mb-2"
              fill="white"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" />
              <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
<a href="/" className="text-blue-400 font-bold text-3xl hover:text-blue-500 transition-colors">
  Seekurify
</a>
          </div>
          {/* </div> */}


          {/* Sidebar Toggle (outside white box, aligned right) */}

        </div>

        {/* Right Section: Profile + Mobile Menu */}
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white text-2xl"
            >
              {mobileMenuOpen ? "✖" : "☰"}
            </button>
          </div>

          {/* Profile Dropdown */}
          <div className="relative group" ref={dropdownRef}>
            <motion.img
              whileHover={{ scale: 1.1 }}
              src={profileImage || defaultProfileIcon}
              alt="Profile"
              onClick={() => setShowDropdown(!showDropdown)}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = defaultProfileIcon;
              }}
              className="w-10 h-10 rounded-full border-2 border-white object-cover cursor-pointer shadow-md"
            />

            {/* Tooltip */}
            <span className="absolute left-1/2 -translate-x-1/2 -top-8 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50">
              Profile
            </span>

            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-12 w-52 bg-white text-gray-700 shadow-lg rounded-xl overflow-hidden z-50"
              >
                <button className="w-full px-4 py-2 hover:bg-indigo-50 text-left" onClick={() => useProtectedNavigation("/profile")}>Profile</button>
                <button className="w-full px-4 py-2 hover:bg-indigo-50 text-left" onClick={() => useProtectedNavigation(`/set-new-pin?token=${localStorage.getItem("token")}`)}>Change PIN</button>
                <button className="w-full px-4 py-2 hover:bg-indigo-50 text-left" onClick={() => useProtectedNavigation("/change-password")}>Change Password</button>
                <button className="w-full px-4 py-2 text-red-600 hover:bg-red-50 text-left" onClick={logout}>Logout</button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-indigo-700">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2 font-medium hover:bg-indigo-600 ${location.pathname === item.path ? "bg-indigo-600" : ""
                }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
    </header>
  );




};

export default Header;
