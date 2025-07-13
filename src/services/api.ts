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
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
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
async verifyOtp(email: string, otp: string, otpToken: string) {
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
    const response = await fetch(`${API_BASE_URL}/passwords`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch passwords');
    }

    return response.json();
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
    const response = await fetch(`${API_BASE_URL}/passwords/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(passwordData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update password');
    }

    return response.json();
  }

  logout() {
    localStorage.removeItem('token');
  }

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
}

export const apiService = new ApiService();