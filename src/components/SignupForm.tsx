import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ArrowLeft } from 'lucide-react';

export const SignupForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [emailError, setEmailError] = useState('');
const [usernameError, setUsernameError] = useState('');
const [passwordError, setPasswordError] = useState('');
const [confirmPasswordError, setConfirmPasswordError] = useState('');
const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | ''>('');

  const { signup } = useAuth();
  const navigate = useNavigate();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setSuccessMessage('');

  let hasError = false;

  // Email validation
  if (!email.trim()) {
    setEmailError('Email is required');
    hasError = true;
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Enter a valid email address');
      hasError = true;
    } else {
      setEmailError('');
    }
  }

  // Username validation
  if (!username.trim()) {
    setUsernameError('Username is required');
    hasError = true;
  } else {
    setUsernameError('');
  }

  // Password validation
  if (!password.trim()) {
    setPasswordError('Password is required');
    hasError = true;
  } else if (password.length < 8 || password.length > 16) {
    setPasswordError('Password must be 8–16 characters long');
    hasError = true;
  } else if (!/[A-Z]/.test(password)) {
    setPasswordError('Password must contain at least one uppercase letter');
    hasError = true;
  } else if (!/[a-z]/.test(password)) {
    setPasswordError('Password must contain at least one lowercase letter');
    hasError = true;
  } else if (!/[0-9]/.test(password)) {
    setPasswordError('Password must contain at least one number');
    hasError = true;
  } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    setPasswordError('Password must contain at least one symbol');
    hasError = true;
  } else {
    setPasswordError('');
  }

  // Confirm password validation
  if (!confirmPassword.trim()) {
    setConfirmPasswordError('Confirm Password is required');
    hasError = true;
  } else if (confirmPassword !== password) {
    setConfirmPasswordError('Passwords do not match');
    hasError = true;
  } else {
    setConfirmPasswordError('');
  }

  if (hasError) return; // stop submission if any field fails

  setIsLoading(true);

  try {
    await signup(email, username, password);
    setSuccessMessage(`A verification email has been sent to ${email}`);
    setTimeout(() => window.close(), 3000);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Signup failed');
  }

  setIsLoading(false);
};

const handleBackToHome = () => {
    navigate('/');
  };

const checkPasswordStrength = (pwd: string) => {
  if (!pwd) return '';
  if (pwd.length < 8) return 'weak';

  const hasNumbers = /\d/.test(pwd);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
  const hasUpper = /[A-Z]/.test(pwd);

  if (pwd.length >= 12 && hasNumbers && hasSpecial && hasUpper) {
    return 'strong';
  }
  return 'medium';
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-100 to-purple-200 flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md bg-white shadow-xl rounded-2xl border border-gray-100">
        <CardContent className="p-8">
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
                <h1 className="text-4xl font-extrabold text-indigo-700 drop-shadow-sm">
                  Join Vaultence
                </h1>
                <p className="text-gray-500 mt-1">Sign Up to your Vaultence account</p>
              </div>

              {error && (
                <div className="flex items-start space-x-2 text-sm text-red-700 bg-red-50 border border-red-300 rounded-xl px-4 py-3 mb-6 shadow-sm">
                  <svg
                    className="h-5 w-5 mt-0.5 text-red-500 animate-shake"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zm-8-1V5h2v4h-2zm0 4v-2h2v2h-2z"/>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

          {/* <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
            Create Account
          </h2> */}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 animate-fadeIn">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-4 animate-fadeIn">
              {successMessage} <br />
              You can now close this tab.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                
              />
                {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                
              />

                {usernameError && <p className="text-red-500 text-sm mt-1">{usernameError}</p>}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value);
                  setPasswordStrength(checkPasswordStrength(e.target.value));}}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                
              />
                {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}

                  {password && (
    <div className="mt-2 h-2 w-full bg-gray-200 rounded">
      <div
        className={`h-2 rounded ${
          passwordStrength === 'weak'
            ? 'bg-red-500 w-1/3'
            : passwordStrength === 'medium'
            ? 'bg-yellow-400 w-2/3'
            : passwordStrength === 'strong'
            ? 'bg-green-500 w-full'
            : ''
        }`}
      ></div>
    </div>
  )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
                
              />
                {confirmPasswordError && <p className="text-red-500 text-sm mt-1">{confirmPasswordError}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-semibold transition-all duration-200"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200"
              >
                Login
              </button>
            </p>
          </div>


                                <div className="mt-6 text-center">
          <button
            onClick={handleBackToHome}
            className="text-gray-600 hover:text-gray-800 flex items-center justify-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to home</span>
          </button>
        </div>
        </CardContent>
      </Card>
    </div>
  );
};
