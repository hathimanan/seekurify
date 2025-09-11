import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";
import { ArrowLeft } from "lucide-react";
import { API_BASE_URL } from '../services/api';
interface Attack {
  title: string;
  date: string;
  description: string;
  link: string;
}

interface MediumArticle {
  title: string;
  date: string;
  description: string;
  link: string;
}


interface HeaderProps {
  token: string;
  handleLogout: () => void;
  profileImage?: string; // ✅ new prop
}

// Update tips to include links
// tips.ts
export const tips = [
  { text: "Use strong, unique passwords for each account.", link: "/tips/strong-passwords" },
  { text: "Enable two-factor authentication (2FA) wherever possible.", link: "/tips/two-factor-authentication" },
  { text: "Avoid clicking on suspicious links or attachments.", link: "/tips/avoid-suspicious-links" },
  { text: "Keep your devices and apps updated regularly.", link: "/tips/keep-devices-updated" },
  { text: "Install antivirus software and run regular scans.", link: "/tips/install-antivirus" },
  { text: "Never share your OTP or banking PIN with anyone.", link: "/tips/never-share-otp" },
  { text: "Verify website URLs before entering personal information.", link: "/tips/verify-website-urls" },
  { text: "Avoid accessing sensitive information over public Wi-Fi.", link: "/tips/avoid-public-wifi" },
  { text: "Regularly backup your data to the cloud or external drives.", link: "/tips/backup-your-data" },

    // <Route path="/tips/strong-passwords" element={<StrongPasswords />} />
    //     <Route path="/tips/two-factor-authentication" element={<TwoFactorAuthentication />} />
    //     <Route path="/tips/avoid-suspicious-links" element={<AvoidSuspiciousLinks />} />
    //     <Route path="/tips/keep-devices-updated" element={<KeepDevicesUpdated />} />
    //     <Route path="/tips/install-antivirus" element={<InstallAntivirus />} />
    //     <Route path="/tips/never-share-otp" element={<NeverShareOTP />} />
    //     <Route path="/tips/verify-website-urls" element={<VerifyWebsiteURLs />} />
    //     <Route path="/tips/avoid-public-wifi" element={<AvoidPublicWifi />} />
    //     <Route path="/tips/backup-your-data" element={<BackupYourData />} />
];


const mockRecentAttacks: Attack[] = [
  {
    title: "Workday Breach via Social Engineering",
    date: "August 2025",
    description:
      "HR platform Workday was compromised in a phishing campaign that exposed customer names, emails, and phone numbers.",
    link: "https://www.techradar.com/pro/security/hackers-breach-hr-firm-workday-is-it-the-latest-salesforce-crm-attack-victim",
  },
  {
    title: "Colt Telecom Hit by Warlock Ransomware",
    date: "August 2025",
    description:
      "UK’s Colt Technology Services suffered a ransomware attack exploiting a Microsoft SharePoint vulnerability.",
    link: "https://www.itpro.com/security/cyber-attacks/uk-telecoms-firm-takes-systems-offline-after-cyber-attack",
  },
  {
    title: "ShinyHunters Breach Impacts Google Salesforce Data",
    date: "August 2025",
    description:
      "Google was among victims of the ShinyHunters Salesforce breach, exposing sensitive small-business contact data.",
    link: "https://www.itpro.com/security/cyber-attacks/google-cyber-researchers-were-tracking-the-shinyhunters-groups-salesforce-attacks-then-realized-theyd-fallen-victim",
  },
  {
    title: "Marks & Spencer Recovers After £300m Cyberattack Loss",
    date: "August 2025",
    description:
      "M&S online services are back after an April attack that caused significant losses, showing the long-term impact of breaches.",
    link: "https://www.reuters.com/business/retail-consumer/ms-food-sales-growth-accelerates-cyber-hack-impact-fades-nielseniq-data-shows-2025-08-20",
  },
  {
    title: "AI Deepfake Scams Target Global Corporates",
    date: "August 2025",
    description:
      "Fraudsters using AI-powered deepfakes to impersonate executives have caused global companies losses exceeding $200m.",
    link: "https://www.wsj.com/articles/ai-drives-rise-in-ceo-impersonator-scams-2bd675c4",
  },
];

const mockMediumArticles: MediumArticle[] = [
  {
    title: "Security in the Era of Phishing",
    date: "August 2025",
    description:
      "Insights into phishing tactics and how to safeguard against evolving threats.",
    link: "https://medium.com/@hathimanan/security-in-the-era-of-phishing-75203e5c92c9",
  },
  {
    title: "Ransomware Attacks and Akira",
    date: "August 2025",
    description:
      "Exploring the Akira ransomware group and the broader impact of ransomware on organizations.",
    link: "https://medium.com/@hathimanan/ransomware-attacks-and-akira-ec9ef87737d8",
  },
  {
    title: "Security – The Core Aspect of Our Data",
    date: "July 2025",
    description:
      "Understanding why security is the foundation of modern digital trust.",
    link: "https://medium.com/@hathimanan/security-the-core-aspect-of-our-data-56843d7d040f",
  },
  {
    title: "Data Security Chapter 2: Fundamentals of Security",
    date: "July 2025",
    description:
      "A deep dive into the essential principles and practices of data security.",
    link: "https://medium.com/@hathimanan/data-security-chapter-2-fundamentals-of-security-5de97f0f0fb1",
  },
  {
    title: "AI, Cloud Computing & Cybersecurity – The Thin Line Between Them",
    date: "June 2025",
    description:
      "Exploring the intersection of AI, cloud, and cybersecurity in the digital era.",
    link: "https://medium.com/@hathimanan/ai-cloud-computing-cybersecurity-the-thin-line-between-them-f47ea204e875",
  },
];

