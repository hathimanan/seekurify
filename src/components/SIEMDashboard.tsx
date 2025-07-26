import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Graph component
const Graph = ({ title, data }: { title: string; data: number[] }) => (
  <div className="bg-[#5b5252] w-80 h-56 m-4 rounded-md p-4 flex flex-col items-center justify-start shadow-lg">
    <h2 className="text-white text-lg font-bold text-center mb-4">{title}</h2>
    <div className="flex justify-around items-end w-full h-full">
      {data.length === 0 ? (
        <p className="text-white text-sm text-center w-full">No data found</p>
      ) : (
        data.map((val, i) => (
          <div
            key={i}
            className="bg-red-500 w-1.5 mx-1 rounded-sm"
            style={{ height: `${val * 20}px` }}
          />
        ))
      )}
    </div>
  </div>
);

const SIEMDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    loginEvents: [],
    passwordChanges: [],
    suspiciousLogins: [],
    passwordHealth: [],
  });

  useEffect(() => {
    fetch("/api/dashboard", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setStats({
          loginEvents: data.loginEvents || [],
          passwordChanges: data.passwordChanges || [],
          suspiciousLogins: data.suspiciousLogins || [],
          passwordHealth: data.passwordHealth || [],
        });
      })
      .catch((err) => console.error("Dashboard fetch error:", err));
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
      <div className="flex flex-wrap justify-center">
        <Graph title="Login Events (Top alarms)" data={stats.loginEvents} />
        <Graph title="Password Changes (Top alarms)" data={stats.passwordChanges} />
        <Graph title="Suspicious Login Alerts" data={stats.suspiciousLogins} />
        <Graph title="Password Health" data={stats.passwordHealth} />
      </div>
    </div>
  );
};

export default SIEMDashboard;
