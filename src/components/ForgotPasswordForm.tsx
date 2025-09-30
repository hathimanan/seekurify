import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';

interface ForgotPasswordFormProps {}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = () => {
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'email' | 'sent' | 'reset'>('email');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleBackToLogin = () => {
    navigate('/');
  };

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
      setStep('sent');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetToken.length === 6) setStep('reset');
    else setError('Please enter a valid 6-digit code');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      alert(data.message);
      handleBackToLogin();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  // UI card wrapper
  const renderCard = (content: React.ReactNode) => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-100 to-purple-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Card className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 transition hover:shadow-2xl">
          <CardContent className="p-8">{content}</CardContent>
        </Card>
      </div>
    </div>
  );

  if (step === 'sent') {
    return renderCard(
      <div className="text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Sent!</h1>
          <p className="text-gray-600 mb-4">We've sent a password reset code to <strong>{email}</strong></p>
          <p className="text-sm text-gray-500 mb-4">Didn't receive it? Check spam folder or try again.</p>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        <form onSubmit={handleVerifyToken} className="space-y-4">
          <input
            type="text"
            value={resetToken}
            onChange={(e) => setResetToken(e.target.value.slice(0, 6))}
            className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white/80 text-gray-900 text-center text-xl font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Enter 6-digit code"
            maxLength={6}
            required
          />
          <Button
            type="submit"
            disabled={resetToken.length !== 6}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-md font-semibold text-lg"
          >
            Verify Code
          </Button>
        </form>

        <div className="mt-6 flex justify-between text-sm">
          <button
            onClick={() => setStep('email')}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Try different email
          </button>
          <button
            onClick={handleBackToLogin}
            className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to home</span>
          </button>
        </div>
      </div>
    );
  }

  if (step === 'reset') {
    return renderCard(
      <div>
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-indigo-700 drop-shadow-sm mb-2">Reset Password</h1>
          <p className="text-gray-500">Enter your new password</p>
        </div>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white/80 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white/80 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-md font-semibold text-lg"
          >
            {isLoading ? 'Resetting Password...' : 'Reset Password'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleBackToLogin}
            className="text-gray-600 hover:text-gray-800 flex items-center justify-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to home</span>
          </button>
        </div>
      </div>
    );
  }

  // Initial email input step
  return renderCard(
    <div>
      <div className="text-center mb-6">
        <div className="flex flex-col items-center mb-4">
                    <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-blue-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" />
            <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          </svg>
          <span className="text-blue-400 font-bold text-2xl">Vaultence</span>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password</h2>
        <p className="text-gray-500">Enter your email to reset your password</p>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">{error}</div>}

      <form onSubmit={handleSendResetEmail} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md bg-white/80 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Enter your email address"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-md font-semibold text-lg"
        >
          {isLoading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={handleBackToLogin}
          className="text-gray-600 hover:text-gray-800 flex items-center justify-center space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to home</span>
        </button>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
