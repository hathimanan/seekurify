import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";
import { API_BASE_URL } from '../services/api';
const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
const handleLogout = async () => {
  try {
    // Call backend to clear cookies (if using httpOnly or session cookies)
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include', // important to include cookies
    });
  } catch (err) {
    console.error('Failed to call logout endpoint', err);
  } finally {
    // Remove token from localStorage
    localStorage.removeItem('token');
    // Redirect to login
    navigate('/login');
  }
};
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col">
      {/* Header */}
      <Header
        token={localStorage.getItem("token") || ""}
        handleLogout={handleLogout}
      />
<div className="w-full max-w-lg mb-6 ml-4 sm:ml-6 mt-4 sm:mt-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 rounded-lg shadow-md hover:scale-105 transition-transform duration-200"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        </div>
      {/* Main Content */}
      <main className="flex-grow px-6 py-6 max-w-4xl mx-auto">
        {/* Back Button */}


        {/* Privacy Policy Content */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
<h1 className="text-3xl font-extrabold text-gray-800 mb-4">Privacy Policy</h1>
<p className="text-gray-700 mb-4">
  At Vaultence, your privacy and security are our top priorities. This Privacy Policy explains how we collect, use, and protect your information when you use our platform, including our password manager, link checker, file & malware scanner, and system dashboard.
</p>

<h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Information We Collect</h2>
<p className="text-gray-700 mb-4">
  We may collect personal information such as your name, email address, and any data you provide while using our services. For security utilities, we may also process system activity logs or scanning results, strictly to enhance your security experience.
</p>

<h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">How We Use Information</h2>
<p className="text-gray-700 mb-4">
  The information collected is used to provide and improve our services, communicate important updates, and ensure the highest level of security for your accounts and data. All sensitive information, including passwords, is encrypted or hashed to ensure maximum protection.
</p>

<h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Cookies</h2>
<p className="text-gray-700 mb-4">
  We use cookies to enhance your experience on our platform. Cookies help remember preferences, improve functionality, and provide insights to enhance cybersecurity awareness features. You can manage your cookie preferences in your browser settings.
</p>

<h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Security Policies</h2>
<p className="text-gray-700 mb-4">
  We take your security seriously. Our systems implement modern security practices, including the use of Helmet.js to secure HTTP headers and protect against common web vulnerabilities such as XSS, clickjacking, and other attacks. All connections are encrypted via HTTPS, and sensitive information is stored using strong encryption or hashing. We regularly monitor our systems and provide real-time alerts to protect your account and files.
</p>

<h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Third-Party Services</h2>
<p className="text-gray-700 mb-4">
  We do not sell your data. Certain features may integrate with third-party services to enhance functionality (e.g., malware detection engines), all of which are committed to maintaining the confidentiality and security of your information.
</p>

<h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">User Control</h2>
<p className="text-gray-700 mb-4">
  You have full control over your data. You can manage, update, or delete your account information at any time. Our platform is designed to give you transparency and control over your privacy settings, scanned files, and activity logs.
</p>

<h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Contact Us</h2>
<p className="text-gray-700">
  If you have any questions about this Privacy Policy or need assistance with your account, please contact us at <a href="mailto:support@vaultence.com" className="text-blue-600 underline">support@vaultence.com</a>.
</p>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
