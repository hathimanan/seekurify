import { Routes, Route, useNavigate } from "react-router-dom";
import { LoginForm } from "./components/LoginForm";
import { SignupForm } from "./components/SignupForm";
import { HomePageBefore } from "./screens/HomePageBefore";
import { HomePageAfter } from "./screens/HomePageAfter/HomePageAfter";
import { SetNewPin } from "./components/SetNewPin";
import { Dashboard } from "./components/Dashboard";
import { MalwareAnalyzer } from "./components/MalwareAnalyzer";
import { SecurityAwareness } from "./components/securityAwareness";
import ContactForm from "./components/ContactForm";
import PublicContactPage from "./components/PublicContactPage";
import SIEMDashboard from "./components/SIEMDashboard";
import { ForgotPasswordForm } from "./components/ForgotPasswordForm"; 
import Profile from "./components/Profile";
import ChangePasswordForm from "./components/ChangePasswordForm";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsAndConditions from "./components/TermsAndConditions";
import SharedPasswordLanding from "./components/SharedPasswordLanding";
import VerifySharedPassword from "./components/VerifySharedPassword";

import PromptScanner  from "../src/components/chatbot/promptScanner.tsx";

// Inside your <Routes>

// import StrongPasswords from "./components/tips/StrongPasswords";
// import TwoFactorAuthentication from "./components/tips/TwoFactorAuthentication";
// import AvoidSuspiciousLinks from "./components/tips/AvoidSuspiciousLinks";
// import KeepDevicesUpdated from "./components/tips/KeepDevicesUpdated";  
// import InstallAntivirus from "./components/tips/InstallAntivirus";  
// import NeverShareOTP from "./components/tips/NeverShareOTP";
// import VerifyWebsiteURLs from "./components/tips/VerifyWebsiteURLs";
// import AvoidPublicWifi from "./components/tips/AvoidPublicWiFis";
// import BackupYourData from "./components/tips/BackupYourData";
import WarningScreen from "./components/WarningScreen";
import { FeaturesPage } from "./components/FeaturesPage";
import Insights from "./components/Insights";
import BotChat from "./components/ui/BotChat";
import React from 'react';
import { useAuth } from './context/AuthContext';
import PhishingDetector from "./components/PhishingDetector";
import FeatureFlagPage from "./components/admin/FeatureFlagPage";
import SiteShieldAudit from "./components/SiteShieldAudit";
import CSPBuilder      from "./components/CSPBuilder";
import PromptInjectionScanner from "./components/PromptInjectionScanner";
import WatchAgent from "./components/WatchAgent";
import DeepFakeDetector from "./components/DeepFakeDetector";
import AIAgentScanner from "./components/AIAgentScanner";
import RedTeamAgent from "./components/RedTeamAgent";
import PricingPage from "./components/PricingPage";
import FindingsBoard from "./components/FindingsBoard";
import WorkspaceDashboard from "./components/WorkspaceDashboard";
import WorkspaceVault from "./components/WorkspaceVault";
import WorkspaceSettings from "./components/WorkspaceSettings";
import WorkspaceInviteAccept from "./components/WorkspaceInviteAccept";

const AppRoutes = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // If the user becomes unauthenticated, ensure they are logged out and redirected to /login
  // Skip redirect while auth is initializing (isLoading)
