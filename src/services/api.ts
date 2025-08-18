import { get } from "http";
import { authService } from './authService';
import LoginEventSchema from '../models/LoginEvent.model.js';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:5000/api';

interface LoginCredentials {
  email: string;
  password?: string; // only needed at login
  otp?: string;
  pin?: string;
}

interface SignupCredentials {
  email: string;
  username: string;
  password: string;
}

interface PasswordEntry {
  website: string;
  username: string;
  password: string;
  category?: string;
  notes?: string;
}

class ApiService {
private getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token)  {
     authService.logout(); // 🔒 Token missing = logout
    throw new Error('User not authenticated. Token missing.');
  };
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}






async login(credentials: LoginCredentials) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  return await response.json(); // returns { message: "Logged in. Proceed to OTP." }
}
async onverifyOtp(email: string, otp: string, otpToken: string) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, otpToken }), // ✅ Send all three
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Invalid OTP');
  }

  return await response.json(); // { success: true }
}


async verifyPin(email: string, pin: string) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, pin }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Invalid PIN');
  }

  const data = await response.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
  }

  return data;
}


  async signup(credentials: SignupCredentials) {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    return response.json();
  }

    async getUserDetails(email: string) {
        const token = localStorage.getItem('token');
    const res = await fetch(`/api/user/?email=${email}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
      }
    );
    if (!res.ok) throw new Error("User fetch failed");
    return res.json();
  }

async  logLoginEvent(userId: string) {
  await LoginEventSchema.create({ userId });
}

  async getDashboard() {
    const response = await fetch(`${API_BASE_URL}/dashboard`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch dashboard');
    }

    return response.json();
  }




async getPasswords() {
  const token = localStorage.getItem('token');

  if (!token) {
 authService.logout(); // 🔒 Token missing = logout
    throw new Error('User not authenticated. Token missing.');
    }

  const response = await fetch(`${API_BASE_URL}/passwords`, {
    method: 'GET',
    headers: this.getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch passwords');
  }

  return await response.json();
}


  async addPassword(passwordData: PasswordEntry) {
const response = await fetch(`${API_BASE_URL}/passwords`, {
    method: 'POST',
    headers: this.getAuthHeaders(),
    body: JSON.stringify(passwordData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add password');
  }

  return response.json();
  }

async updatePassword(id: string, passwordData: PasswordEntry & { currentPassword: string }) {
  const token = localStorage.getItem('token');

  if (!token) {
    authService.logout(); // no token = force logout
    throw new Error('User not authenticated.');
  }

  const response = await fetch(`${API_BASE_URL}/passwords/${id}`, {
    method: 'PUT',
    headers: this.getAuthHeaders(),
    body: JSON.stringify(passwordData)
  });

  // if (response.status === 401 || response.status === 403) {
  //   authService.logout(); // invalid or expired token = logout
  //   throw new Error('Session expired or unauthorized. Logging out.');
  // }

if (response.status === 401) {
  authService.logout();
  throw new Error('Session expired or unauthorized. Logging out.');
}

if (response.status === 403) {
  const error = await response.json();
  throw new Error(error.error || 'Forbidden request');
}




  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update password');
  }

  return response.json();
}

async deletePassword(id: string) {
  const token = localStorage.getItem('token');
  if (!token) {
    authService.logout(); // 🔒 Token missing = logout
    throw new Error('User not authenticated. Token missing.')
  }

  const resp = await fetch(`${API_BASE_URL}/passwords/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // If the server returns an error status, try to parse its JSON message
  if (!resp.ok) {
    let errorMsg = 'Failed to delete password';
    try {
      const errData = await resp.json();
      errorMsg = errData.error || errorMsg;
    } catch {
      // fall back if no JSON body
    }
    throw new Error(errorMsg);
  }

  // On success, might be 204 No Content or JSON
  const contentType = resp.headers.get('content-type') || '';
  if (resp.status === 204 || !contentType.includes('application/json')) {
    // nothing more to do
    return;
  }

  // otherwise parse and return JSON
  return resp.json();
}



  logout() {
    localStorage.removeItem('token');
  }

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
}

export const apiService = new ApiService();