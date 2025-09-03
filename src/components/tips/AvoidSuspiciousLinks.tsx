import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";

const AvoidSuspiciousLinks: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      {/* Header */}
      <Header
        token={localStorage.getItem("token") || ""}
        handleLogout={() => {
          localStorage.removeItem("token");
          navigate("/login");
        }}
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
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 mb-4 transition"
          >
            <ArrowLeft size={18} /> Back
          </button> */}

          {/* Title */}
<h1 className="text-3xl md:text-4xl font-extrabold text-red-600 mb-6 leading-tight">
  Avoid Clicking on Suspicious Links or Attachments
</h1>

{/* Description */}
<p className="text-gray-700 text-lg leading-relaxed mb-6">
  Suspicious links and attachments are one of the most common gateways for 
  <span className="font-semibold"> phishing</span> scams, 
  <span className="font-semibold"> malware infections</span>, and 
  <span className="font-semibold"> ransomware attacks</span>. 
  Cybercriminals often disguise these malicious links to look legitimate, tricking users into clicking and unknowingly 
  exposing their systems to threats. One careless click can result in 
  <span className="font-semibold"> data breaches</span>, 
  <span className="font-semibold"> identity theft</span>, or even 
  <span className="font-semibold"> financial losses</span>.
</p>

{/* Subheading */}
<h2 className="text-2xl font-semibold text-gray-800 mb-4">
  How to Stay Safe
</h2>

{/* List of Tips */}
<ul className="list-disc pl-6 space-y-3 text-gray-700">
  <li className="hover:text-red-600 transition">
    <strong>Verify the sender:</strong> Always double-check the sender’s email address or phone number. 
    Cyber attackers often use addresses that look similar to trusted sources.
  </li>
  <li className="hover:text-red-600 transition">
    <strong>Hover before you click:</strong> Place your cursor over links to preview the actual URL. 
    If it looks suspicious or doesn’t match the context of the message, do not click it.
  </li>
  <li className="hover:text-red-600 transition">
    <strong>Never download from untrusted sources:</strong> Attachments from unknown senders 
    or unexpected emails can contain viruses or spyware. When in doubt, delete the message.
  </li>
  <li className="hover:text-red-600 transition">
    <strong>Use security tools:</strong> Enable spam filters, email security tools, and antivirus programs 
    to detect and block malicious links and attachments before they reach you.
  </li>
  <li className="hover:text-red-600 transition">
    <strong>Look for red flags:</strong> Poor grammar, urgent language, or unexpected requests for personal 
    information often indicate a phishing attempt.
  </li>
  <li className="hover:text-red-600 transition">
    <strong>Report suspicious content:</strong> If you receive a suspicious email or message, 
    report it to your IT or security team immediately to prevent others from falling victim.
  </li>
</ul>

{/* Additional Section */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
  Real-Life Example
</h2>
<p className="text-gray-700 text-lg leading-relaxed">
  In 2023, a major company suffered a data breach after an employee unknowingly clicked 
  on a fake invoice link. This single mistake exposed sensitive customer data and cost 
  the company millions in recovery and reputation damage. Always remember: 
  <span className="font-semibold"> one click can compromise your entire system.</span>
</p>
</motion.div>
</main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AvoidSuspiciousLinks;
