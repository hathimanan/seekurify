import React from "react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { LoginForm } from "../../components/LoginForm";
import { SignupForm } from "../../components/SignupForm";
import { Dashboard } from "../../components/Dashboard";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

export const HomePageBefore = (): JSX.Element => {
  const { isAuthenticated, isLoading } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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
    return <Dashboard />;
  }

  const handleToggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setShowSuccessMessage(false);
  };

  const handleSignupSuccess = () => {
    setShowSuccessMessage(true);
    setIsLoginMode(true);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {showSuccessMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 mx-4 mt-4">
          Account created successfully! Please log in.
        </div>
      )}
      
      {isLoginMode ? (
        <LoginForm onToggleMode={handleToggleMode} />
      ) : (
        <SignupForm onToggleMode={handleToggleMode} onSignupSuccess={handleSignupSuccess} />
      )}
    </div>
  );
};
