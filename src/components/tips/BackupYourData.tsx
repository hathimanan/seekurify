import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";
import { API_BASE_URL } from '../../services/api';



const BackupYourData: React.FC = () => {
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100">
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
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 mb-4 transition"
          >
            <ArrowLeft size={18} /> Back
          </button> */}

          {/* Title */}
<h1 className="text-3xl md:text-4xl font-extrabold text-indigo-600 mb-6 leading-tight">
  Regularly Backup Your Data
</h1>

{/* Description */}
<p className="text-gray-700 text-lg leading-relaxed mb-6">
  Data loss can strike unexpectedly due to 
  <span className="font-semibold"> accidental deletion</span>, 
  <span className="font-semibold"> hardware or software failures</span>, 
  <span className="font-semibold"> ransomware attacks</span>, or 
  <span className="font-semibold"> cyber intrusions</span>. 
  Whether it’s personal memories, business documents, or critical databases, 
  losing your data can be devastating. Performing regular backups ensures your important 
  files remain <span className="font-semibold">safe, recoverable, and accessible</span> 
  when disaster strikes.
</p>

{/* Subheading */}
<h2 className="text-2xl font-semibold text-gray-800 mb-4">
  Backup Strategies
</h2>

{/* List of Tips */}
<ul className="list-disc pl-6 space-y-3 text-gray-700">
  <li className="hover:text-indigo-600 transition">
    <strong>Follow the 3-2-1 backup rule:</strong> Always maintain 
    <span className="font-semibold"> 3 copies</span> of your data, stored on 
    <span className="font-semibold"> 2 different mediums</span> (like an external hard drive and the cloud), 
    with <span className="font-semibold">1 copy kept offsite</span> for maximum security.
  </li>
  <li className="hover:text-indigo-600 transition">
    <strong>Leverage secure cloud backups:</strong> Use trusted 
    <span className="font-semibold"> cloud storage providers</span> that offer end-to-end encryption, 
    version history, and two-factor authentication for additional safety.
  </li>
  <li className="hover:text-indigo-600 transition">
    <strong>Test your backups regularly:</strong> Simply creating backups isn’t enough — 
    periodically check and restore files to ensure your backups are functional and reliable.
  </li>
  <li className="hover:text-indigo-600 transition">
    <strong>Schedule automated backups:</strong> Automating your backup process 
    prevents human error and ensures you never forget to protect critical data.
  </li>
  <li className="hover:text-indigo-600 transition">
    <strong>Encrypt sensitive data:</strong> Before backing up confidential files, 
    encrypt them to protect against unauthorized access in case the backup media is compromised.
  </li>
  <li className="hover:text-indigo-600 transition">
    <strong>Keep multiple backup types:</strong> Combine local storage (e.g., external drives or NAS) 
    with cloud backups to balance accessibility, security, and recovery speed.
  </li>
</ul>

{/* Additional Section */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
  Why Backups Matter
</h2>
<p className="text-gray-700 text-lg leading-relaxed mb-6">
  Imagine your computer is hit by ransomware, and all your files are locked. 
  Without a proper backup, you risk losing everything or paying a hefty ransom. 
  In another scenario, a simple hard drive failure can wipe out years of memories or business records. 
  By regularly backing up your data, you build a safety net that protects you from both human errors 
  and malicious threats.
</p>

{/* Real-Life Example */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
  Real-Life Example
</h2>
<p className="text-gray-700 text-lg leading-relaxed">
  In 2022, a small business lost critical customer data due to a server crash 
  and discovered they had not backed up their system in over six months. 
  The recovery process took weeks and resulted in significant financial losses. 
  This could have been avoided with a consistent and automated backup plan.
</p>

        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default BackupYourData;

