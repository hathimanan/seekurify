import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { OTPForm } from './OTPForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { apiService } from '../services/api'; // ✅ to call verifyOtp and verifyPin

interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otpPayload, setOtpPayload] = useState<{ email: string; otpToken: string } | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const { login } = useAuth();

  // 🔐 Step 1: Handle email + password login
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    const loginRes = await apiService.login({ email, password });

    const otpRes = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const { otpToken } = await otpRes.json();
setOtpPayload({ email, otpToken });
setShowOTP(true);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Login process failed');
  } finally {
    setIsLoading(false);
  }
};



  // 🔐 Step 2: Verify OTP → Then prompt PIN
const handleVerifyOTP = async (otp: string) => {
  const otpToken = localStorage.getItem('otpToken');
  if (!otpToken) throw new Error('OTP token not found');

  await apiService.verifyOtp(email, otp, otpToken); // ✅ pass all
  localStorage.removeItem('otpToken'); // ✅ clean up
};


  // 🔙 Back to login or forgot password
  const handleBackToLogin = () => {
    setShowOTP(false);
    setShowForgotPassword(false);
    setError('');
  };

  if (otpPayload) {
  return (
    <OTPForm
      email={otpPayload.email}
      otpToken={otpPayload.otpToken}
      onBack={handleBackToLogin}
      onSuccess={() => {
        console.log('✅ Proceed to PIN or Dashboard');
      }}
    />
  );
}

  if (showForgotPassword) {
    return <ForgotPasswordForm onBack={handleBackToLogin} />;
  }

 

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
          <p className="text-gray-600">Welcome back! Please login to your account</p>
        </div>

        <Card className="bg-white shadow-lg">
          <CardContent className="p-8">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-lg font-medium text-gray-900 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-200 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-lg font-medium text-gray-900 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-200 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
                <div className="text-right mt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-gray-900 hover:text-gray-700 font-medium underline"
                  >
                    Forgot Password
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium text-lg"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              <Button type="button" className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-4 rounded-md font-medium flex items-center justify-center space-x-2">
                <span>Sign In with Google</span>
                <span className="text-xl">G</span>
              </Button>

              <Button type="button" className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-4 rounded-md font-medium flex items-center justify-center space-x-2">
                <span>Sign In with Microsoft</span>
                <span className="text-xl">⊞</span>
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
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
      </div>
    </div>
  );
};
