import React, { FC } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { HomePageAfter } from "../HomePageAfter/HomePageAfter";
import heroBackground from "../../assets/hero-bg.png";

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
          className="text-white font-bold text-2xl cursor-pointer hover:text-blue-400 transition-colors"
          role="button"
          tabIndex={0}
          aria-label="Go to home"
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") navigate("/");
          }}
        >
          Vaultence
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

      <footer className="relative z-40 text-gray-400 text-sm text-center py-6 border-t border-gray-700">
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <p>&copy; {new Date().getFullYear()} Vaultence. All rights reserved.</p>
          <div className="flex gap-4">
            <button type="button" onClick={() => navigate("/privacy")} className="hover:text-gray-200 transition-colors">
              Privacy Policy
            </button>
            <button type="button" onClick={() => navigate("/terms")} className="hover:text-gray-200 transition-colors">
              Terms
            </button>
            <button type="button" onClick={() => navigate("/contact")} className="hover:text-gray-200 transition-colors">
              Contact
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