React.useEffect(() => {
  if (isLoading) return; // Wait for Auth to finish

  const token = localStorage.getItem("token");
  const googleToken = localStorage.getItem("googleToken");
   if(googleToken){
    localStorage.setItem("token", googleToken); // Fix assignment
      }
const currentPath = window.location.pathname;
  const searchParams = window.location.search;
const isPublicRoute = [
    "/HomePageBefore", "/login", "/signup", "/forgot-password",
    "/reset-password", "/features", "/", "/insights", "/set-new-pin", "/contact", "/contact-public"
  ].includes(currentPath) || currentPath.startsWith("/workspace-invite/");

 const hasSetNewPinToken = currentPath === "/set-new-pin" && 
                           new URLSearchParams(searchParams).has("token");

  if (!isAuthenticated && !token && !googleToken && !isPublicRoute && !hasSetNewPinToken) {
    navigate("/HomePageBefore", { replace: true });
  }


  // CASE 2: Authenticated → prevent user from accessing login/signup again
  if (isAuthenticated) {
    if (currentPath === "/login" || currentPath === "/signup") {
      navigate("/homepageAfterLogin", { replace: true });
    }
    return;
  }
}, [isAuthenticated, isLoading, navigate]);



  return (
    <Routes>
<Route path="/" element={<HomePageBefore />} />

      {/* 🔐 Login */}
      <Route
        path="/login"
        element={
          <LoginForm onToggleMode={() => navigate('/signup')} />
        }
      />

      {/* 📝 Signup - redirects to Set New PIN */}
 <Route path="/signup" element={<SignupForm />} />


      {/* 🔑 Set New PIN - redirects to login */}
      {/* <Route
        path="/set-new-pin"
          element={<SetNewPin />}

      /> */}

<Route path="/set-new-pin" element={<SetNewPin />} />


      {/* 🏠 Authenticated dashboard */}
      <Route path="/homepageAfterLogin" element={<HomePageAfter />} />

      {/* (Optional) fallback route for unmatched paths */}
      <Route path="/homepageBefore" element={<HomePageBefore />} />

        <Route path="/dashboard" element={<Dashboard />} />


        <Route path="/malware-analysis" element={<MalwareAnalyzer />} />

<Route path="/feature-flags" element={<FeatureFlagPage />} />

        <Route path="/securityAwareness" element={<SecurityAwareness />} />

        <Route path="/contact" element={<ContactForm />} />
        <Route path="/contact-public" element={<PublicContactPage />} />

{/* <Route path="/devices" element={<SIEMDashboard />} /> */}
        <Route path="/siem-dashboard" element={<SIEMDashboard />} />

        <Route path="/forgot-password" element={<ForgotPasswordForm/>} />

<Route path="/share/:token" element={<SharedPasswordLanding />} />
<Route path="share/:googleToken" element={<SharedPasswordLanding />} />
{/* <Route  path="/share/:shareId/request-otp"
  element={<VerifySharedPassword />}
/> */}
<Route  path="/share/:shareId/verify"
  element={<VerifySharedPassword />}
/>
          <Route path="/reset-password" element={<ForgotPasswordForm/>} />

        <Route path="/warning" element={<WarningScreen />} />

<Route path="/detect-attacker" element={<PhishingDetector />} />

        <Route path="/features" element={<FeaturesPage />} />
        
        <Route path="/profile" element={<Profile />} />

        <Route path="/change-password" element={<ChangePasswordForm />} />

        <Route path="/insights" element={<Insights />} />

        <Route path="/ask" element={<BotChat />} />

        <Route path="/prompt-scanner" element={<PromptScanner />} />

        <Route path="/site-shield" element={<SiteShieldAudit />} />
        <Route path="/csp-builder" element={<CSPBuilder />} />
        <Route path="/injection-scanner" element={<PromptInjectionScanner />} />
        <Route path="/watch-agent" element={<WatchAgent />} />
        <Route path="/deepfake-detector" element={<DeepFakeDetector />} />
        <Route path="/ai-agent-scanner" element={<AIAgentScanner />} />
        <Route path="/red-team" element={<RedTeamAgent />} />
        <Route path="/findings" element={<FindingsBoard />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/pii-detector" element={<PromptScanner />} />
        <Route path="/workspaces" element={<WorkspaceDashboard />} />
        <Route path="/workspaces/:workspaceId/vault" element={<WorkspaceVault />} />
        <Route path="/workspaces/:workspaceId/settings" element={<WorkspaceSettings />} />
        <Route path="/workspace-invite/:token" element={<WorkspaceInviteAccept />} />


<Route path="/privacy-policy" element={<PrivacyPolicy />} />

<Route path="/terms-and-conditions" element={<TermsAndConditions />} />

        {/* <Route path="/tips/strong-passwords" element={<StrongPasswords />} />
        <Route path="/tips/two-factor-authentication" element={<TwoFactorAuthentication />} />
        <Route path="/tips/avoid-suspicious-links" element={<AvoidSuspiciousLinks />} />
        <Route path="/tips/keep-devices-updated" element={<KeepDevicesUpdated />} />
        <Route path="/tips/install-antivirus" element={<InstallAntivirus />} />
        <Route path="/tips/never-share-otp" element={<NeverShareOTP />} />
        <Route path="/tips/verify-website-urls" element={<VerifyWebsiteURLs />} />
        <Route path="/tips/avoid-public-wifi" element={<AvoidPublicWifi />} />
        <Route path="/tips/backup-your-data" element={<BackupYourData />} /> */}
    </Routes>
  );
};

export default AppRoutes;
