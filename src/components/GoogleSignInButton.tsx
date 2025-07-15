// src/components/GoogleSignInButton.tsx
import React from 'react';
import { Button } from './ui/button';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { app } from '../firebaseConfig';

interface GoogleSignInButtonProps {
  onSuccess: () => void; // callback from parent to handle redirect
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onSuccess }) => {
  const handleGoogleLogin = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Get and store token
      const token = await user.getIdToken();
      localStorage.setItem('token', token);

      // You can also save the user to backend here if needed

      onSuccess(); // ✅ trigger parent redirection logic
    } catch (error: any) {
      console.error("Google Sign-in error:", error);
      alert("Google Sign-in failed. Please try again.");
    }
  };

  return (
    <Button
      type="button"
      onClick={handleGoogleLogin}
      className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-4 rounded-md font-medium flex items-center justify-center space-x-2"
    >
      <span>Sign In with Google</span>
      <span className="text-xl">G</span>
    </Button>
  );
};
