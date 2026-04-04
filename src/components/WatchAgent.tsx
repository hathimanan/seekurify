import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Plus,
  Trash2,
  RefreshCw,
  Bell,
  BellOff,
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Shield,
  ShieldCheck,
  FileSearch,
  KeyRound,
  BarChart3,
  Phone,
  Loader2,
  ChevronDown,
  ChevronUp,
  Zap,
  Clock,
  X,
  PauseCircle,
  PlayCircle,
  CheckCheck,
  ScanEye,
} from "lucide-react";
import { API_BASE_URL } from "../services/api";
import Header from "./ui/Header";
import Footer from "./ui/Footer";
import AppSidebar from "./ui/AppSidebar";
import { useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WatchlistItem {
  _id: string;
  url: string;
  hostname: string;
  active: boolean;
  lastScore?: number;
  lastGrade?: string;
  lastFindings?: string[];
  lastScannedAt?: string;
}

interface WatchAlert {
  _id: string;
  url: string;
  hostname: string;
  severity: "critical" | "high" | "medium" | "low" | "improvement";
  prevScore?: number;
  newScore: number;
  scoreDelta: number;
  newFindings: string[];
  resolvedFindings: string[];
  summary: string;
  read: boolean;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const gradeColor = (grade?: string) => {
  if (!grade) return "text-gray-400";
  if (grade === "A") return "text-green-500";
  if (grade === "B") return "text-lime-500";
  if (grade === "C") return "text-yellow-500";
  if (grade === "D") return "text-orange-500";
  return "text-red-500";
};

const scoreBar = (score?: number) => {
  const s = score ?? 0;
  const color =
    s >= 90 ? "bg-green-500" :
    s >= 75 ? "bg-lime-500"  :
    s >= 60 ? "bg-yellow-500":
    s >= 40 ? "bg-orange-500": "bg-red-500";
  return { width: `${s}%`, color };
};

const severityConfig = {
  critical:    { bg: "bg-red-100 dark:bg-red-900/30",    text: "text-red-700 dark:text-red-300",    icon: AlertCircle,    label: "Critical"     },
  high:        { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", icon: AlertTriangle, label: "High"       },
  medium:      { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", icon: AlertTriangle, label: "Medium"     },
  low:         { bg: "bg-blue-100 dark:bg-blue-900/30",   text: "text-blue-700 dark:text-blue-300",   icon: Bell,           label: "Low"          },
  improvement: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", icon: TrendingUp,     label: "Improvement"  },
};

// ─── Main Component ───────────────────────────────────────────────────────────

const WatchAgent: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Sidebar & dark mode
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [profileImage, setProfileImage] = useState("");

  // Watchlist state
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [alerts, setAlerts]       = useState<WatchAlert[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  // Add URL form
  const [newUrl, setNewUrl]   = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  // Per-item scanning
  const [scanningId, setScanningId] = useState<string | null>(null);
  const [scanAllLoading, setScanAllLoading] = useState(false);

  // Expanded alert
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  // Tab
  const [tab, setTab] = useState<"watchlist" | "alerts">("watchlist");

  // ── Dark mode init ──────────────────────────────────────────────────────────
  const handleLogout = () => { localStorage.removeItem("token"); navigate("/"); };

  // ── Auth headers ─────────────────────────────────────────────────────────────
  const authHeaders = useCallback((): Record<string, string> => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  // ── Fetch watchlist ──────────────────────────────────────────────────────────
  const fetchWatchlist = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch(`${API_BASE_URL}/watchlist`, { headers: authHeaders() });
      const data = await res.json();
      setWatchlist(data.items ?? []);
    } catch (_) {}
    finally { setLoadingList(false); }
  }, [authHeaders]);

  // ── Fetch alerts ─────────────────────────────────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const res = await fetch(`${API_BASE_URL}/watchlist/alerts`, { headers: authHeaders() });
      const data = await res.json();
      setAlerts(data.alerts ?? []);
    } catch (_) {}
    finally { setLoadingAlerts(false); }
  }, [authHeaders]);

  useEffect(() => { fetchWatchlist(); fetchAlerts(); }, [fetchWatchlist, fetchAlerts]);

  // ── Profile image ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.profileImage) setProfileImage(d.profileImage); })
      .catch(() => {});
  }, [token]);

  // ── Add URL ───────────────────────────────────────────────────────────────────
  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    const trimmed = newUrl.trim();
    if (!trimmed) return;
    // Prepend https if missing scheme
    const full = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

    setAddLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/watchlist`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ url: full }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? "Failed to add URL."); return; }
      setNewUrl("");
      fetchWatchlist();
    } catch (_) {
      setAddError("Network error. Please try again.");
    } finally {
      setAddLoading(false);
    }
  };

  // ── Delete item ───────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/watchlist/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setWatchlist(prev => prev.filter(i => i._id !== id));
    } catch (_) {}
  };

  // ── Scan single ───────────────────────────────────────────────────────────────
  const handleScan = async (item: WatchlistItem) => {
    setScanningId(item._id);
    try {
      const res = await fetch(`${API_BASE_URL}/watchlist/scan`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ url: item.url }),
      });
      const data = await res.json();
      if (res.ok) {
        setWatchlist(prev => prev.map(i =>
          i._id === item._id
            ? { ...i, lastScore: data.lastScore, lastGrade: data.lastGrade, lastFindings: data.lastFindings, lastScannedAt: data.lastScannedAt }
            : i
        ));
        fetchAlerts();
      }
    } catch (_) {}
    finally { setScanningId(null); }
  };

  // ── Scan all ──────────────────────────────────────────────────────────────────
  const handleScanAll = async () => {
    setScanAllLoading(true);
    try {
      await fetch(`${API_BASE_URL}/watchlist/scan-all`, {
        method: "POST",
        headers: authHeaders(),
      });
      await fetchWatchlist();
      await fetchAlerts();
    } catch (_) {}
    finally { setScanAllLoading(false); }
  };

  // ── Mark alert read ───────────────────────────────────────────────────────────
  const markRead = async (alertId: string) => {
    try {
      await fetch(`${API_BASE_URL}/watchlist/alerts/${alertId}/read`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      setAlerts(prev => prev.map(a => a._id === alertId ? { ...a, read: true } : a));
    } catch (_) {}
  };

  // ── Mark all alerts read ──────────────────────────────────────────────────────
  const markAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/watchlist/alerts/read-all`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    } catch (_) {}
  };

  // ── Clear all alerts ──────────────────────────────────────────────────────────
  const clearAlerts = async () => {
    try {
      await fetch(`${API_BASE_URL}/watchlist/alerts`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setAlerts([]);
    } catch (_) {}
  };

  // ── Toggle active ─────────────────────────────────────────────────────────────
  const handleToggle = async (item: WatchlistItem) => {
    try {
      const res = await fetch(`${API_BASE_URL}/watchlist/${item._id}/toggle`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setWatchlist(prev => prev.map(i => i._id === item._id ? { ...i, active: data.item.active } : i));
      }
    } catch (_) {}
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
      <Header
        token={token || ""}
        handleLogout={handleLogout}
        profileImage={profileImage}
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
      />

      <div className="flex flex-1 overflow-hidden">
        <AppSidebar sidebarExpanded={sidebarExpanded} setSidebarExpanded={setSidebarExpanded} />

        {/* Main */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">

          {/* Header bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                <Eye className="w-8 h-8" /> Watch Agent
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                AI-powered nightly security monitoring. Add URLs to watch and get alerted when security changes.
              </p>
            </div>
            <button
              onClick={handleScanAll}
              disabled={scanAllLoading || watchlist.length === 0}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-semibold shadow transition"
            >
              {scanAllLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</>
                : <><RefreshCw className="w-4 h-4" /> Scan All Now</>}
            </button>
          </div>

          {/* Add URL form */}
          <form onSubmit={handleAddUrl} className="mb-8">
            <div className="flex gap-3">
              <input
                type="text"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="https://example.com  (or just  example.com)"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <button
                type="submit"
                disabled={addLoading || !newUrl.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-semibold shadow transition"
              >
                {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add URL
              </button>
            </div>
            {addError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{addError}</p>}
          </form>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => setTab("watchlist")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${
                tab === "watchlist"
                  ? "bg-white dark:bg-gray-700 shadow text-indigo-700 dark:text-indigo-300"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Watchlist ({watchlist.length})
            </button>
            <button
              onClick={() => setTab("alerts")}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${
                tab === "alerts"
                  ? "bg-white dark:bg-gray-700 shadow text-indigo-700 dark:text-indigo-300"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Alerts
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* ── Watchlist Tab ──────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
          {tab === "watchlist" && (
            <motion.div key="watchlist" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {loadingList ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : watchlist.length === 0 ? (
                <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No URLs being watched yet.</p>
                  <p className="text-sm mt-1">Add a URL above to start monitoring its security.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {watchlist.map(item => {
                    const bar = scoreBar(item.lastScore);
                    const isScanning = scanningId === item._id;
                    return (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-100 dark:border-gray-700 flex flex-col gap-3"
                      >
                        {/* URL + controls */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-sm text-indigo-700 dark:text-indigo-300 truncate">{item.hostname}</p>
                              {!item.active && (
                                <span className="text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full flex-shrink-0">Paused</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 truncate">{item.url}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                            <button
                              onClick={() => handleToggle(item)}
                              title={item.active ? "Pause monitoring" : "Resume monitoring"}
                              className="text-gray-400 hover:text-indigo-500 transition"
                            >
                              {item.active
                                ? <PauseCircle className="w-4 h-4" />
                                : <PlayCircle  className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="text-gray-400 hover:text-red-500 transition"
                              title="Remove from watchlist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Score */}
                        {item.lastScore != null ? (
                          <>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500 dark:text-gray-400">Security Score</span>
                              <span className={`text-xl font-extrabold ${gradeColor(item.lastGrade)}`}>
                                {item.lastGrade} &nbsp;
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{item.lastScore}/100</span>
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div className={`h-2 rounded-full transition-all ${bar.color}`} style={{ width: bar.width }} />
                            </div>
                            {item.lastFindings && item.lastFindings.length > 0 && (
                              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 pl-3 list-disc">
                                {item.lastFindings.slice(0, 4).map((f, i) => <li key={i}>{f}</li>)}
                                {item.lastFindings.length > 4 && (
                                  <li className="text-indigo-500">+{item.lastFindings.length - 4} more…</li>
                                )}
                              </ul>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-gray-500 italic">Not scanned yet.</p>
                        )}

                        {/* Last scanned */}
                        {item.lastScannedAt && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last scanned {new Date(item.lastScannedAt).toLocaleString()}
                          </p>
                        )}

                        {/* Scan button */}
                        <button
                          onClick={() => handleScan(item)}
                          disabled={isScanning || !item.active}
                          className="mt-auto flex items-center justify-center gap-2 text-sm font-semibold bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-800/40 text-indigo-700 dark:text-indigo-300 py-2 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isScanning
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</>
                            : !item.active
                              ? <><PauseCircle className="w-4 h-4" /> Monitoring Paused</>
                              : <><RefreshCw className="w-4 h-4" /> Scan Now</>}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Alerts Tab ─────────────────────────────────────────────────── */}
          {tab === "alerts" && (
            <motion.div key="alerts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {alerts.length > 0 && (
                <div className="flex items-center gap-2 mb-4 justify-end">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <CheckCheck className="w-4 h-4" /> Mark all read
                    </button>
                  )}
                  <button
                    onClick={clearAlerts}
                    className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:underline"
                  >
                    <Trash2 className="w-4 h-4" /> Clear all
                  </button>
                </div>
              )}
              {loadingAlerts ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                  <BellOff className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium">No alerts yet.</p>
                  <p className="text-sm mt-1">Alerts appear when security changes are detected during a scan.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {alerts.map(alert => {
                    const cfg = severityConfig[alert.severity] ?? severityConfig.low;
                    const SevIcon = cfg.icon;
                    const isExpanded = expandedAlert === alert._id;
                    return (
                      <motion.div
                        key={alert._id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-2xl border p-4 transition ${
                          alert.read
                            ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                            : `${cfg.bg} border-transparent`
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <SevIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${cfg.text}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className={`text-xs font-bold uppercase tracking-wide ${cfg.text}`}>{cfg.label}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">{alert.hostname}</span>
                              {alert.scoreDelta !== 0 && (
                                <span className={`text-xs font-semibold flex items-center gap-0.5 ${
                                  alert.scoreDelta < 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                                }`}>
                                  {alert.scoreDelta < 0
                                    ? <TrendingDown className="w-3.5 h-3.5" />
                                    : <TrendingUp   className="w-3.5 h-3.5" />}
                                  {alert.scoreDelta > 0 ? "+" : ""}{alert.scoreDelta} pts
                                </span>
                              )}
                              <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                                {new Date(alert.createdAt).toLocaleString()}
                              </span>
                            </div>

                            <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{alert.summary}</p>

                            {/* Expand / collapse details */}
                            {(alert.newFindings.length > 0 || alert.resolvedFindings.length > 0) && (
                              <button
                                onClick={() => setExpandedAlert(isExpanded ? null : alert._id)}
                                className="mt-2 flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                              >
                                {isExpanded ? <><ChevronUp className="w-3.5 h-3.5" /> Hide details</> : <><ChevronDown className="w-3.5 h-3.5" /> Show details</>}
                              </button>
                            )}

                            <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                key="details"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mt-2 space-y-2"
                              >
                                {alert.newFindings.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">New findings:</p>
                                    <ul className="list-disc pl-4 space-y-0.5">
                                      {alert.newFindings.map((f, i) => (
                                        <li key={i} className="text-xs text-gray-700 dark:text-gray-300">{f}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {alert.resolvedFindings.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Resolved:</p>
                                    <ul className="list-disc pl-4 space-y-0.5">
                                      {alert.resolvedFindings.map((f, i) => (
                                        <li key={i} className="text-xs text-gray-700 dark:text-gray-300">{f}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
                                  {alert.prevScore != null && <span>Previous score: <strong>{alert.prevScore}</strong></span>}
                                  <span>New score: <strong>{alert.newScore}</strong></span>
                                </div>
                              </motion.div>
                            )}
                            </AnimatePresence>
                          </div>

                          {/* Mark read button */}
                          {!alert.read && (
                            <button
                              onClick={() => markRead(alert._id)}
                              title="Mark as read"
                              className="flex-shrink-0 text-gray-400 hover:text-indigo-500 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
          </AnimatePresence>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default WatchAgent;
