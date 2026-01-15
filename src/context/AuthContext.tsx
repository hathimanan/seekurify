import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  username?: string;
  pin?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, otp: string, otpToken: string) => Promise<void>;
  verifyPin: (email: string, pin: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  function isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    try {
      const base64Payload = token.split('.')[1];
      const decodedPayload = base64UrlDecode(base64Payload);
      const payload = JSON.parse(decodedPayload);

      return payload.exp * 1000 < Date.now();
    } catch (err) {
      console.error('Failed to parse token expiry:', err);
      return true;
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      if (isTokenExpired(token)) {
        console.warn('Token expired on load, logging out');
        logout(); // <-- FIX: use logout function instead of manual clearing
        setIsLoading(false);
        return;
      }

      try {
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(atob(base64Payload));
        setUser({ id: payload.id, email: payload.email });
      } catch (error) {
        console.error('Invalid token structure:', error);
        logout();
      }
    }

    setIsLoading(false);

    // Periodic token check
    const interval = setInterval(() => {
      const t = localStorage.getItem('token');
      if (t && isTokenExpired(t)) {
        console.warn('Token expired during active session');
        logout(); // <-- FIX: centralize logic
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string) => {
    await apiService.login({ email, password });
  };

  const verifyOtp = async (email: string, otp: string, otpToken: string) => {
    await apiService.onverifyOtp(email, otp, otpToken);
  };

  const verifyPin = async (email: string, pin: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.verifyPin(email, pin);

      const token = response.token;
      localStorage.setItem('token', token); // <-- FIX: store token

      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ id: payload.id, email: payload.email });
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    await apiService.signup({ email, username, password });
  };

  const logout = () => {
    apiService.logout();

    localStorage.removeItem('token'); // <-- FIX: token first
    setUser(null);                    // <-- FIX: clear state
    navigate('/HomePageBefore', { replace: true }); // <-- FIX: redirect always
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    verifyOtp,
    verifyPin,
    signup,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
