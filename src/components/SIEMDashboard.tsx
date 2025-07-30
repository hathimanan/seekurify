import React, { useEffect, useState } from 'react';
import Graph from './Graph'; // Adjust path as needed
import { useNavigate } from 'react-router-dom';

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
      const res = await fetch('/api/siem-dashboard', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();

      // ✅ Transform data to match the expected structure for the graph
setLoginEvents((data.loginEvents || []).map((event: any) => ({
  date: event.date,
  value: event.count,
})));

setPasswordChanges((data.passwordChanges || []).map((event: any) => ({
  date: event.date,
  value: event.count,
})));

setSuspiciousLogins((data.suspiciousLogins || []).map((event: any) => ({
  date: event.date,
  value: event.count,
})));

setPasswordHealth((data.passwordHealth || []).map((entry: any) => ({
  date: entry.category,
  value: entry.count,
})));
    } catch (err) {
      console.error('Failed to load event data', err);
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
