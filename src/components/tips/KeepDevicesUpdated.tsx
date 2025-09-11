import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";

import { API_BASE_URL } from '../../services/api';

const KeepDevicesUpdated: React.FC = () => {
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
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
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-4 transition"
          >
            <ArrowLeft size={18} /> Back
          </button> */}

          {/* Title */}
<h1 className="text-3xl md:text-4xl font-extrabold text-blue-600 mb-6 leading-tight">
  Keep Your Devices and Apps Updated Regularly
</h1>

{/* Description */}
<p className="text-gray-700 text-lg leading-relaxed mb-6">
  Keeping your devices, software, and applications updated is one of the 
  <span className="font-semibold">simplest yet most effective ways</span> to 
  protect yourself from cyber threats. Regular updates patch 
  <span className="font-semibold"> security vulnerabilities</span> that 
  hackers often exploit. Neglecting updates can make your systems susceptible 
  to <span className="font-semibold"> ransomware attacks</span>, 
  <span className="font-semibold"> data breaches</span>, 
  or <span className="font-semibold"> severe performance issues</span>. 
  Every update you install enhances your device’s security, stability, and efficiency.
</p>

{/* Subheading */}
<h2 className="text-2xl font-semibold text-gray-800 mb-4">
  Best Practices
</h2>

{/* Tips List */}
<ul className="list-disc pl-6 space-y-3 text-gray-700">
  <li className="hover:text-blue-600 transition">
    <strong>Enable automatic updates:</strong> Turn on 
    <span className="font-semibold"> auto-update settings</span> for your operating system, 
    browsers, and critical apps to ensure you never miss essential security patches.
  </li>
  <li className="hover:text-blue-600 transition">
    <strong>Update antivirus definitions:</strong> Keep your 
    <span className="font-semibold"> antivirus and security software</span> up-to-date 
    so they can detect and neutralize the latest threats.
  </li>
  <li className="hover:text-blue-600 transition">
    <strong>Remove outdated software:</strong> Uninstall unused or outdated apps, plugins, 
    and extensions that may create unnecessary security risks.
  </li>
  <li className="hover:text-blue-600 transition">
    <strong>Track critical patches:</strong> Stay informed about 
    <span className="font-semibold"> high-priority security patches</span> released by vendors, 
    especially for frequently targeted software like browsers, VPNs, and office tools.
  </li>
  <li className="hover:text-blue-600 transition">
    <strong>Restart devices regularly:</strong> Many updates require a reboot to take effect. 
    Restart your devices at least once a week to ensure all patches are applied successfully.
  </li>
  <li className="hover:text-blue-600 transition">
    <strong>Audit your systems periodically:</strong> Conduct a regular 
    <span className="font-semibold"> update and patch management review</span> to confirm 
    that no critical devices or applications have been overlooked.
  </li>
</ul>

{/* Additional Section */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
  Why Updates Are Critical
</h2>
<p className="text-gray-700 text-lg leading-relaxed mb-6">
  Cybercriminals constantly search for <span className="font-semibold">unpatched systems</span> 
  to exploit. From operating system vulnerabilities to outdated plugins, 
  these weak points can allow attackers to gain unauthorized access, steal sensitive data, 
  or install malware. Regular updates not only protect you from known vulnerabilities 
  but also improve device performance and compatibility with newer technologies.
</p>

{/* Real-Life Example */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
  Real-Life Example
</h2>
<p className="text-gray-700 text-lg leading-relaxed">
  In 2017, the <span className="font-semibold">WannaCry ransomware attack</span> 
  exploited an unpatched Windows vulnerability, affecting over 200,000 systems worldwide. 
  Organizations that had updated their systems avoided infection, while those with outdated 
  software suffered massive operational disruptions and financial losses. 
  This incident underscores the importance of keeping your systems updated regularly.
</p>

        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default KeepDevicesUpdated;

