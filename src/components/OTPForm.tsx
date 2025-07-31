import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { X } from 'lucide-react';
import { apiService } from '../services/api';
import { Navigate } from 'react-router-dom';
import { HomePageAfter } from '../screens/HomePageAfter/HomePageAfter';
interface OTPFormProps {
  email: string;
  otpToken: string; // ✅ Add this line
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
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(''); // Clear error when user types

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
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
    
    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
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

  // Store user in context or state if not already
    if (userData?.user?.pin === '0000') {
        setGoToHome(true); // ✅ Trigger redirect via render
      } else {
        if (onSuccess) onSuccess(); // Show PINForm
      }

    } catch (err: any) {
      const errorMessage = err?.message || (typeof err === 'string' ? err : 'Invalid OTP');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Redirect by rendering the component directly
  if (goToHome) {
    return <HomePageAfter />;
  }




  // const handleVerifyPIN = async (pin: string) => {
  //   try {
  //     // Complete the login process with both OTP and PIN
  //     await onVerifyOTP(otp.join('') + pin);
  //   } catch (err) {
  //     throw err; // Re-throw to be handled by PINForm
  //   }
  // };

  // const handleBackToPIN = () => {
  //   setError('');
  // };

  // if (showPIN) {
  //   return (
  //     <PINForm
  //       email={email}
  //       onVerifyPIN={handleVerifyPIN}
  //       onBack={handleBackToPIN}
  //     />
  //   );
  // }
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
            <span className="text-red-700 text-sm font-medium">{error}</span>
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
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">Enter OTP</h2>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-3 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                maxLength={1}
                className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition outline-none bg-white"
              />
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading || !isOtpValid}
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
          ← Back to login
        </button>
      </div>
    </div>
  </div>
);}
