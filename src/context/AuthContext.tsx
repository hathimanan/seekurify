import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';

interface User {
  id: string;
  email: string;
  username?: string;
  pin?: string; // Optional, only needed for PIN-based login
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, otp: string,otpToken: string) => Promise<void>;
  verifyPin: (email: string, pin: string) => Promise<void>;
  signup: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.id, email: payload.email });
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await apiService.login({ email, password }); // No token expected here
    } catch (error) {
      throw error;
    }
  };

  const verifyOtp = async (email: string, otp: string,otpToken: string) => {
    try {
      await apiService.onverifyOtp(email, otp, otpToken); // No token here either
    } catch (error) {
      throw error;
    }
  };

  const verifyPin = async (email: string, pin: string) => {
    try {
      const response = await apiService.verifyPin(email, pin);
      const token = response.token;
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ id: payload.id, email: payload.email });
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email: string, username: string, password: string) => {
    try {
      await apiService.signup({ email, username, password });
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
