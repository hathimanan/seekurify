import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000", // backend server
        changeOrigin: true,              // handles CORS & virtual hosted sites
        secure: false,                   // allow self-signed SSL if needed
        // Do not strip `/api` so the backend mounted at `/api/*` receives the same path
        rewrite: (path) => path, 
      },
    },
  },
  plugins: [react()],
  base: "/", // use "/" unless deploying under a subfolder
});

