import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./context/AuthContext";
import { HomePageBefore } from "./screens/HomePageBefore";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <AuthProvider>
      <HomePageBefore />
    </AuthProvider>
  </StrictMode>,
);
