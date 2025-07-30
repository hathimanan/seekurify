import react from "@vitejs/plugin-react";
import tailwind from "tailwindcss";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
    server: {
    proxy: {
      '/api': 'http://localhost:5000',  // Proxy to backend server
    },
  },
  plugins: [react()],
  base: "./",
  css: {
    postcss: {
      plugins: [tailwind(),],
    },
  },
});

