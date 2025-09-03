import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";

const NeverShareOTP: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
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
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 mb-4 transition"
          >
            <ArrowLeft size={18} /> Back
          </button> */}

          {/* Title */}
<h1 className="text-3xl md:text-4xl font-extrabold text-purple-600 mb-6 leading-tight">
  Never Share Your OTP or Banking PIN
</h1>

{/* Description */}
<p className="text-gray-700 text-lg leading-relaxed mb-6">
  OTPs (<span className="font-semibold">One-Time Passwords</span>) and 
  PINs (<span className="font-semibold">Personal Identification Numbers</span>) 
  are confidential security codes used to verify your identity and secure 
  your financial transactions. Sharing them with anyone — even someone 
  claiming to be from your bank or a government agency — puts your 
  <span className="font-semibold"> accounts</span>, 
  <span className="font-semibold"> savings</span>, and 
  <span className="font-semibold"> personal information</span> at serious risk. 
  Cybercriminals frequently use phishing calls, fake messages, or deceptive apps 
  to trick people into sharing these codes.
</p>

{/* Subheading */}
<h2 className="text-2xl font-semibold text-gray-800 mb-4">
  Safety Guidelines
</h2>

{/* Tips List */}
<ul className="list-disc pl-6 space-y-3 text-gray-700">
  <li className="hover:text-purple-600 transition">
    <strong>Never share your OTPs or PINs:</strong> Avoid sharing these codes over 
    phone calls, text messages, emails, or chat apps — no legitimate service provider 
    will ever ask for them.
  </li>
  <li className="hover:text-purple-600 transition">
    <strong>Know your bank’s policy:</strong> Remember that 
    <span className="font-semibold"> banks, UPI apps, or government organizations</span> 
    never ask for sensitive information like OTPs or PINs for verification.
  </li>
  <li className="hover:text-purple-600 transition">
    <strong>Stay alert for suspicious requests:</strong> If you receive an unexpected 
    message or call requesting these details, hang up or ignore the message and 
    immediately <span className="font-semibold">report it to your bank</span>.
  </li>
  <li className="hover:text-purple-600 transition">
    <strong>Use strong and unique PINs:</strong> Avoid using predictable PINs 
    like your birth date, phone number, or “1234.” Use different PINs for 
    different banking or wallet accounts.
  </li>
  <li className="hover:text-purple-600 transition">
    <strong>Enable transaction alerts:</strong> Turn on SMS or email alerts 
    to monitor every transaction in real time, so you can act quickly 
    if unauthorized access occurs.
  </li>
  <li className="hover:text-purple-600 transition">
    <strong>Change PINs regularly:</strong> Update your banking PINs every 
    few months to minimize the risk of compromise.
  </li>
</ul>

{/* Additional Section */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
  Why Protecting OTPs and PINs Is Critical
</h2>
<p className="text-gray-700 text-lg leading-relaxed mb-6">
  OTPs and PINs are the final barrier preventing unauthorized access to 
  your funds and personal data. Sharing them, even by mistake, can lead 
  to <span className="font-semibold">fraudulent transactions</span>, 
  <span className="font-semibold">identity theft</span>, and 
  <span className="font-semibold">financial loss</span>. 
  Cybercriminals exploit urgency or fear to pressure victims — never let 
  emotions override security awareness.
</p>

{/* Real-Life Example */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
  Real-Life Example
</h2>
<p className="text-gray-700 text-lg leading-relaxed">
  In 2023, a scammer posing as a bank representative convinced a user to 
  share their OTP, claiming it was required to "secure their account." 
  Within minutes, the attacker drained the user’s account balance. 
  This incident highlights the importance of 
  <span className="font-semibold"> never sharing confidential codes</span>, 
  no matter how urgent or convincing the request seems.
</p>

{/* Extra Reminder */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
  Quick Reminders
</h2>
<ul className="list-disc pl-6 space-y-3 text-gray-700">
  <li>Verify official numbers and emails before responding.</li>
  <li>Use secure apps for transactions and avoid public Wi-Fi for online banking.</li>
  <li>Enable two-factor authentication (2FA) wherever possible for added protection.</li>
</ul>

        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default NeverShareOTP;
