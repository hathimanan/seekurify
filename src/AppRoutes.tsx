import { Routes, Route, useNavigate } from "react-router-dom";
import { LoginForm } from "./components/LoginForm";
import { SignupForm } from "./components/SignupForm";
import { HomePageBefore } from "./screens/HomePageBefore";
import { HomePageAfter } from "./screens/HomePageAfter/HomePageAfter";

const AppRoutes = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<HomePageBefore />} />
      <Route path="/login" element={<LoginForm onToggleMode={() => navigate('/signup')} />} />
      <Route path="/signup" element={<SignupForm onToggleMode={() => navigate('/login')} onSignupSuccess={() => navigate('/homepageAfterLogin')} />} />
      <Route path="/homepageAfterLogin" element={<HomePageAfter />} />
    </Routes>
  );
};

export default AppRoutes;
