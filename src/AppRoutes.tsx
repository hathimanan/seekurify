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


        <Route path="/profile" element={<Profile />} />

        <Route path="/change-password" element={<ChangePasswordForm />} />

    </Routes>
  );
};

export default AppRoutes;
