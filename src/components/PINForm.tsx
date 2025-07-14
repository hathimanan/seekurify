import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { X } from 'lucide-react';

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
    const pinString = pin.join('');
    
    if (pinString.length !== 4) {
      setError('Please enter all 4 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onVerifyPIN(pinString);
    } catch (err) {
      setError('Invalid PIN! Please try again.');
    } finally {
      setIsLoading(false);
    }
  };




  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h1>
          <p className="text-gray-600">Welcome back! Please login to your account</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center mr-3">
                <span className="text-white text-xs">!</span>
              </div>
              <span className="text-red-700 font-medium">INVALID PIN!</span>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-blue-600 p-8 rounded-lg">
          <Card className="bg-gray-200 border-0">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
                Enter PIN
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="flex justify-center space-x-4 mb-8">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className="w-16 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none bg-white"
                      maxLength={1}
                    />
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isLoading || pin.join('').length !== 4}
                    className="bg-gray-700 hover:bg-gray-800 text-white px-8 py-2 rounded-md font-medium"
                  >
                    {isLoading ? 'Verifying...' : 'Submit'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to OTP
          </button>
        </div>
      </div>
    </div>
  );
};