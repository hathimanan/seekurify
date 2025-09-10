import React, { JSX } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { HomePageAfter } from "../HomePageAfter/HomePageAfter";
import heroBackground from "../../assets/hero-bg.png"; // abstract/3D background

export const HomePageBefore = (): JSX.Element => {
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
    
      className="min-h-screen flex flex-col justify-between text-black relative bg-black"
      style={{ backgroundImage: `url(${heroBackground})`, backgroundSize: "cover", backgroundPosition: "center" }}
    >
      {/* Navigation */}
      <nav className="w-full px-6 py-6 flex justify-end absolute top-0">
        <div className="flex gap-4">
          {/* Login Button */}
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 hover:scale-105 transition-all duration-300"
          >
            Login
          </button>

          {/* Signup Button */}
          <button
            onClick={() => navigate("/signup")}
            className="px-6 py-2 rounded-full bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 hover:scale-105 transition-all duration-300"
          >
            Signup
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
        <h1 className="text-6xl sm:text-7xl font-extrabold mb-6 text-white drop-shadow-lg">
          Vaultence
        </h1>
        <p className="text-lg lg:text-4xl mb-12 text-white">
          Your all-in-one cybersecurity platform. Secure passwords, detect threats, and stay informed.
        </p>

        {/* CTA */}
        <div className="flex justify-center gap-6">
          <button
            onClick={() => navigate("/signup")}
            className="bg-blue-600 px-6 py-3 rounded-full hover:bg-blue-700 transition transform hover:scale-105 shadow-md"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-gray-300 text-sm text-center py-4">
        &copy; {new Date().getFullYear()} Vaultence. All rights reserved.
      </footer>
    </div>
  );
};
