import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Props interface for Graph component
// interface GraphProps {
//   title: string;
//   data: number[] ;
// }

interface GraphProps {
  title: string;
  data: number[] | PasswordHealthEntry[];
}

// ✅ React.FC applied here
const Graph: React.FC<GraphProps> = ({ title, data }) => {
    const isPasswordHealth = title === "Password Health";
    const maxVal = isPasswordHealth
    ? Math.max(...(data as PasswordHealthEntry[]).map(d => d.count), 1)
    : Math.max(...(data as number[]), 1); // prevent divide by 0

 return (
    <div className="bg-[#5b5252] w-80 h-56 m-4 rounded-md p-4 flex flex-col items-center justify-start shadow-lg">
      <h2 className="text-white text-lg font-bold text-center mb-1">{title}</h2>

      {/* Only show total for selected graphs */}
      {(title === "Login Events (Top alarms)" || title === "Password Changes (Top alarms)" || title === "Suspicious Login Alerts") && (
        <p className="text-xl font-bold text-gray-300 mb-2">
          Total: {(data as number[]).reduce((a, b) => a + b, 0)}
        </p>
      )}

      <div className="flex justify-around items-end w-full h-full">
        {data.length === 0 ? (
          <p className="text-white text-sm text-center w-full">No data found</p>
        ) : isPasswordHealth ? (
          // Render password health bars
          (data as PasswordHealthEntry[]).map((entry, i) => (
            <div key={i} className="flex flex-col items-center mx-1">
              <div
                className="w-3 rounded-sm"
                style={{
                  height: `${(entry.count / maxVal) * 80}%`,
                  backgroundColor:
                    entry.category === 'Poor' ? '#ef4444' :
                    entry.category === 'Medium' ? '#f59e0b' :
                    entry.category === 'Good' ? '#3b82f6' :
                    '#10b981',
                }}
                title={`${entry.category}: ${entry.count}`}
              />
              <span className="text-white text-xs mt-1">{entry.category}</span>
            </div>
          ))
        ) : (
          // Render generic bars
          (data as number[]).map((val, i) => (
            <div
              key={i}
              className="bg-red-500 w-1.5 mx-1 rounded-sm"
              style={{ height: `${(val / maxVal) * 80}%` }}
              title={`Value: ${val}`}
            />
          ))
        )}
      </div>
    </div>
  );
};

interface PasswordHealthEntry {
  category: 'Poor' | 'Medium' | 'Good' | 'Strong';
  count: number;}
// Type for dashboard stats
interface DashboardStats {
  loginEvents: number[];
  passwordChanges: number[];
  suspiciousLogins: number[];
  passwordHealth: PasswordHealthEntry[];
}

// ✅ React.FC applied here
const SIEMDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    loginEvents: [],
    passwordChanges: [],
    suspiciousLogins: [],
    passwordHealth: [],
  });

useEffect(() => {
  const fetchData = async () => {
    const token = localStorage.getItem("token");
    console.log("Token used:", token);

    try {
      const res = await fetch("/api/siem-dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        const errorText = await res.text(); // fallback in case error body is not JSON
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      if (!contentType || !contentType.includes("application/json")) {
        const body = await res.text();
        throw new Error(`Expected JSON but got: ${body.slice(0, 100)}`);
      }

      const data = await res.json();
      console.log("Fetched SIEM data:", data);

      setStats({
        loginEvents: data.loginEvents || [],
        passwordChanges: data.passwordChanges || [],
        suspiciousLogins: data.suspiciousLogins || [],
        passwordHealth: data.passwordHealth || [],
      });
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  fetchData();
}, []);   

  return (
  <div className="min-h-screen bg-black text-white p-6">
    {/* Header */}
    <div className="flex items-center gap-4 mb-6">
      <button
        onClick={() => navigate(-1)}
        className="bg-red-500 text-white px-4 py-2 rounded mb-4"
      >
        ⬅️ Back
      </button>
      <h1 className="text-xl md:text-2xl font-semibold">
        System Event Management
      </h1>
    </div>

    {/* Graph Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center">
      <Graph title="Login Events (Top alarms)" data={stats.loginEvents} />
      <Graph title="Password Changes (Top alarms)" data={stats.passwordChanges} />
      <Graph title="Suspicious Login Alerts" data={stats.suspiciousLogins} />
      <Graph title="Password Health" data={stats.passwordHealth} />
    </div>
  </div>
);
}

export default SIEMDashboard;