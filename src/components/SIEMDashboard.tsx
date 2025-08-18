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

        // ✅ Login Events
        setLoginEvents(
          (data.loginEvents || []).map((event: any) => ({
            date: String(event.date),
            value: Number(event.count ?? 0),
          }))
        );

        // ✅ Password Changes
        setPasswordChanges(
          (data.passwordChanges || []).map((event: any) => ({
            date: String(event.date),
            value: Number(event.count ?? 0),
          }))
        );

        // ✅ Suspicious Logins (interval buckets -> { date, value })
setSuspiciousLogins(
  (data.suspiciousLogins || []).map((event: any) => {
    const start = new Date(event.intervalStart);

    const label = start.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      date: label,                // just the start time
      value: Number(event.count), // suspicious logins count
    } as EventData;
  })
);



        // ✅ Password Health
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
    <div className="bg-black min-h-screen px-6 py-6 text-white">
      <button
        onClick={() => navigate(-1)}
        className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-1 rounded mb-4 flex items-center"
      >
        <span className="mr-2">🔙</span> Back
      </button>
      <h1 className="text-2xl font-bold mb-6">System Event Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Graph title="Login Events (Top alarms)" data={loginEvents} />
        <Graph title="Password Changes (Top alarms)" data={passwordChanges} />
        <Graph title="Suspicious Login Alerts" data={suspiciousLogins} />
        <Graph title="Password Health" data={passwordHealth} type="bar" />
      </div>
    </div>
  );
};

export default SystemEventsPage;
