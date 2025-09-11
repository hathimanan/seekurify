import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";

import { API_BASE_URL } from '../../services/api';

const VerifyWebsiteURLs: React.FC = () => {
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-yellow-50 via-white to-yellow-100">
      {/* Header */}
      <Header
        token={localStorage.getItem("token") || ""}
        handleLogout={handleLogout}
      />

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 md:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="bg-white p-6 md:p-10 rounded-2xl shadow-lg"
        >
          {/* Back button */}
          {/* <button
            onClick={() => navigate(-1)}
            className="flex items-center text-yellow-700 hover:text-yellow-800 mb-6 transition-colors duration-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button> */}

          {/* Title */}
<h1 className="text-3xl font-bold text-yellow-700 mb-4">
  Verify Website URLs Before Entering Personal Information
</h1>

{/* Description */}
<p className="text-gray-700 mb-4 leading-relaxed">
  Cybercriminals frequently create <span className="font-semibold">phishing websites</span> 
  that mimic legitimate ones to steal sensitive data like <span className="font-semibold">
  login credentials</span>, <span className="font-semibold">bank details</span>, or 
  <span className="font-semibold">government IDs</span>. These websites often look convincing, 
  but small clues can reveal they are fake. Always take a moment to double-check the URL before 
  entering any personal information to avoid falling victim to fraud or identity theft.
</p>

{/* Why Verification Matters */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">
  Why URL Verification is Important
</h2>
<p className="text-gray-700 mb-4 leading-relaxed">
  Fake or compromised websites are a primary tool in phishing campaigns. Once you enter your 
  details, hackers can <span className="font-semibold">steal your identity, empty your bank 
  accounts, or take over your social media</span>. In 2024 alone, phishing attacks rose by 
  over <span className="font-semibold text-yellow-700">60%</span>, making it crucial to verify 
  links and URLs before sharing sensitive information.
</p>

{/* Steps */}
<h2 className="text-xl font-semibold text-yellow-800 mt-6 mb-3">
  Verification Steps:
</h2>
<ul className="list-disc pl-6 space-y-2 text-gray-700">
  <li>
    Look for <span className="font-semibold text-yellow-700">HTTPS</span> and the secure 
    <span className="font-semibold"> lock icon</span> in the address bar. Avoid sites that 
    only show <strong>HTTP</strong>.
  </li>
  <li>
    Carefully check for <span className="font-semibold">typos or misspellings</span> in the 
    domain name, such as <strong>go0gle.com</strong> instead of <strong>google.com</strong>.
  </li>
  <li>
    Manually type the website URL into your browser instead of clicking suspicious 
    <span className="font-semibold"> email or message links</span>.
  </li>
  <li>
    Use browser security plugins like{" "}
    <span className="font-semibold text-yellow-700">HTTPS Everywhere</span> or 
    password managers that highlight suspicious URLs.
  </li>
  <li>
    Cross-check the URL with official sources, such as your bank's official mobile app 
    or customer support, if you're unsure.
  </li>
</ul>

{/* Additional Tips */}
<h2 className="text-xl font-semibold text-yellow-800 mt-6 mb-3">
  Additional Safety Tips:
</h2>
<ul className="list-disc pl-6 space-y-2 text-gray-700">
  <li>
    Bookmark frequently visited websites to avoid typing errors or visiting malicious copies.
  </li>
  <li>
    Check the website's SSL certificate details by clicking the lock icon to see 
    if it’s issued to the correct organization.
  </li>
  <li>
    Be cautious with shortened URLs from services like bit.ly or tinyurl; expand them 
    first using an online preview tool.
  </li>
  <li>
    Avoid entering sensitive data when connected to <span className="font-semibold">
    public Wi-Fi</span> unless using a secure VPN.
  </li>
  <li>
    Stay updated about <span className="font-semibold">new phishing techniques</span> 
    through cybersecurity alerts or trusted blogs.
  </li>
</ul>

{/* Real-Life Example */}
<h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
  Real-Life Example
</h2>
<p className="text-gray-700 mb-4 leading-relaxed">
  In a well-known scam, attackers created a fake banking website with a URL like 
  <strong> bankofamerca.com</strong> (missing an “i”). Thousands of users entered 
  their credentials without noticing the typo, resulting in widespread account 
  takeovers. Such incidents highlight the importance of paying close attention to 
  URLs every time you log in or perform a transaction.
</p>

{/* Final Note */}
<p className="text-gray-700 mt-4 leading-relaxed">
  Taking a few seconds to verify a website URL can save you from 
  <span className="font-semibold text-yellow-700"> financial loss, identity theft, 
  and privacy breaches</span>. Make URL checking a regular habit whenever you access 
  sensitive accounts or share personal details online.
</p>

        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default VerifyWebsiteURLs;
