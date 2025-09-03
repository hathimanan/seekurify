import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../ui/Header";
import Footer from "../ui/Footer";
import { ArrowLeft } from "lucide-react";

const InstallAntivirus: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
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
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 mb-4 transition"
          >
            <ArrowLeft size={18} /> Back
          </button> */}

          {/* Title */}
<h1 className="text-3xl md:text-4xl font-extrabold text-green-600 mb-6 leading-tight">
  Install Antivirus Software and Run Regular Scans
</h1>

{/* Description */}
<p className="text-gray-700 text-lg leading-relaxed mb-6">
  Antivirus software is your first line of defense against 
  <span className="font-semibold"> malicious software</span>, including viruses, 
  trojans, ransomware, spyware, and other forms of 
  <span className="font-semibold"> malware</span>. While 
  <span className="font-semibold"> real-time protection</span> actively monitors your system, 
  regular full-system scans help detect hidden threats that may have slipped through 
  unnoticed. Keeping your antivirus updated and scanning routinely ensures 
  <span className="font-semibold"> continuous protection</span> against evolving cyber threats.
</p>

{/* Subheading */}
<h2 className="text-2xl font-semibold text-gray-800 mb-4">
  How to Implement
</h2>

{/* Tips List */}
<ul className="list-disc pl-6 space-y-3 text-gray-700">
  <li className="hover:text-green-600 transition">
    <strong>Choose a reputable antivirus:</strong> Opt for 
    <span className="font-semibold"> well-known and trusted antivirus providers</span> 
    such as Bitdefender, Norton, Kaspersky, McAfee, or Windows Defender 
    for reliable protection and regular updates.
  </li>
  <li className="hover:text-green-600 transition">
    <strong>Schedule regular scans:</strong> Set up 
    <span className="font-semibold"> weekly or bi-weekly full system scans</span> 
    to catch dormant or hidden malware that real-time scanning may miss.
  </li>
  <li className="hover:text-green-600 transition">
    <strong>Update virus definitions frequently:</strong> Antivirus software is only as good 
    as its latest update. Ensure your program updates its 
    <span className="font-semibold"> virus definitions and detection algorithms</span> 
    daily or automatically to stay ahead of new threats.
  </li>
  <li className="hover:text-green-600 transition">
    <strong>Enable real-time scanning:</strong> Keep 
    <span className="font-semibold"> real-time monitoring enabled</span> 
    to instantly detect, block, and quarantine malicious files before they cause harm.
  </li>
  <li className="hover:text-green-600 transition">
    <strong>Use multi-layered protection:</strong> Pair your antivirus with a 
    <span className="font-semibold"> firewall</span> and anti-malware tools 
    like Malwarebytes for more comprehensive security coverage.
  </li>
  <li className="hover:text-green-600 transition">
    <strong>Review quarantine items regularly:</strong> Check your antivirus quarantine folder 
    to ensure critical files are not accidentally deleted and restore safe files if necessary.
  </li>
</ul>

{/* Additional Section */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
  Best Practices for Maximum Protection
</h2>
<p className="text-gray-700 text-lg leading-relaxed mb-6">
  Antivirus software is most effective when combined with safe browsing habits 
  and other security measures. Avoid downloading files from unverified websites, 
  keep your operating system and applications updated, and avoid clicking suspicious 
  links or attachments. Using antivirus as part of a layered security approach 
  significantly reduces your risk of infection.
</p>

{/* Real-Life Example */}
<h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">
  Real-Life Example
</h2>
<p className="text-gray-700 text-lg leading-relaxed">
  In 2023, a mid-sized company avoided a major ransomware incident because their antivirus 
  detected and quarantined a malicious email attachment during a scheduled scan. 
  Without this proactive measure, the company could have faced severe downtime 
  and financial loss.
</p>

        </motion.div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default InstallAntivirus;
