import React from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { HomePageAfter } from "../HomePageAfter/HomePageAfter";

export const HomePageBefore = (): JSX.Element => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <HomePageAfter />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-700 mb-6">Welcome to Securify</h1>
        <p className="text-gray-700 mb-8">Please sign in or create an account to continue.</p>

        <div className="flex gap-6 justify-center">
          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="bg-gray-300 text-gray-800 px-6 py-3 rounded-md hover:bg-gray-400 transition"
          >
            Signup
          </button>
        </div>
      </div>
    </div>
  );
};
