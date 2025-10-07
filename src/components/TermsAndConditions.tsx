import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";
import { API_BASE_URL } from '../services/api';


const TermsAndConditions: React.FC = () => {
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


        {/* Terms and Conditions Content */}
       <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
  <h1 className="text-3xl font-extrabold text-gray-800 mb-4">Terms & Conditions</h1>

  <p className="text-gray-700 mb-4">
    Welcome to <strong>Seekurify</strong>. By accessing or using our platform, you agree to comply with and be bound by these Terms & Conditions and our Privacy Policy. If you do not agree, please do not use our services.
  </p>

  <h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Platform Overview</h2>
  <p className="text-gray-700 mb-4">
    Seekurify is an all-in-one cybersecurity platform designed to provide users with tools and knowledge to enhance digital security. Key features include:
  </p>
  <ul className="list-disc list-inside text-gray-700 mb-4">
    <li><strong>Secure Password Manager:</strong> Store, manage, and generate strong passwords in a secure, encrypted environment.</li>
    <li><strong>Link Checker:</strong> Verify URLs for safety before visiting.</li>
    <li><strong>File & Malware Scanner:</strong> Detect potential threats in uploaded files.</li>
    <li><strong>System Information & Event Log Dashboard:</strong> Monitor system events and potential security threats.</li>
    <li><strong>Educational Content & Real-Time Alerts:</strong> Stay informed about cybersecurity threats and best practices.</li>
  </ul>

  <h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">User Accounts</h2>
  <p className="text-gray-700 mb-4">
    Users may be required to create an account to access certain features. You are responsible for maintaining the confidentiality of your account credentials and for all activities performed under your account. Please notify us immediately of any unauthorized use.
  </p>

  <h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Security & Data Protection</h2>
  <p className="text-gray-700 mb-4">
    All passwords are hashed and encrypted to ensure maximum protection. While Seekurify implements multiple security measures, no system is completely secure. Users acknowledge and accept the inherent risks of using online services.
  </p>

  <h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">User Responsibilities</h2>
  <p className="text-gray-700 mb-4">
    Users agree to use Seekurify in compliance with applicable laws, not attempt unauthorized access, and accept responsibility for any files or links scanned using the platform.
  </p>

  <h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Intellectual Property</h2>
  <p className="text-gray-700 mb-4">
    All content, software, trademarks, and services provided by Seekurify are the intellectual property of Seekurify or its licensors. Users may not reproduce, distribute, or create derivative works without prior written consent.
  </p>

  <h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Third-Party Services</h2>
  <p className="text-gray-700 mb-4">
    Some features may rely on third-party APIs or services for malware detection, file scanning, or link checking. Seekurify is not responsible for the performance or accuracy of these third-party services.
  </p>

  <h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Limitation of Liability</h2>
  <p className="text-gray-700 mb-4">
    Seekurify provides tools and educational content “as-is.” We are not liable for any damages, losses, or security breaches arising from your use of the platform. Users acknowledge that no cybersecurity tool can guarantee absolute protection.
  </p>

  <h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Changes to Terms</h2>
  <p className="text-gray-700 mb-4">
    Seekurify may update these Terms & Conditions from time to time. Your continued use of the platform constitutes acceptance of the updated terms.
  </p>

  <h2 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Contact Us</h2>
  <p className="text-gray-700">
    For questions or support regarding these Terms & Conditions, please contact us at <strong>support@seekurify.com</strong>.
  </p>
</div>

      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
