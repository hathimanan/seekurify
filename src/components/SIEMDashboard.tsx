import React, { useEffect, useState } from "react";
import Graph from "./Graph"; // Adjust path as needed
import { useNavigate } from "react-router-dom";

import Header from "../components/ui/Header";
import Footer from "../components/ui/Footer";
import { ArrowLeft } from "lucide-react";
import { API_BASE_URL } from '../services/api';

interface EventData {
  date: string;
  value: number;
}

interface HeaderProps {
  token: string;
  handleLogout: () => void;
  profileImage?: string; // ✅ new prop
}

const SystemEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loginEvents, setLoginEvents] = useState<EventData[]>([]);
  const [passwordChanges, setPasswordChanges] = useState<EventData[]>([]);
  const [suspiciousLogins, setSuspiciousLogins] = useState<EventData[]>([]);
  const [passwordHealth, setPasswordHealth] = useState<EventData[]>([]);
    const [prevRoute, setPrevRoute] = useState("/homePageAfterLogin"); // default route
const [profileImage, setProfileImage] = useState<string>(""); // ✅ state for header
  useEffect(() => {
  let isMounted = true;

  const fetchEventsAndProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Fetch SIEM events
      const resEvents = await fetch(`${API_BASE_URL}/siem-dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataEvents = await resEvents.json();

      if (isMounted) {
        setLoginEvents(
          (dataEvents.loginEvents || []).map((event: any) => ({
            date: String(event.date),
            value: Number(event.count ?? 0),
          }))
        );

        setPasswordChanges(
          (dataEvents.passwordChanges || []).map((event: any) => ({
            date: String(event.date),
            value: Number(event.count ?? 0),
          }))
        );

        setSuspiciousLogins(
          (dataEvents.suspiciousLogins || []).map((event: any) => {
            const start = new Date(event.intervalStart);
            const label = start.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return { date: label, value: Number(event.count) } as EventData;
          })
        );

        setPasswordHealth(
          (dataEvents.passwordHealth || []).map((entry: any) => ({
            date: String(entry.category),
            value: Number(entry.count ?? 0),
          }))
        );
      }

      // Fetch profile image
      const resProfile = await fetch(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resProfile.ok) throw new Error("Failed to fetch profile");
      const dataProfile = await resProfile.json();

      if (isMounted && dataProfile?.profileImage) {
        setProfileImage(dataProfile.profileImage); // ✅ update state safely
      }
    } catch (err) {
      console.error("Failed to load SIEM dashboard or profile", err);
    }
  };

  fetchEventsAndProfile();

  return () => {
    isMounted = false;
  };
}, []);



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
  <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 min-h-screen flex flex-col text-white">

    {/* Header */}
    <Header
      token={localStorage.getItem("token") || ""}
      handleLogout={handleLogout}
      profileImage={profileImage} // ✅ pass state
    />

    {/* Main Content */}
    <main className="flex-grow px-6 py-4">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white bg-gradient-to-r from-red-500 to-red-600 px-4 py-2 rounded-lg shadow-md hover:scale-105 transition-transform duration-200"
        >
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-extrabold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-orange-600 drop-shadow-md">
        ⚡ System Event Management Dashboard ⚡
      </h1>

      {/* Graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-tr from-gray-800 to-gray-900 p-5 rounded-2xl shadow-xl hover:shadow-cyan-500/30 transition-shadow duration-300">
          <Graph title="📊 Login Events (Top alarms)" data={loginEvents} />
        </div>
        <div className="bg-gradient-to-tr from-gray-800 to-gray-900 p-5 rounded-2xl shadow-xl hover:shadow-pink-500/30 transition-shadow duration-300">
          <Graph title="🔑 Password Changes (Top alarms)" data={passwordChanges} />
        </div>
        <div className="bg-gradient-to-tr from-gray-800 to-gray-900 p-5 rounded-2xl shadow-xl hover:shadow-yellow-500/30 transition-shadow duration-300">
          <Graph title="⚠️ Suspicious Login Alerts" data={suspiciousLogins} />
        </div>
        <div className="bg-gradient-to-tr from-gray-800 to-gray-900 p-5 rounded-2xl shadow-xl hover:shadow-green-500/30 transition-shadow duration-300">
          <Graph title="🛡️ Password Health" data={passwordHealth} type="bar" />
        </div>
      </div>
    </main>

    {/* Footer */}
    <Footer />
  </div>
);
}
      export default SystemEventsPage;
