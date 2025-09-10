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
        rewrite: (path) => path.replace(/^\/api/, ""), // strip /api if backend doesn’t use it
      },
    },
  },
  plugins: [react()],
  base: "/", // use "/" unless deploying under a subfolder
});

