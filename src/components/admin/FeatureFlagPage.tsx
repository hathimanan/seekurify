import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, ShieldCheck, Sparkles, ToggleLeft } from "lucide-react";
import { apiService } from "../../services/api";

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
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [originalFlags, setOriginalFlags] = useState<FeatureFlag[]>([]);
  const [draftFlags, setDraftFlags] = useState<FeatureFlag[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      setIsAdmin(false);
      console.log("No token found");
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      console.log(decoded);

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
      console.log("Calling loadFlags()");
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
    setDraftFlags((prev) =>
      prev.map((f) =>
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
      const original = originalFlags.find((f) => f.key === flag.key);

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

  const enabledCount = draftFlags.filter((flag) => flag.enabled).length;
  const disabledCount = draftFlags.length - enabledCount;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.14),_transparent_24%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_48%,_#f8fafc_100%)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(59,130,246,0.08),transparent_32%,rgba(168,85,247,0.08))]" />

          <div className="relative mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">
                <Sparkles className="h-3.5 w-3.5" />
                Admin Control Center
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Feature Flags
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Control staged releases, protect experimental modules, and manage
                live platform behavior without shipping a new build.
              </p>
            </div>

            <div className="relative flex flex-wrap gap-3">
              <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <button
                onClick={() => navigate("/homepageAfterLogin")}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                <Home className="h-4 w-4" />
                Home Page
              </button>
            </div>
          </div>

          <div className="relative mb-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Enabled
                  </p>
                  <p className="mt-2 text-3xl font-black text-emerald-900">
                    {enabledCount}
                  </p>
                </div>
                <ShieldCheck className="h-9 w-9 text-emerald-600" />
              </div>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                    Disabled
                  </p>
                  <p className="mt-2 text-3xl font-black text-rose-900">
                    {disabledCount}
                  </p>
                </div>
                <ToggleLeft className="h-9 w-9 text-rose-600" />
              </div>
            </div>

            <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    Total Flags
                  </p>
                  <p className="mt-2 text-3xl font-black text-sky-900">
                    {draftFlags.length}
                  </p>
                </div>
                <Sparkles className="h-9 w-9 text-sky-600" />
              </div>
            </div>
          </div>

          <div className="relative space-y-4">
            {draftFlags.map((flag) => (
              <div
                key={flag.key}
                className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-bold text-slate-900">
                        {flag.name}
                      </h2>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {flag.key}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                          flag.enabled
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {flag.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>

                    <p className="max-w-3xl text-sm leading-6 text-slate-600">
                      {flag.description || "No description provided."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        Rollout: {flag.rolloutPercentage}%
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1">
                        Roles: {flag.allowedRoles?.join(", ") || "All"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggle(flag)}
                      className={`rounded-2xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 ${
                        flag.enabled
                          ? "bg-rose-600 hover:bg-rose-700"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      }`}
                    >
                      {flag.enabled ? "Disable Flag" : "Enable Flag"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasChanges && (
            <div className="sticky bottom-4 z-10 mt-8 rounded-2xl border border-slate-900 bg-slate-950/95 p-4 shadow-2xl backdrop-blur">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    Unsaved changes
                  </p>
                  <p className="text-xs text-slate-300">
                    Review and apply your updated feature rollout
                    configuration.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="rounded-xl border border-slate-700 bg-transparent px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
