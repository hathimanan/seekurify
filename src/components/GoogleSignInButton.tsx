import React, { useState } from 'react';
import { Button } from './ui/button';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { app } from '../firebaseConfig';
import { API_BASE_URL } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { ErrorModal } from './ui/ErrorModal';

interface GoogleSignInButtonProps {
  onSuccess: () => void; // callback from parent to handle redirect
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Get Firebase ID token
      const token = await user.getIdToken();

      // Check if email exists in backend
      const response = await fetch(`${API_BASE_URL}/auth/check-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (response.ok && data.exists) {
        // ✅ Successful login → store token
        localStorage.setItem('token', token);
        onSuccess();
      } else {
        // ❌ Email not found → show modal
        localStorage.removeItem("token");
        setErrorMessage("No account found. Please sign up first.");
      }

    } catch (error: any) {
      console.error("Google Sign-in error:", error);
      localStorage.removeItem("token");
      setErrorMessage("Google Sign-in failed. Please try again.");
    }
  };

  return (
 <>
  <Button
    type="button"
    onClick={handleGoogleLogin}
    className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-4 rounded-md font-medium flex items-center justify-center space-x-2"
  >
    <span>Sign In with Google</span>
    <span className="text-xl">G</span>
  </Button>

  {/* Error Modal */}
  {errorMessage && (
    <ErrorModal
      message={errorMessage}
      onClose={() => {
        setErrorMessage(null);
        navigate("/login"); // redirect back to login after closing modal
      }}
    />
  )}
</>
  );
}


