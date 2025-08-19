import React, { useEffect, useState } from "react";
import Graph from "./Graph"; // Adjust path as needed
import { useNavigate } from "react-router-dom";

interface EventData {
  date: string;
  value: number;
}

const SystemEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const [loginEvents, setLoginEvents] = useState<EventData[]>([]);
  const [passwordChanges, setPasswordChanges] = useState<EventData[]>([]);
  const [suspiciousLogins, setSuspiciousLogins] = useState<EventData[]>([]);
  const [passwordHealth, setPasswordHealth] = useState<EventData[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/siem-dashboard", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await res.json();

        setLoginEvents(
          (data.loginEvents || []).map((event: any) => ({
            date: String(event.date),
            value: Number(event.count ?? 0),
          }))
        );

        setPasswordChanges(
          (data.passwordChanges || []).map((event: any) => ({
            date: String(event.date),
            value: Number(event.count ?? 0),
          }))
        );

        setSuspiciousLogins(
          (data.suspiciousLogins || []).map((event: any) => {
            const start = new Date(event.intervalStart);
            const label = start.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return { date: label, value: Number(event.count) } as EventData;
          })
        );

        setPasswordHealth(
          (data.passwordHealth || []).map((entry: any) => ({
            date: String(entry.category),
            value: Number(entry.count ?? 0),
          }))
        );
      } catch (err) {
        console.error("Failed to load event data", err);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-gray-800 min-h-screen px-6 py-6 text-white">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 
        text-white font-semibold px-5 py-2 rounded-xl mb-6 flex items-center shadow-lg transform transition-all duration-300 hover:scale-105"
      >
        <span className="mr-2">🔙</span> Back
      </button>

      {/* Title */}
      <h1 className="text-3xl font-extrabold mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-orange-600 drop-shadow-md">
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
    </div>
  );
};

export default SystemEventsPage;
