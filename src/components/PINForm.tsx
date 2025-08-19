import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PINFormProps {
  email: string;
  onBack: () => void;
  onVerifyPIN: (pin: string) => void;
}

export const PINForm: React.FC<PINFormProps> = ({ email, onVerifyPIN, onBack }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const newPin = [...pin];

    for (let i = 0; i < pastedData.length && i < 4; i++) {
      newPin[i] = pastedData[i];
    }

    setPin(newPin);
    const nextIndex = Math.min(pastedData.length, 3);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullPin = pin.join('');

    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin: fullPin }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        navigate('/homepageAfterLogin');
      } else {
        setError(data.message || 'Invalid PIN');
      }
    } catch (err) {
      console.error('Error verifying PIN:', err);
      setError('Failed to verify PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fadeIn">
        
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent drop-shadow-md">
            Sign In
          </h1>
          <p className="text-gray-700 mt-2">Welcome back! Please login to your account</p>
        </div>

        {/* Error Box */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-100/90 px-4 py-3 flex items-start justify-between shadow-md animate-shake">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <span className="text-red-800 text-sm font-semibold">{error}</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Card */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg px-8 py-10 border border-gray-100">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">Enter Your PIN</h2>

          {/* PIN Inputs */}
          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-4 mb-8">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="password"
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  maxLength={1}
                  className="w-16 h-16 text-center text-2xl font-bold border border-gray-300 rounded-xl 
                             focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200
                             transition-all duration-200 shadow-sm hover:shadow-lg bg-white"
                />
              ))}
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isLoading || pin.join('').length !== 4}
                className="bg-gradient-to-r from-indigo-600 to-pink-500 hover:from-indigo-700 hover:to-pink-600 
                           transition-all text-white px-8 py-3 rounded-xl font-semibold shadow-md 
                           hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Submit'}
              </Button>
            </div>
          </form>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <button
            onClick={onBack}
            className="text-sm text-indigo-600 hover:text-pink-600 transition font-medium underline-offset-2 hover:underline"
          >
            ← Back to OTP
          </button>
        </div>
      </div>
    </div>
  );
};
