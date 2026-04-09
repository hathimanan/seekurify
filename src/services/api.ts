import { get } from "http";
import { authService } from './authService';
import LoginEventSchema from '../models/LoginEvent.model.js';

export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? '/api' // ✅ in production, API is usually proxied under the same domain
    : 'http://localhost:5000/api'; // 👈 replace 5000 with your backend port

    const FEATURE_FLAGS_ENDPOINT = `${API_BASE_URL}/feature-flags`;


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

export interface CreatePasswordSharePayload {
  encryptedData: string;
  iv: string;
  salt?: string;
  expiresAt: string;
  metadata?: {
    website?: string;
    username?: string;
  };
  pin?: string;
}


interface PasswordEntry {
  website: string;
  username: string;
  password: string;
  category?: string;
  notes?: string;
}

class ApiService {
private handleUnauthorized(message: string = 'Session expired or unauthorized.') {
  authService.notifySessionExpired('unauthorized');
  throw new Error(message);
}

private async parseError(response: Response, fallback: string) {
  const contentType = response.headers.get('content-type') || '';
  try {
    if (contentType.includes('application/json')) {
      const error = await response.json();
      return error.error || error.message || fallback;
    }

    const text = await response.text();
    return text.trim() || fallback;
  } catch {
    return fallback;
  }
}

private async parseJson(response: Response, fallbackMessage: string) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(text?.trim() || fallbackMessage);
  }
  return response.json();
}

private getAuthHeaders() {
  const token = localStorage.getItem('token');
  if (!token) {
    return this.handleUnauthorized('User not authenticated. Token missing.');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async createPasswordShare(
  passwordId: string,
  payload: CreatePasswordSharePayload
) {
  const token = localStorage.getItem("token");

  if (!token) {
    return this.handleUnauthorized("User not authenticated.");
  }

  const response = await fetch(
    `${API_BASE_URL}/auth/${passwordId}/share`,
    {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    }
  );

  if (response.status === 401) {
    return this.handleUnauthorized('Session expired or unauthorized.');
  }

  if (!response.ok) {
    throw new Error(await this.parseError(response, "Failed to share password"));
  }

  return response.json(); // { shareId }
}



// public access (no auth header)
async getSharedPassword(shareId: string) {
  const response = await fetch(
    `${API_BASE_URL}/auth/share/${shareId}`,
    { method: "GET" }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to access shared password");
  }

  return response.json(); // { encryptedData, iv }
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
    throw new Error(await this.parseError(response, 'Login failed'));
  }

  return await this.parseJson(response, 'Invalid login response'); // returns { message: "Logged in. Proceed to OTP." }
}
async onverifyOtp(email: string, otp: string, otpToken: string) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, otpToken }), // ✅ Send all three
  });

  if (!response.ok) {
    throw new Error(await this.parseError(response, 'Invalid OTP'));
  }

  return await this.parseJson(response, 'Invalid OTP response'); // { success: true }
}

async verifyPin(email: string, pin: string) {
  const response = await fetch(`${API_BASE_URL}/auth/verify-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, pin }),
  });

  const data = await this.parseJson(response, 'Invalid PIN response'); // parse **once**

  if (!response.ok) {
    throw new Error(data.error || 'Invalid PIN');
  }

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

    if (response.status === 401) {
      return this.handleUnauthorized('Session expired or unauthorized.');
    }

    if (!response.ok) {
      throw new Error(await this.parseError(response, 'Failed to fetch dashboard'));
    }

    return response.json();
  }




async getPasswords(cacheBuster?: number) {
  const token = localStorage.getItem('token');

  if (!token) {
    return this.handleUnauthorized('User not authenticated. Token missing.');
  }

      const url = cacheBuster
    ? `${API_BASE_URL}/passwords?t=${cacheBuster}`
    : `${API_BASE_URL}/passwords`;

  const response = await fetch(url, {
    method: 'GET',
    headers: this.getAuthHeaders(),
     cache: 'no-store',
  });

  if (response.status === 401) {
    return this.handleUnauthorized('Session expired or unauthorized.');
  }

  if (!response.ok) {
    throw new Error(await this.parseError(response, 'Failed to fetch passwords'));
  }

  return await response.json();
}


async getSIEMEvents() {
  const response = await fetch(`${API_BASE_URL}/siem/events`, {
    method: "GET",
    headers: this.getAuthHeaders(),
  });

  if (response.status === 401) {
    return this.handleUnauthorized('Session expired or unauthorized.');
  }

  if (!response.ok) {
    throw new Error(await this.parseError(response, "Failed to fetch SIEM events"));
  }

  return response.json();
}


  async addPassword(passwordData: PasswordEntry) {
const response = await fetch(`${API_BASE_URL}/passwords`, {
    method: 'POST',
    headers: this.getAuthHeaders(),
    body: JSON.stringify(passwordData)
  });

  if (response.status === 401) {
    return this.handleUnauthorized('Session expired or unauthorized.');
  }

  if (!response.ok) {
    throw new Error(await this.parseError(response, 'Failed to add password'));
  }

  return response.json();
  }


async detectPhishing(emailContent: string) {
  // Debug: Log to see if the method is even being called
  console.log("Attempting to scan:", emailContent.substring(0, 20) + "...");

  const response = await fetch(`${API_BASE_URL}/detect-attacker`, {
    method: 'POST',
    headers: this.getAuthHeaders(), // Ensure this returns { 'Content-Type': 'application/json', ... }
    body: JSON.stringify({ emailContent })
  });

  if (response.status === 401) {
    return this.handleUnauthorized('Session expired or unauthorized.');
  }

  if (!response.ok) {
    throw new Error(await this.parseError(response, 'Backend failed to respond'));
  }

  return response.json();
}

async updatePassword(id: string, passwordData: PasswordEntry & { currentPassword: string }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return this.handleUnauthorized('User not authenticated.');
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
  return this.handleUnauthorized('Session expired or unauthorized.');
}

if (response.status === 403) {
  throw new Error(await this.parseError(response, 'Forbidden request'));
}




  if (!response.ok) {
    throw new Error(await this.parseError(response, 'Failed to update password'));
  }

  return response.json();
}

async deletePassword(id: string) {
  const token = localStorage.getItem('token');
  if (!token) {
    return this.handleUnauthorized('User not authenticated. Token missing.')
  }

  const resp = await fetch(`${API_BASE_URL}/passwords/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (resp.status === 401) {
    return this.handleUnauthorized('Session expired or unauthorized.');
  }

  // If the server returns an error status, try to parse its JSON message
  if (!resp.ok) {
    throw new Error(await this.parseError(resp, 'Failed to delete password'));
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



 async getFlags(token: string) {
  const res = await fetch(FEATURE_FLAGS_ENDPOINT, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (res.status === 401) {
    return this.handleUnauthorized('Session expired or unauthorized.');
  }
  return res.json();
}


async toggleFlag(token: string, key: string, payload: { enabled: boolean; rolloutPercentage: number }) {
  const res = await fetch(`${API_BASE_URL}/feature-flags/toggle`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ key, ...payload })
  });
  if (res.status === 401) {
    return this.handleUnauthorized('Session expired or unauthorized.');
  }
  return res.json();
}



  logout() {
    authService.clearSession();
  }

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
}

export const apiService = new ApiService();
