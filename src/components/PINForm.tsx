import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
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
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(''); // Clear error when user types

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      // Focus previous input on backspace if current is empty
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
    
    // Focus the next empty input or the last one
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
      headers: {
        'Content-Type': 'application/json',
      },
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
  <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
    <div className="w-full max-w-md">

      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sign In</h1>
        <p className="text-gray-600 mt-1">Welcome back! Please login to your account</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 flex items-start justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
            <span className="text-red-700 text-sm font-medium">INVALID PIN!</span>
          </div>
          <button
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md px-6 py-8">
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Enter PIN</h2>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-4 mb-6">
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
                className="w-16 h-16 text-center text-2xl font-semibold border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition outline-none bg-white"
              />
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading || pin.join('').length !== 4}
              className="bg-blue-600 hover:bg-blue-700 transition text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Submit'}
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={onBack}
          className="text-sm text-blue-600 hover:text-blue-800 transition font-medium"
        >
          ← Back to OTP
        </button>
      </div>
    </div>
  </div>
);
}