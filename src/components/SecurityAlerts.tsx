// SecurityAlert.tsx
import { useEffect } from "react";
import { io } from "socket.io-client";
// If you store the JWT, pass it for auth mapping:
const token = localStorage.getItem("token");

const SOCKET_URL =  "http://localhost:5000";

export default function SecurityAlert({ userId }: { userId: string }) {
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      withCredentials: true,
      auth: { token: localStorage.getItem("token") || "" }, // optional
      transports: ["websocket"],          // prefer ws for performance
      reconnectionAttempts: 5,            // resilience
    });

      socket.on("connect", () => {
    console.log("✅ Connected to socket:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Socket connect error:", err.message);
  });

    // Register user with socket server
    socket.emit("registerUser", userId);

    // Alert handler
    const onAlert = (data: any) => {
      // Trigger custom browser event for global handlers
      window.dispatchEvent(new CustomEvent("SECURITY_ALERT", { detail: data }));
    };

    // Listen for suspicious login attempts
    socket.on("suspiciousLogin", onAlert);

    // Cleanup on unmount
    return () => {
      socket.off("suspiciousLogin", onAlert);
      socket.disconnect();
    };
  }, [userId]);

  return null;
}