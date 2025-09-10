import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useNavigate } from 'react-router-dom';
// import jwt from '../api/auth.js';
import { jwtDecode } from 'jwt-decode';
import Header from './ui/Header';
import Footer from './ui/Footer';
import { ArrowLeft } from 'lucide-react';
import { set } from 'mongoose';
import { API_BASE_URL } from '../services/api';

const ChangePasswordForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [currentPasswordError, setCurrentPasswordError] = useState('');
const [newPasswordError, setNewPasswordError] = useState('');
const [confirmPasswordError, setConfirmPasswordError] = useState('');
const [generalError, setGeneralError] = useState('');

  const [isPinVerified, setIsPinVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Show PIN modal on mount
    setIsPinVerified(false);
  }, []);

// Handle PIN verification
const handleVerifyPin = async (e: React.FormEvent) => {
  e.preventDefault();
  setPinError('');

  // Empty field validation
  if (!pin) {
    setPinError('PIN cannot be empty');
    return;
  }

  // Numeric and length validation
  if (!/^\d{4}$/.test(pin)) {
    setPinError('PIN must be exactly 4 digits');
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    navigate('/login');
    return;
  }

  let email = '';
  try {
    const decoded: any = jwtDecode(token);
    email = decoded.email;
  } catch (err) {
    setPinError('Invalid token');
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/verify-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email, pin }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'PIN verification failed');
    }

    setIsPinVerified(true);
  } catch (err) {
    setPinError(err instanceof Error ? err.message : 'PIN verification failed');
  }
};

// Keep numeric-only restriction in input handler
const handleNumericInput = (
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (val: string) => void
) => {
  const value = e.target.value;
  if (/^\d{0,4}$/.test(value)) {
    setter(value);
  }
};


const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

  // reset errors
  setCurrentPasswordError('');
  setNewPasswordError('');
  setConfirmPasswordError('');
  setGeneralError('');
  setSuccessMessage('');

  let hasError = false;

  if (!currentPassword) {
    setCurrentPasswordError('Current password cannot be empty');
    hasError = true;
  }

  if (!newPassword) {
    setNewPasswordError('New password cannot be empty');
    hasError = true;
  } else if (/^\d+$/.test(newPassword)) {
    setNewPasswordError('Password cannot be only numbers');
    hasError = true;
  } else if (newPassword.length < 6) {
    setNewPasswordError('Password must be at least 6 characters');
    hasError = true;
  }

  if (!confirmPassword) {
    setConfirmPasswordError('Please confirm your password');
    hasError = true;
  } else if (newPassword !== confirmPassword) {
    setConfirmPasswordError('Passwords do not match');
    hasError = true;
  }

  if (hasError) return;
  setIsLoading(true);
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to change password');
    }

    setSuccessMessage(data.message || 'Password changed successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Something went wrong');
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-gray-100 relative">
      {/* Back Button */}
      <Header
        token={localStorage.getItem("token") || ""}
        handleLogout={() => {
          localStorage.removeItem("token");
          navigate("/login");
        }}
      />

      <main className="flex-grow p-6 bg-gradient-to-br from-indigo-50 to-blue-100 rounded-lg">
        <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-100 min-h-screen rounded-lg">
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white bg-gradient-to-r from-red-500 to-red-600 px-3 py-2 rounded-lg shadow-md hover:scale-105 transition transform duration-200"
            >
              <ArrowLeft className="w-5 h-5" /> Back
            </button>
          </div>

          {/* PIN Modal */}
          {!isPinVerified && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
                <h2 className="text-xl font-bold mb-4">Enter Your PIN</h2>
                {pinError && (
                  <div className="text-red-600 text-sm mb-3">{pinError}</div>
                )}
                <form onSubmit={handleVerifyPin}>
<input
  type="password"
  inputMode="numeric"
  value={pin}
  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
  maxLength={4}
  placeholder="4-digit PIN"
  className="w-full px-4 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
/>


                  <Button
                    type="submit"
                    className="w-full bg-blue-600 text-white hover:bg-blue-700 py-2 rounded-md"
                  >
                    Verify PIN
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Change Password Form */}
          {isPinVerified && (
            <div className="flex items-center justify-center h-full px-4">
              <div className="w-full max-w-md">
                <Card className="bg-white shadow-lg">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-bold text-center mb-6">Change Password</h2>

                    {error && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                      </div>
                    )}

                    {successMessage && (
                      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                        {successMessage}
                      </div>
                    )}

                   <form onSubmit={handleChangePassword} className="space-y-6">
  <div>
    <label className="block text-sm font-medium mb-2">Current Password</label>
    <input
      type="password"
      value={currentPassword}
      onChange={(e) => setCurrentPassword(e.target.value)}
      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    {currentPasswordError && (
      <p className="text-red-500 text-sm mt-1">{currentPasswordError}</p>
    )}
  </div>

  <div>
    <label className="block text-sm font-medium mb-2">New Password</label>
    <input
      type="password"
      value={newPassword}
      onChange={(e) => setNewPassword(e.target.value)}
      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    {newPasswordError && (
      <p className="text-red-500 text-sm mt-1">{newPasswordError}</p>
    )}
  </div>

  <div>
    <label className="block text-sm font-medium mb-2">Confirm New Password</label>
    <input
      type="password"
      value={confirmPassword}
      onChange={(e) => setConfirmPassword(e.target.value)}
      className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    {confirmPasswordError && (
      <p className="text-red-500 text-sm mt-1">{confirmPasswordError}</p>
    )}
  </div>

  {generalError && (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {generalError}
    </div>
  )}

  {successMessage && (
    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      {successMessage}
    </div>
  )}

  <Button
    type="submit"
    disabled={isLoading}
    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium text-lg"
  >
    {isLoading ? 'Changing...' : 'Change Password'}
  </Button>
</form>

                  </CardContent>
                </Card>
              </div>
            </div>
          )}
          </div>
      </main>
      <Footer />
    </div>
  );
};

export default ChangePasswordForm;