export const SecurityAwareness: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);
const [profileImage, setProfileImage] = useState<string>(""); // ✅ state for header
const token = localStorage.getItem('token');
useEffect(() => {
  let isMounted = true; // prevent state updates after unmount

  // Interval for rotating attacks
  const interval = setInterval(() => {
    setCurrent((prev) => (prev + 1) % mockRecentAttacks.length);
  }, 4000);

  // Fetch profile image safely
  const fetchProfileImage = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error("Failed to fetch profile:", res.status, res.statusText);
        return;
      }

      const data = await res.json();
      if (isMounted && data?.profileImage) {
        setProfileImage(data.profileImage); // ✅ update state safely
      }
    } catch (err) {
      console.error("Error fetching profile image:", err);
    }
  };

  fetchProfileImage();

  return () => {
    clearInterval(interval);
    isMounted = false;
  };
}, []); // no token dependency needed, read it directly inside effect


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
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-pink-100 flex flex-col">
      <Header
        token={localStorage.getItem("token") || ""}
        handleLogout={handleLogout}
        profileImage={profileImage} // ✅ pass state
      />
<div className="mt-6 ml-6 mb-6">
  <button
    onClick={() => navigate(-1)}
    className="flex items-center gap-2 text-white bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 rounded-lg shadow-md hover:scale-105 transition-transform duration-200"
  >
    <ArrowLeft className="w-5 h-5" /> Back
  </button>
</div>


<main className="flex-grow px-6 py-6 max-w-6xl mx-auto">

        {/* Page Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-pink-600 drop-shadow-md">
            Stay Safe Online
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Simple steps to protect your digital life
          </p>
        </header>

        {/* Security Tips */}
<section className="mb-14 border rounded-2xl p-6 bg-white/70 shadow-md">
  <h2 className="text-2xl font-semibold mb-6 text-indigo-700">
    Steps to Stay Secure Online
  </h2>
  <ul className="grid md:grid-cols-2 gap-5">
    {tips.map((tip, index) => (
      <li
        key={index}
        className="bg-white shadow-md hover:shadow-lg p-4 rounded-xl border-l-4 border-indigo-500 hover:border-pink-500 
                   transition-all duration-300 cursor-pointer hover:bg-gray-100"
        onClick={() => window.open(tip.link, "_blank")}
      >
        <span className="font-medium text-gray-800">
          ✅ {tip.text}
        </span>
      </li>
    ))}
  </ul>
</section>



        {/* Account Breach Checker */}
        <section className="mb-14 border rounded-2xl p-6 bg-white/80 shadow-md text-center">
          <h2 className="text-2xl font-semibold mb-4 text-purple-700">
            Check if Your Account Has Been Breached
          </h2>
          <p className="mb-4 text-gray-700">
            Visit the official Have I Been Pwned website to see if your email or
            account has been involved in a data breach.
          </p>
          <button
            onClick={() =>
              window.open("https://www.haveibeenpwned.com/", "_blank")
            }
            className="bg-purple-500 text-white px-6 py-3 rounded hover:bg-purple-600 transition-colors"
          >
            Go to Have I Been Pwned
          </button>
        </section>

        {/* Recent Cyber Attacks */}
        <section className="mb-14 border rounded-2xl p-6 bg-gradient-to-r from-red-100 to-rose-200 shadow-md">
          <h2 className="text-2xl font-semibold mb-6 text-rose-700">
            Recent Cyber Attacks
          </h2>
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/80 p-6 rounded-xl shadow-md"
          >
            <h3 className="text-lg font-bold text-red-900 mb-1">
              {mockRecentAttacks[current].title}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {mockRecentAttacks[current].date}
            </p>
            <p className="mb-3">{mockRecentAttacks[current].description}</p>
            <a
              href={mockRecentAttacks[current].link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-700 font-medium hover:underline"
            >
              🔗 Read more →
            </a>
          </motion.div>
        </section>

        {/* Medium Articles */}
        <section className="border rounded-2xl p-6 bg-white/70 shadow-md">
          <h2 className="text-2xl font-semibold mb-6 text-green-700">
            Latest Medium Articles
          </h2>
          <div className="overflow-hidden">
            <motion.div
              className="flex gap-6"
              animate={{ x: ["0%", "-100%"] }}
              transition={{
                ease: "linear",
                duration: 22,
                repeat: Infinity,
              }}
            >
              {mockMediumArticles.concat(mockMediumArticles).map(
                (article, index) => (
                  <div
                    key={index}
                    className="min-w-[320px] bg-white rounded-xl shadow-md hover:shadow-xl p-6 transition-all duration-300"
                  >
                    <h3 className="font-bold text-lg text-green-800">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-500">{article.date}</p>
                    <p className="mt-2 text-gray-700">{article.description}</p>
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block mt-3 text-indigo-600 hover:underline font-medium"
                    >
                      Read on Medium →
                    </a>
                  </div>
                )
              )}
            </motion.div>
          </div>
          <p className="text-gray-500 text-sm mt-3 text-center">
            📰 Articles auto-scroll continuously
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};
