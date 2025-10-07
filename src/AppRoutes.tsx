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
import SIEMDashboard from "./components/SIEMDashboard";
import { ForgotPasswordForm } from "./components/ForgotPasswordForm"; 
import Profile from "./components/Profile";
import ChangePasswordForm from "./components/ChangePasswordForm";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsAndConditions from "./components/TermsAndConditions";
import StrongPasswords from "./components/tips/StrongPasswords";
import TwoFactorAuthentication from "./components/tips/TwoFactorAuthentication";
import AvoidSuspiciousLinks from "./components/tips/AvoidSuspiciousLinks";
import KeepDevicesUpdated from "./components/tips/KeepDevicesUpdated";  
import InstallAntivirus from "./components/tips/InstallAntivirus";  
import NeverShareOTP from "./components/tips/NeverShareOTP";
import VerifyWebsiteURLs from "./components/tips/VerifyWebsiteURLs";
import AvoidPublicWifi from "./components/tips/AvoidPublicWiFis";
import BackupYourData from "./components/tips/BackupYourData";
import WarningScreen from "./components/WarningScreen";
import { FeaturesPage } from "./components/FeaturesPage";
import Insights from "./components/Insights";

const AppRoutes = () => {
  const navigate = useNavigate();

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


        <Route path="/securityAwareness" element={<SecurityAwareness />}/>

        <Route path="/contact" element={<ContactForm />} />

        <Route path="/siem-dashboard" element={<SIEMDashboard />} />

        <Route path="/forgot-password" element={<ForgotPasswordForm/>} />

          <Route path="/reset-password" element={<ForgotPasswordForm/>} />

        <Route path="/warning" element={<WarningScreen />} />

        <Route path="/features" element={<FeaturesPage />} />
        
        <Route path="/profile" element={<Profile />} />

        <Route path="/change-password" element={<ChangePasswordForm />} />

        <Route path="/insights" element={<Insights />} />

<Route path="/privacy-policy" element={<PrivacyPolicy />} />

<Route path="/terms-and-conditions" element={<TermsAndConditions />} />

        <Route path="/tips/strong-passwords" element={<StrongPasswords />} />
        <Route path="/tips/two-factor-authentication" element={<TwoFactorAuthentication />} />
        <Route path="/tips/avoid-suspicious-links" element={<AvoidSuspiciousLinks />} />
        <Route path="/tips/keep-devices-updated" element={<KeepDevicesUpdated />} />
        <Route path="/tips/install-antivirus" element={<InstallAntivirus />} />
        <Route path="/tips/never-share-otp" element={<NeverShareOTP />} />
        <Route path="/tips/verify-website-urls" element={<VerifyWebsiteURLs />} />
        <Route path="/tips/avoid-public-wifi" element={<AvoidPublicWifi />} />
        <Route path="/tips/backup-your-data" element={<BackupYourData />} />
    </Routes>
  );
};

export default AppRoutes;
