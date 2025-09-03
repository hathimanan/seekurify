import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";

const TwoFactorAuthentication: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 via-white to-indigo-100">
      <Header
        token={localStorage.getItem("token") || ""}
        handleLogout={() => {
          localStorage.removeItem("token");
          navigate("/login");
        }}
      />

      <main className="flex-grow container mx-auto px-4 py-8">
        <motion.div
          className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-6 md:p-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back button */}
          {/* <button
            onClick={() => navigate(-1)}
            className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </button> */}

          {/* Page Title */}
<h1 className="text-3xl font-extrabold text-indigo-700 mb-4">
  Enable Two-Factor Authentication (2FA)
</h1>

{/* Intro Description */}
<p className="text-gray-700 mb-4 leading-relaxed">
  Two-Factor Authentication (2FA) adds a powerful layer of security to your 
  accounts by requiring a second verification factor in addition to your 
  password. This could be a <span className="font-semibold">time-based code</span>, 
  a <span className="font-semibold">push notification</span>, or even a 
  <span className="font-semibold">hardware security key</span>. Even if hackers 
  steal your password through phishing or a data breach, 
  <span className="font-semibold"> they won’t be able to log in without the second factor.</span>
</p>

{/* Why 2FA is Critical */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">
  Why 2FA is Essential
</h2>
<p className="text-gray-700 mb-4 leading-relaxed">
  Cyberattacks are becoming more sophisticated, and relying on passwords alone 
  is no longer safe. 2FA significantly reduces the risk of unauthorized access, 
  protecting sensitive accounts like email, banking, social media, and cloud storage. 
  Many platforms now make 2FA mandatory because it reduces the success rate of 
  <span className="font-semibold"> phishing, credential stuffing, and brute-force attacks</span> 
  by more than 99%.
</p>

{/* App Recommendations */}
<p className="text-gray-700 mb-4 leading-relaxed">
  For best results, use app-based authenticators like{" "}
  <span className="font-semibold text-indigo-600">Google Authenticator</span>
  ,{" "}
  <span className="font-semibold text-indigo-600">Authy</span>, or{" "}
  <span className="font-semibold text-indigo-600">Microsoft Authenticator</span>. 
  These apps generate one-time codes that refresh every 30 seconds, offering 
  stronger protection than SMS codes, which can be intercepted through 
  <span className="font-semibold"> SIM swapping</span> or phishing attacks.
</p>

{/* Benefits List */}
<h2 className="text-xl font-semibold text-indigo-700 mt-6 mb-3">
  Benefits of 2FA:
</h2>
<ul className="list-disc pl-6 space-y-2 text-gray-700">
  <li>Protects against stolen or leaked passwords.</li>
  <li>Prevents unauthorized access even if your credentials are compromised.</li>
  <li>Supports multiple verification methods like apps, SMS, email, or physical keys.</li>
  <li>Boosts account trust and security for financial, business, and personal platforms.</li>
  <li>Helps you stay compliant with security requirements for workplaces and sensitive industries.</li>
</ul>

{/* Types of 2FA */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">
  Types of Two-Factor Authentication
</h2>
<ul className="list-disc pl-6 space-y-2 text-gray-700">
  <li>
    <span className="font-semibold">Authenticator Apps:</span> Time-based codes generated 
    every 30 seconds. Recommended for most users.
  </li>
  <li>
    <span className="font-semibold">SMS Codes:</span> Easy to set up but less secure due 
    to SIM swap vulnerabilities.
  </li>
  <li>
    <span className="font-semibold">Hardware Security Keys:</span> Physical devices like 
    <span className="font-semibold"> YubiKey</span> or 
    <span className="font-semibold"> Google Titan</span> for advanced, phishing-resistant protection.
  </li>
  <li>
    <span className="font-semibold">Biometric 2FA:</span> Uses your fingerprint, face, or voice for 
    an added layer of convenience and security.
  </li>
</ul>

{/* Setup Steps */}
<h2 className="text-xl font-semibold text-indigo-700 mt-6 mb-3">
  How to Set Up 2FA:
</h2>
<ol className="list-decimal pl-6 space-y-2 text-gray-700">
  <li>Go to your account's <span className="font-semibold">Security Settings</span>.</li>
  <li>Enable the <span className="font-semibold">Two-Factor Authentication</span> option.</li>
  <li>Choose your method: app-based, SMS, or hardware key.</li>
  <li>Scan the QR code or enter the setup key in your chosen app.</li>
  <li>Save your backup codes in a safe, offline location for emergencies.</li>
</ol>

{/* Best Practices */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">
  Best Practices for 2FA
</h2>
<ul className="list-disc pl-6 space-y-2 text-gray-700">
  <li>Always prefer app-based or hardware 2FA over SMS when possible.</li>
  <li>Backup recovery codes securely in case you lose your phone or device.</li>
  <li>Use different authenticators for personal and work accounts for better segregation.</li>
  <li>Regularly review and update your recovery options to avoid lockouts.</li>
</ul>

{/* Real-Life Example */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">
  Real-Life Example
</h2>
<p className="text-gray-700 leading-relaxed mb-4">
  In a major 2023 breach, hackers accessed thousands of accounts using leaked passwords. 
  However, users with 2FA enabled were protected, as the attackers couldn't bypass the 
  second verification factor. This incident highlights the importance of enabling 2FA 
  across all critical services.
</p>

        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default TwoFactorAuthentication;
