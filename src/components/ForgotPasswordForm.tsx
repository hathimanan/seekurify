import React, { useState } from 'react';
import { useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ArrowLeft, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';
import { Logo } from './ui/logo';

interface ForgotPasswordFormProps {}

export const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = () => {
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'email' | 'sent' | 'reset'>('email');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
      const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
  if (step === 'sent') {
    setCanResend(false);
    setResendTimer(30);

    const countdown = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }
}, [step]);



  const handleBackToLogin = () => {
    navigate('/');
  };

  const handleResendCode = async () => {
  if (!canResend) return;
  try {
    await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setCanResend(false);
    setResendTimer(30);
    const countdown = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  } catch (err) {
    console.error('Error resending code:', err);
  }
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
      if (!res.ok) {
        const data = await res.json().catch(()=>({ error: 'Failed to reset password' }));
        throw new Error(data.error || 'Failed to reset password');
      }
      // success — show custom modal
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  // UI card wrapper (unchanged)
  const renderCard = (content: React.ReactNode) => (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-100 to-purple-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Card className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 transition hover:shadow-2xl">
          <CardContent className="p-8">{content}</CardContent>
        </Card>
      </div>
    </div>
  );

  // Single render path: choose content by step and render modal outside
  let content: React.ReactNode = null;

  if (step === 'sent') {

    content = (
      <div className="text-center">
         <Logo />
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Sent!</h1>
          <p className="text-gray-600 mb-4">We've sent a password reset code to <strong>{email}</strong></p>
          <p className="text-sm text-gray-500 mb-4">Didn't receive it? Check spam folder or try again.</p>
          {/* Resend Code Section */}
<div className="text-sm text-gray-600 mb-4">
  {canResend ? (
    <button
      onClick={handleResendCode}
      className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
    >
      Resend Code
    </button>
  ) : (
    <span className="text-gray-500">
      You can resend in <strong>{resendTimer}s</strong>
    </span>
  )}
</div>

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
  } else if (step === 'reset') {
    content = (
      <div>
         <Logo />
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
  } else {
    content = (
      <div>
        <div className="text-center mb-6">
          <Logo />

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
  }

  // Final render: card + modal (modal shows regardless of which step rendered)
  return (
    <>
      {renderCard(content)}

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           
          <div className="bg-white rounded-lg p-6 max-w-sm w-full text-center shadow-lg">
            <Logo />
            <h2 className="text-xl font-semibold mb-2">Password Reset</h2>
            <p className="mb-4">Password has been reset successfully.</p>
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  handleBackToLogin();
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Back to Login
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};