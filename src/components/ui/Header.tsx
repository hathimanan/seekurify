import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import defaultProfileIcon from "../../assets/default-profile.png"; // fallback image


interface HeaderProps {
  profileIconUrl?: string;
  token: string;
  handleLogout: () => void;
}
const navItems = [
  { name: "Analyze Malware", path: "/malware-analysis" },
  { name: "Password Manager", path: "/dashboard" },
  { name: "SIEM Dashboard", path: "/siem-dashboard" },
  { name: "Security Awareness", path: "/securityAwareness" },
  { name: "Contact Us", path: "/contact" },
];




const Header: React.FC<HeaderProps> = ({
  profileIconUrl,
  token,
  handleLogout,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

    const logout = () => {
  // 1. Clear tokens or auth state
  localStorage.removeItem("token");
  // 2. Redirect to login page
  navigate("/login");
};
  


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };



    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-6 text-white shadow-md sticky top-0 z-20 bg-white shadow-md">
<div className="w-full flex justify-between items-center px-6 py-4">
            {/* Logo */}
        <motion.h1
          className="text-3xl font-extrabold tracking-wide cursor-pointer"
          whileHover={{ scale: 1.05 }}
          onClick={() => navigate("/")}
        >
          Vaultence
        </motion.h1>

     {/* Desktop Nav */}
<nav className="hidden md:flex space-x-8">
  {navItems.map((item) => (
    <Link
      key={item.name}
      to={item.path}
      className={`
        relative font-semibold text-white transition-colors duration-300
        hover:text-cyan-300
        ${location.pathname === item.path ? "text-cyan-300" : ""}
      `}
    >
      {item.name}
      {location.pathname === item.path && (
        <span className="absolute -bottom-1 left-0 w-full h-1 bg-cyan-300 rounded-full" />
      )}
    </Link>
  ))}
</nav>

        {/* Right Side: Mobile Menu + Profile */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white text-2xl"
            >
              {mobileMenuOpen ? "✖" : "☰"}
            </button>
          </div>

          {/* Profile + Dropdown */}
          <div className="relative" ref={dropdownRef}>
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
                  className="w-full px-4 py-2 hover:bg-indigo-50 text-left"
                  onClick={() => navigate("/profile")}
                >
                  Profile
                </button>
                <button
                  className="w-full px-4 py-2 hover:bg-indigo-50 text-left"

onClick={() => navigate(`/set-new-pin?token=${localStorage.getItem("token")}`)}
                >
                  Change PIN
                </button>
                <button
                  className="w-full px-4 py-2 hover:bg-indigo-50 text-left"
                  onClick={() => navigate("/change-password")}
                >
                  Change Password
                </button>
                <button
                  className="w-full px-4 py-2 text-red-600 hover:bg-red-50 text-left"
                  onClick={logout}
                >
                  Logout
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-indigo-700">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2 font-medium hover:bg-indigo-600 ${
                location.pathname === item.path ? "bg-indigo-600" : ""
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;
