import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { apiService } from '../services/api';
import { HomePageAfter } from '../screens/HomePageAfter/HomePageAfter';

interface OTPFormProps {
  email: string;
  otpToken: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export const OTPForm: React.FC<OTPFormProps> = ({ email, otpToken, onBack, onSuccess }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isOtpValid = otp.every((digit) => /^\d$/.test(digit));
  const [goToHome, setGoToHome] = useState(false);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('otpToken', otpToken);

    if (!otpToken) {
      setError('Missing OTP token. Please log in again.');
      setIsLoading(false);
      return;
    }

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const userData = await apiService.onverifyOtp(email, otpString, otpToken);

        if (onSuccess) onSuccess();
    } catch (err: any) {
      const errorMessage = err?.message || (typeof err === 'string' ? err : 'Invalid OTP');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (goToHome) {
    return <HomePageAfter />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-tr from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-md transform transition-all duration-300 hover:scale-[1.01]">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">🔒 Secure Sign In</h1>
          <p className="text-gray-600 mt-2">Welcome back! Enter the OTP sent to your email</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-100 px-4 py-3 flex items-start justify-between shadow-md animate-shake">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow">
                <span className="text-white text-xs font-bold">!</span>
              </div>
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl px-6 py-8 border border-gray-200">
          <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Enter OTP</h2>

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-3 mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                                    type="text"
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  maxLength={1}
                  className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg shadow-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200 transition outline-none bg-white hover:shadow-md"
                />
              ))}
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isLoading || !isOtpValid}
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 text-white px-6 py-3 rounded-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onBack}
            className="text-sm text-indigo-600 hover:text-indigo-800 transition font-medium underline-offset-4 hover:underline"
          >
            ← Back to login
          </button>
        </div>
      </div>
    </div>
  );
};
