import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import defaultProfileIcon from "../../assets/default-profile.png";
import { Menu, X } from "lucide-react";
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

const Header: React.FC<HeaderProps> = ({ profileImage, token, handleLogout, sidebarExpanded,setSidebarExpanded }) => {
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
    <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 text-white shadow-md sticky top-0 z-20">
  <div className="w-full flex justify-between items-center px-6 py-4">
    
    {/* Left Section: Seekurify + Sidebar Toggle */}
    <div className="flex items-center gap-2">
      <motion.h1
        className="text-3xl font-extrabold tracking-wide cursor-pointer mr-2"
        whileHover={{ scale: 1.05 }}
        onClick={() => navigate("/")}
      >
        Seekurify
      </motion.h1>

      {/* Sidebar Toggle with Tooltip */}
      <div className="relative group">
        <div
          onClick={() => setSidebarExpanded((s) => !s)}
          className="flex items-center gap-2 cursor-pointer text-sm bg-white/10 px-2.5 py-1.5 rounded-md hover:bg-white/20 transition"
        >
          {sidebarExpanded ? (
            <X size={20} className="text-white" />
          ) : (
            <Menu size={20} className="text-white" />
          )}
        </div>

        {/* Tooltip */}
        <span className="absolute left-1/2 -translate-x-1/2 -top-8 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          {sidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
        </span>
      </div>
    </div>

    {/* Desktop Nav */}
    {/* <nav className="hidden md:flex space-x-8">
      {navItems.map((item) => (
        <button
          key={item.name}
          onClick={() => useProtectedNavigation(item.path)}
          className={`font-semibold text-white transition-colors duration-300 hover:text-cyan-300 ${
            location.pathname === item.path ? "text-cyan-300" : ""
          }`}
        >
          {item.name}
        </button>
      ))}
    </nav> */}

    {/* Right Side */}
    <div className="flex items-center space-x-4">

      {/* Mobile Menu */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white text-2xl"
        >
          {mobileMenuOpen ? "✖" : "☰"}
        </button>
      </div>

      {/* Profile Dropdown with Tooltip */}
      <div className="relative group" ref={dropdownRef}>
        <motion.img
          whileHover={{ scale: 1.1 }}
          src={profileImage || defaultProfileIcon}
          alt="Profile"
          onClick={() => setShowDropdown(!showDropdown)}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = defaultProfileIcon;
          }}
          className="w-11 h-11 rounded-full border-2 border-white object-cover cursor-pointer shadow-md"
        />

        {/* Tooltip */}
        <span className="absolute left-1/2 -translate-x-1/2 -top-8 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
          Profile
        </span>

        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 top-14 w-52 bg-white text-gray-700 shadow-lg rounded-xl overflow-hidden"
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
          className={`block px-4 py-2 font-medium hover:bg-indigo-600 ${
            location.pathname === item.path ? "bg-indigo-600" : ""
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
