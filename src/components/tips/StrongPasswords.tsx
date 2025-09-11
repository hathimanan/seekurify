import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";

import { API_BASE_URL } from '../../services/api';

const StrongPasswords: React.FC = () => {
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header
        token={localStorage.getItem("token") || ""}
        handleLogout={handleLogout}
      />

      <main className="flex-1 p-6 md:p-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-md p-6 md:p-8"
        >
          {/* Back Button */}
          {/* <button
            onClick={() => navigate(-1)}
            className="flex items-center text-indigo-600 mb-4 hover:underline"
          >
            <ArrowLeft className="mr-2 h-5 w-5" /> Back
          </button> */}

          {/* Title */}
<h1 className="text-3xl font-bold text-indigo-700 mb-4">
  Use Strong, Unique Passwords for Each Account
</h1>

{/* Description */}
<p className="text-gray-700 mb-3 leading-relaxed">
  Your password is your first line of defense against hackers and unauthorized access. 
  Weak or reused passwords make it easier for cybercriminals to launch 
  <span className="font-semibold"> brute-force attacks</span>, 
  <span className="font-semibold"> credential stuffing</span>, or 
  <span className="font-semibold"> phishing campaigns</span>. 
  By using <span className="font-semibold">strong and unique passwords</span> for 
  every account, you reduce the risk of multiple accounts being compromised 
  if one of your credentials gets exposed in a data breach.
</p>

{/* Importance Section */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">
  Why Strong and Unique Passwords Matter
</h2>
<p className="text-gray-700 leading-relaxed mb-4">
  Many cyberattacks exploit weak or reused passwords. If you use the same password 
  for your email, social media, and bank account, a single breach can give hackers 
  access to your entire digital life. A strong password ensures:
</p>
<ul className="list-disc pl-6 space-y-2 text-gray-700">
  <li>Better resistance against <span className="font-semibold">dictionary</span> and <span className="font-semibold">brute-force</span> attacks.</li>
  <li>Increased security even if one platform experiences a data breach.</li>
  <li>Protection for sensitive accounts like email, banking, and cloud storage.</li>
</ul>

{/* Pro Tips */}
<h2 className="text-xl font-semibold mt-6 mb-3 text-indigo-600">
  Pro Tips:
</h2>
<ul className="list-disc pl-6 space-y-2 text-gray-700">
  <li>Use at least <span className="font-semibold">12–16 characters</span> in your password for stronger security.</li>
  <li>Include a mix of <span className="font-semibold">uppercase, lowercase, numbers, and special symbols</span> to make it harder to crack.</li>
  <li>Avoid common words, birth dates, pet names, or predictable patterns like <span className="font-semibold">123456</span> or <span className="font-semibold">password123</span>.</li>
  <li>Use a <span className="font-semibold">password manager</span> to generate and store complex passwords securely.</li>
  <li>Change passwords <span className="font-semibold">periodically</span> for critical accounts, especially if you suspect a breach.</li>
  <li>Enable <span className="font-semibold">two-factor authentication (2FA)</span> for an extra layer of protection.</li>
</ul>

{/* Additional Guidance */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">
  Best Practices for Password Management
</h2>
<ul className="list-disc pl-6 space-y-2 text-gray-700">
  <li>Do not share passwords via email, messages, or unsecured notes.</li>
  <li>Use unique passwords for work, personal, and financial accounts to prevent a chain of compromises.</li>
  <li>Regularly audit your accounts with a password manager to update weak or duplicate passwords.</li>
  <li>Enable biometric authentication (fingerprint or face ID) where available for convenience and extra security.</li>
</ul>

{/* Real-Life Example */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-3">
  Real-Life Example
</h2>
<p className="text-gray-700 leading-relaxed mb-4">
  In 2022, a major breach exposed millions of reused passwords from a compromised shopping platform. 
  Hackers leveraged these credentials to break into unrelated accounts like email and online banking, 
  causing massive financial losses. Users with unique, strong passwords avoided becoming victims 
  of the <span className="font-semibold">credential-stuffing attacks</span>.
</p>

{/* Extra Tip */}
<h2 className="text-xl font-semibold mt-6 mb-3 text-indigo-600">
  Quick Memory Trick:
</h2>
<p className="text-gray-700 leading-relaxed">
  Create a passphrase instead of a password — a random but memorable sentence, 
  like <span className="italic">"Coffee@6AM!Helps$Me#Code"</span>. 
  It’s long, complex, and much easier to remember while staying secure.
</p>

        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default StrongPasswords;
