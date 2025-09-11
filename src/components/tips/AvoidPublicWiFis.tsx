import React  from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";
import { API_BASE_URL } from '../../services/api';

const AvoidPublicWiFi: React.FC = () => {
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Header */}
      <Header
        token={localStorage.getItem("token") || ""}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-8 md:p-10"
        >
          {/* Back Button */}
          {/* <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 mb-4 transition"
          >
            <ArrowLeft size={18} /> Back
          </button> */}

        {/* Title */}
<h1 className="text-3xl md:text-4xl font-extrabold text-orange-600 mb-6 leading-tight">
  Avoid Accessing Sensitive Information Over Public Wi-Fi
</h1>

{/* Description */}
<p className="text-gray-700 text-lg leading-relaxed mb-6">
  Public Wi-Fi networks — like those in coffee shops, airports, libraries, or hotels — are often 
  <span className="font-semibold"> unsecured</span>, meaning that anyone on the same network could potentially 
  monitor your online activity. Hackers can perform <span className="font-semibold">man-in-the-middle (MITM) attacks</span> 
  to intercept your data, putting sensitive information such as <span className="font-semibold">bank details, login credentials, 
  and personal files</span> at serious risk. Always think twice before entering sensitive data over a public connection.
</p>

{/* Subheading */}
<h2 className="text-2xl font-semibold text-gray-800 mb-4">Secure Practices</h2>

{/* Expanded Tips List */}
<ul className="list-disc pl-6 space-y-3 text-gray-700">
  <li className="hover:text-orange-600 transition">
    <span className="font-semibold">Use a VPN (Virtual Private Network)</span> to encrypt your traffic. 
    This ensures that even if someone intercepts your connection, your data remains unreadable.
  </li>
  <li className="hover:text-orange-600 transition">
    <span className="font-semibold">Avoid logging into sensitive accounts</span> such as 
    banking, payment gateways, or confidential email accounts unless you're on a secure, private network.
  </li>
  <li className="hover:text-orange-600 transition">
    <span className="font-semibold">Disable file sharing and Bluetooth</span> to prevent unauthorized access 
    to your device while connected to an open network.
  </li>
  <li className="hover:text-orange-600 transition">
    If possible, <span className="font-semibold">use your mobile data or a personal hotspot</span> for transactions 
    or private communications instead of relying on public Wi-Fi.
  </li>
  <li className="hover:text-orange-600 transition">
    Ensure the websites you visit use <span className="font-semibold">HTTPS</span> for secure, encrypted communication 
    between your browser and the server.
  </li>
  <li className="hover:text-orange-600 transition">
    Regularly <span className="font-semibold">update your antivirus and firewall settings</span> to defend against 
    potential malware or phishing attempts while browsing on open networks.
  </li>
  <li className="hover:text-orange-600 transition">
    Turn on <span className="font-semibold">two-factor authentication (2FA)</span> for all accounts to add an extra 
    security layer even if your credentials are compromised.
  </li>
</ul>

{/* Additional Info */}
<div className="mt-6 p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg">
  <p className="text-gray-800 text-base leading-relaxed">
    <span className="font-semibold">Pro Tip:</span> Always "forget" the public network after use. 
    This prevents your device from auto-connecting in the future without your knowledge, reducing 
    the chances of unauthorized access.
  </p>
</div>
        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AvoidPublicWiFi;
