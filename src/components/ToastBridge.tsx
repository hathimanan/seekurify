// ToastBridge.tsx (example using a simple alert; swap with your UI lib)
import { useEffect } from "react";

export default function ToastBridge() {
  useEffect(() => {
    const handler = (e: any) => {
      const d = e.detail;
      const msg = d?.message || "Suspicious activity detected on your account.";
      alert(`⚠️ ${msg}\n\nIP: ${d?.ip || "Unknown"}\nWhen: ${d?.at || ""}`);
    };
    window.addEventListener("SECURITY_ALERT", handler as any);
    return () => window.removeEventListener("SECURITY_ALERT", handler as any);
  }, []);
  return null;
}
