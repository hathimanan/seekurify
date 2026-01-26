import { useEffect, useState } from "react";
// import { getFlags, toggleFlag } from "../../api/featureFlags";
import { jwtDecode } from "jwt-decode";
import { apiService } from '../../services/api';
import { API_BASE_URL } from "../../services/api";


const { getFlags, toggleFlag } = apiService;


type FeatureFlag = {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number;
  allowedRoles: string[];
};


type TokenPayload = {
  id: string;
  role: "admin" | "user";
  exp: number;
};

export default function FeatureFlagPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [originalFlags, setOriginalFlags] = useState<FeatureFlag[]>([]);
  const [draftFlags, setDraftFlags] = useState<FeatureFlag[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setIsAdmin(false);
      console.log("❌ No token found");
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      console.log(decoded);
      // token expired?
      if (decoded.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        setIsAdmin(false);
        return;
      }

      setIsAdmin(decoded.role === "admin");
    } catch {
      setIsAdmin(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAdmin) {
      console.log("🚀 Calling loadFlags()");
      loadFlags();
    }
  }, [isAdmin]);






  const loadFlags = async () => {
    const data = await getFlags(token!);
    const flags = data.flags ?? data;

    setOriginalFlags(flags);
    setDraftFlags(flags);
    setHasChanges(false);
  };


  const handleToggle = (flag: FeatureFlag) => {
    setDraftFlags(prev =>
      prev.map(f =>
        f.key === flag.key
          ? {
            ...f,
            enabled: !f.enabled,
            rolloutPercentage: !f.enabled ? 100 : 0,
          }
          : f
      )
    );

    setHasChanges(true);
  };


  const handleSave = async () => {
    for (const flag of draftFlags) {
      const original = originalFlags.find(f => f.key === flag.key);

      if (
        original &&
        (original.enabled !== flag.enabled ||
          original.rolloutPercentage !== flag.rolloutPercentage)
      ) {
        await toggleFlag(token!, flag.key, {
          enabled: flag.enabled,
          rolloutPercentage: flag.rolloutPercentage,
        });
      }
    }

    setOriginalFlags(draftFlags);
    setHasChanges(false);
  };


  const handleCancel = () => {
    setDraftFlags(originalFlags);
    setHasChanges(false);
  };











return (
  <div className="p-6">
    <h1 className="text-3xl font-bold mb-6">Feature Flags</h1>

    <table className="w-full border text-left">
      <thead className="bg-gray-200">
        <tr>
          <th className="p-3">Name</th>
          <th className="p-3">Description</th>
          <th className="p-3">Enabled</th>
          <th className="p-3">Action</th>
        </tr>
      </thead>

      <tbody>
        {draftFlags.map(flag => (
          <tr key={flag.key} className="border-b">
            <td className="p-3">{flag.name}</td>
            <td className="p-3">{flag.description}</td>
            <td className="p-3">
              <span
                className={`font-bold ${flag.enabled ? "text-green-600" : "text-red-600"
                  }`}
              >
                {flag.enabled ? "ON" : "OFF"}
              </span>
            </td>
            <td className="p-3">
              <button
                onClick={() => handleToggle(flag)}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Toggle
              </button>
            </td>
          </tr>
        ))}
      </tbody>


     

    </table>



     {hasChanges && (
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-green-600 text-white rounded"
          >
            Save
          </button>

          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-400 text-black rounded"
          >
            Cancel
          </button>
        </div>
      )}
  </div>
);
}
