import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { OTPForm } from './OTPForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { apiService } from '../services/api';
import { PINForm } from './PINForm';
import { GoogleSignInButton } from './GoogleSignInButton';
import { useNavigate } from 'react-router-dom';

interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpPayload, setOtpPayload] = useState<{ email: string; otpToken: string } | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPIN, setShowPIN] = useState(false);
const [success, setSuccess] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Step 1: Handle Login
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setEmailError('');
  setPasswordError('');

  // Frontend validations
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

   let hasError = false;

if (!email.trim()) {
  setEmailError('Email is required');
  hasError = true;
} else if (!emailRegex.test(email)) {
  setEmailError('Invalid email format');
  hasError = true;
}

// Password validation
if (!password.trim()) {
  setPasswordError('Password is required');
  hasError = true;
} else if (password.length < 6) {
  setPasswordError('Password length is too small');
  hasError = true;
} else if (password.length > 18) {
  setPasswordError('Password length is too large');
  hasError = true;
}

if (hasError) return;


  setIsLoading(true);

  try {
    const loginRes = await apiService.login({ email, password });
    localStorage.setItem('token', loginRes.token);

    const otpRes = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const { otpToken } = await otpRes.json();
    setOtpPayload({ email, otpToken });
} catch (err: any) {
  const backend = err?.response?.data;

  if (backend?.field === 'email') {
    setEmailError(backend.error);
  } else if (backend?.field === 'password') {
    setPasswordError(backend.error);
  } else {
    const message =
      backend?.error ||
      backend?.message ||
      err?.message ||
      'Login failed.';
    setError(message);
  }
}


    finally {
    setIsLoading(false);
  }
};


useEffect(()=> { 
if (success) {
    const timer = setTimeout(() => {
      navigate('/homepageAfterLogin');
    }, 2000); // 2 second delay
    return () => clearTimeout(timer);
  }
}, [success]);

  // Step 3: Handle PIN Verification
  const handleVerifyPIN = async (pin: string) => {
    try {
await apiService.verifyPin(otpPayload?.email ?? '', pin);
      login(email, password);

      const res = await fetch('/homepageAfterLogin', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // const data = await res.json();

      // if (data.forcePinChange) {
      //   navigate('/set-new-pin', { state: { email } });
      // } else {
      //   navigate('/homepageAfterLogin');
      // }
    } catch (err) {
      setError('Incorrect PIN');
    }
  };

  const handleBackToLogin = () => {
    setOtpPayload(null);
    setShowPIN(false);
    setShowForgotPassword(false);
    setError('');
  };

  // OTP screen
  if (otpPayload && !showPIN) {
    return (
      <OTPForm
        email={otpPayload.email}
        otpToken={otpPayload.otpToken}
        onBack={handleBackToLogin}
        onSuccess={() => {
          setShowPIN(true);
        }}
      />
    );
  }

  // PIN screen
  if (showPIN && otpPayload) {
    return (
      <PINForm
        email={otpPayload.email}
        onBack={handleBackToLogin}
        onVerifyPIN={handleVerifyPIN}
        
      />
    );
  }

  // Forgot Password
  if (showForgotPassword) {
    return <ForgotPasswordForm />;
  }


  return (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
    <div className="w-full max-w-md">

      {success && (
        <div className="mb-6 rounded-xl border border-green-300 bg-green-50 px-4 py-3 flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <span className="text-green-700 text-sm font-medium">Login successful! Redirecting...</span>
          </div>
        </div>
      )}

      {!success && (
        <Card className="bg-white rounded-2xl shadow-md">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
              <p className="text-gray-600 mt-1">Welcome back! Please login to your account</p>
            </div>

            {error && (
              // <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="flex items-start space-x-2 text-sm text-red-700 bg-red-50 border border-red-300 rounded-xl px-4 py-3 mb-6">
  <svg className="h-5 w-5 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
    <path d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zm-8-1V5h2v4h-2zm0 4v-2h2v2h-2z"/>
  </svg>
  <span>{error}</span>
</div>


              // </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 mb-1">
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  // required
                />
                {emailError && <p className="text-red-600 text-sm mt-1">{emailError}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  // required
                />
                <div className="text-right mt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                {passwordError && <p className="text-red-600 text-sm mt-1">{passwordError}</p>}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium text-lg transition disabled:opacity-50"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              <GoogleSignInButton
                onSuccess={() => {
                  setSuccess(true); // ✅ trigger success message
                }}
              />

              <Button
                type="button"
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-4 rounded-md font-medium flex items-center justify-center space-x-2 transition"
              >
                <span>Sign In with Microsoft</span>
                <span className="text-xl">⊞</span>
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <button
                  onClick={onToggleMode}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Signup here
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  </div>
);
}