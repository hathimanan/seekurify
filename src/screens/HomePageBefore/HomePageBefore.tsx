import React, { FC } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { HomePageAfter } from "../HomePageAfter/HomePageAfter";
import heroBackground from "../../assets/hero-bg.png";
import VaultIcon from "../../assets/Vaul.png";
import { icons, Image } from "lucide-react";
import Footer from "../../components/ui/Footer";

export const HomePageBefore: FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <HomePageAfter />;
  }

  return (
    <div
      className="min-h-screen flex flex-col justify-between relative bg-black overflow-hidden"
      style={{
        backgroundImage: `url(${heroBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay for readability: non-interactive so it won't steal clicks */}
      <div className="absolute inset-0 bg-black/70 z-0 pointer-events-none" />

      {/* Navigation - must be higher than overlay */}
      <nav className="w-full px-6 py-6 flex justify-between items-center absolute top-0 z-50">
        {/* Brand: keep as button/Link for semantic navigation */}
<h2
  onClick={() => navigate("/")}
  className="cursor-pointer flex items-center space-x-3"
  role="button"
  tabIndex={0}
  aria-label="Go to home"
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") navigate("/");
  }}
>
  {/* Minimalistic Vault Icon */}
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-10 text-blue-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    {/* Vault outer circle */}
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    {/* Vault handle (cross handle) */}
    <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" />
    <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" />
    {/* Optional: small inner circle to mimic hub */}
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>

  {/* Brand Name */}
  <span className="text-blue-400 font-bold text-2xl">Vaultence</span>
</h2>


        <div className="flex gap-4">
          {/* Using type="button" prevents accidental form submit if this nav is ever inside a form */}
          <button
            type="button"
            onClick={() => navigate("/login")}
            aria-label="Login"
            className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 hover:scale-105 transition-all duration-300"
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => navigate("/signup")}
            aria-label="Signup"
            className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold shadow-md hover:from-blue-600 hover:to-indigo-700 hover:scale-105 transition-all duration-300"
          >
            Signup
          </button>

          {/*
            Optional Link variant (uncomment if you prefer Link)
            <Link to="/login" className="px-6 py-2 rounded-full ...">Login</Link>
          */}
        </div>
      </nav>

      {/* Hero Section (above overlay but below nav) */}
      <div className="relative z-40 flex flex-col items-center justify-center flex-1 text-center px-4">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 to-indigo-500 text-transparent bg-clip-text drop-shadow-lg">
          Vaultence
        </h1>
        <p className="text-base sm:text-lg lg:text-2xl mb-10 text-gray-200 max-w-3xl">
          Your all-in-one cybersecurity platform. Secure passwords, detect
          threats, and stay informed — all in one dashboard.
        </p>

        <div className="flex justify-center gap-6">
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3 rounded-full text-white font-medium shadow-md hover:from-blue-600 hover:to-indigo-700 hover:scale-105 transition-transform duration-300"
          >
            Get Started
          </button>
          <button
            type="button"
            onClick={() => navigate("/features")}
            className="border border-gray-300 px-8 py-3 rounded-full text-gray-200 hover:bg-gray-800 hover:text-white transition-colors duration-300"
          >
            Learn More
          </button>
        </div>
      </div>
      {/* Footer */}
<Footer />
    </div>
  );
};
