// src/services/authService.ts

const TOKEN_KEY = 'token';

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  logout(redirect: boolean = true) {
    // Clear token
    localStorage.removeItem(TOKEN_KEY);

    // Optional: clear other user data
    // localStorage.removeItem("user");

    // Optional: redirect
    if (redirect) {
      window.location.href = '/login'; // Use useNavigate if inside a React component
    }
  },
};
