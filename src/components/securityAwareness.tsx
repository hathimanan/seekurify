import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Attack {
  title: string;
  date: string;
  description: string;
  link: string;
}

const tips: string[] = [
  "Use strong, unique passwords for each account.",
  "Enable two-factor authentication (2FA) wherever possible.",
  "Avoid clicking on suspicious links or attachments.",
  "Keep your devices and apps updated regularly.",
  "Install antivirus software and run regular scans.",
  "Never share your OTP or banking PIN with anyone.",
  "Verify website URLs before entering personal information.",
  "Avoid accessing sensitive information over public Wi-Fi.",
  "Regularly backup your data to the cloud or external drives."
];

const mockRecentAttacks: Attack[] = [
  {
    title: "Ransomware Hits XYZ Hospital",
    date: "July 21, 2025",
    description: "Patient data leaked after attackers gained access.",
    link: "https://example.com/ransomware-hospital"
  },
  {
    title: "Scam Alert: Fake IRCTC Emails",
    date: "July 18, 2025",
    description: "Users received phishing emails pretending to be from IRCTC.",
    link: "https://example.com/irctc-scam"
  },
  {
    title: "Bank OTP Fraud Cases Rise",
    date: "July 15, 2025",
    description: "Fraudsters trick users into sharing OTPs via fake calls.",
    link: "https://example.com/otp-fraud"
  }
];

export const SecurityAwareness: React.FC = () => {
  const [current, setCurrent] = useState(0);
    const navigate = useNavigate();
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % mockRecentAttacks.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
        <div className="p-4">
      <button
        onClick={() => navigate(-1)}
        className="bg-red-500 text-white px-4 py-2 rounded mb-4"
      >
        ⬅️ Back
      </button>

    <div className="min-h-screen bg-gray-100 p-6">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-bold text-blue-800">Stay Safe Online</h1>
        <p className="text-gray-600">Simple steps to protect your digital life</p>
      </header>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700">Steps to Stay Secure Online</h2>
        <ul className="grid md:grid-cols-2 gap-4">
          {tips.map((tip, index) => (
            <li key={index} className="bg-white shadow-md p-4 rounded-lg border-l-4 border-blue-500">
              ✅ {tip}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-red-700">Recent Cyber Attacks</h2>
        <div className="bg-red-50 p-6 rounded shadow-md max-w-3xl mx-auto">
          <h3 className="text-lg font-bold text-red-800 mb-1">{mockRecentAttacks[current].title}</h3>
          <p className="text-sm text-gray-500 mb-2">{mockRecentAttacks[current].date}</p>
          <p className="mb-2">{mockRecentAttacks[current].description}</p>
          <a
            href={mockRecentAttacks[current].link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Read more →
          </a>
        </div>
      </section>
    </div>
          </div>
  );
};
