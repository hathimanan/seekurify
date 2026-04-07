import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanEye,
  Image as ImageIcon,
  Film,
  Mic,
  UploadCloud,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  X,
  FileSearch,
  KeyRound,
  BarChart3,
  Shield,
  ShieldX,
  Phone,
  Zap,
  Eye,
  ChevronRight,
  Clock,
  BarChart2,
} from "lucide-react";
import { API_BASE_URL } from "../services/api";
import Header from "./ui/Header";
import Footer from "./ui/Footer";
import { useNavigate } from "react-router-dom";
import AppSidebar from "./ui/AppSidebar";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Mode = "image" | "video" | "audio";
type Verdict = "DEEPFAKE" | "AUTHENTIC" | "UNCERTAIN" | null;

interface BreakdownItem { label: string; score: number; }

interface ScanResult {
  verdict: "DEEPFAKE" | "AUTHENTIC" | "UNCERTAIN";
  confidence: number;   // 0-100, chance of being fake
  topLabel: string;
  breakdown: BreakdownItem[];
}

interface FrameResult {
  index: number;
  timeLabel: string;
  thumbnail: string;
  result: ScanResult | null;
  error?: string;
}

// ─── Nav ────────────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Analyze Malware",         path: "/malware-analysis",  icon: <FileSearch  className="w-5 h-5" /> },
  { label: "Password Manager",         path: "/dashboard",         icon: <KeyRound    className="w-5 h-5" /> },
  { label: "System Events Dashboard",  path: "/siem-dashboard",    icon: <BarChart3   className="w-5 h-5" /> },
  { label: "Prompt Privacy Scanner",   path: "/prompt-scanner",    icon: <Shield      className="w-5 h-5" /> },
  { label: "AI Injection Scanner",     path: "/injection-scanner", icon: <Zap         className="w-5 h-5" /> },
  { label: "Watch Agent",              path: "/watch-agent",       icon: <Eye         className="w-5 h-5" /> },
  { label: "DeepFake Detector",        path: "/deepfake-detector", icon: <ScanEye     className="w-5 h-5" /> },
  { label: "Contact Us",               path: "/contact",           icon: <Phone       className="w-5 h-5" /> },
];

// ─── Confidence Meter ──────────────────────────────────────────────────────────

const ConfidenceMeter: React.FC<{ value: number; verdict: Verdict; animated?: boolean }> = ({
  value, verdict, animated = true
}) => {
  const [displayed, setDisplayed] = useState(animated ? 0 : value);
  useEffect(() => {
    if (!animated) { setDisplayed(value); return; }
    const start = Date.now();
    const duration = 1000;
    const from = 0;
    const raf = (cb: () => void) => requestAnimationFrame(cb);
    const step = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(from + (value - from) * ease));
      if (progress < 1) raf(step);
    };
    raf(step);
  }, [value, animated]);

  const R = 68;
  const circ = 2 * Math.PI * R;
  const fill = (displayed / 100) * circ;
  const offset = circ - fill;

  const color =
    verdict === "DEEPFAKE"  ? (displayed > 80 ? "#ef4444" : "#f97316") :
    verdict === "UNCERTAIN" ? "#f59e0b" :
    "#22c55e";

  const glowId = `glow-${verdict ?? "neutral"}`;

  return (
    <svg width="176" height="176" viewBox="0 0 176 176" className="mx-auto drop-shadow-xl">
      <defs>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Track */}
      <circle cx="88" cy="88" r={R} fill="none" stroke="#1f2937" strokeWidth="14" />
      {/* Arc */}
      <circle
        cx="88" cy="88" r={R}
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 88 88)"
        filter={`url(#${glowId})`}
        style={{ transition: animated ? "none" : undefined }}
      />
      {/* % text */}
      <text x="88" y="80" textAnchor="middle" fill="white" fontSize="30" fontWeight="700" fontFamily="sans-serif">
        {displayed}%
      </text>
      <text x="88" y="102" textAnchor="middle" fill={color} fontSize="11" fontWeight="600" fontFamily="sans-serif" letterSpacing="2">
        {verdict === "DEEPFAKE" ? "FAKE PROB." : verdict === "AUTHENTIC" ? "AUTHENTIC" : verdict === "UNCERTAIN" ? "UNCERTAIN" : "CONFIDENCE"}
      </text>
    </svg>
  );
};

// ─── Verdict Badge ─────────────────────────────────────────────────────────────

const VERDICT_STYLES: Record<NonNullable<Verdict>, { bg: string; icon: React.ReactNode }> = {
  DEEPFAKE:  { bg: "bg-red-600/20 text-red-400 border border-red-500/40",      icon: <ShieldAlert   className="w-5 h-5" /> },
  UNCERTAIN: { bg: "bg-amber-600/20 text-amber-400 border border-amber-500/40", icon: <AlertTriangle className="w-5 h-5" /> },
  AUTHENTIC: { bg: "bg-green-600/20 text-green-400 border border-green-500/40", icon: <ShieldCheck   className="w-5 h-5" /> },
};

const VerdictBadge: React.FC<{ verdict: Verdict }> = ({ verdict }) => {
  if (!verdict) return null;
  const { bg, icon } = VERDICT_STYLES[verdict];
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-2 px-5 py-2 rounded-full font-bold text-base tracking-widest shadow-lg ${bg}`}
    >
      {icon}
      {verdict}
    </motion.div>
  );
};

// ─── Drop Zone ─────────────────────────────────────────────────────────────────

interface DropZoneProps {
  mode: Mode;
  onFile: (f: File) => void;
  accept: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

const DropZone: React.FC<DropZoneProps> = ({ mode, onFile, accept, disabled, children }) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handle = (f: File | null) => { if (f && !disabled) onFile(f); };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    handle(e.dataTransfer.files[0] ?? null);
  }, [disabled]);

  const icons = { image: <ImageIcon className="w-10 h-10" />, video: <Film className="w-10 h-10" />, audio: <Mic className="w-10 h-10" /> };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-10 flex flex-col items-center gap-3 text-center
        ${dragging ? "border-indigo-400 bg-indigo-900/20 scale-[1.01]" : "border-gray-600 hover:border-indigo-500 bg-gray-900/40 hover:bg-indigo-900/10"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => handle(e.target.files?.[0] ?? null)} disabled={disabled} />
      <div className="text-indigo-400">{icons[mode]}</div>
      <p className="text-gray-300 font-medium">
        {children ?? <>Drag & drop or <span className="text-indigo-400 underline">browse</span></>}
      </p>
      <p className="text-xs text-gray-500">
        {mode === "image" && "JPEG · PNG · WebP · GIF — up to 10 MB"}
        {mode === "video" && "MP4 · WebM · MOV — processed locally, frames sent for analysis"}
        {mode === "audio" && "WAV · MP3 · OGG · FLAC — up to 25 MB"}
      </p>
      {dragging && (
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-indigo-400 bg-indigo-900/10 pointer-events-none"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        />
      )}
    </div>
  );
};

// ─── Score Bar ────────────────────────────────────────────────────────────────

const ScoreBar: React.FC<{ label: string; score: number; isFake: boolean }> = ({ label, score, isFake }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-gray-400 w-28 truncate">{label}</span>
    <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
      <motion.div
        className={`h-2 rounded-full ${isFake ? "bg-red-500" : "bg-green-500"}`}
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />
    </div>
    <span className="text-xs text-gray-300 w-8 text-right">{score}%</span>
  </div>
);

// ─── Frame Timeline ───────────────────────────────────────────────────────────

const FrameTimeline: React.FC<{ frames: FrameResult[] }> = ({ frames }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  if (frames.length === 0) return null;

  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4" /> Frame-by-frame analysis
      </p>
      {/* Colour bar */}
      <div className="flex rounded-xl overflow-hidden h-4 mb-4">
        {frames.map((f, i) => {
          const fake = f.result?.verdict === "DEEPFAKE";
          const conf = f.result?.confidence ?? 50;
          const opacity = 0.4 + (conf / 100) * 0.6;
          return (
            <motion.div
              key={i}
              className="flex-1 cursor-pointer"
              style={{
                background: f.error ? "#6b7280"
                  : fake ? `rgba(239,68,68,${opacity})`
                  : `rgba(34,197,94,${opacity})`,
              }}
              initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.05 }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {frames.map((f, i) => {
          const fake = f.result?.verdict === "DEEPFAKE";
          const pending = !f.result && !f.error;
          return (
            <div
              key={i}
              className="flex-shrink-0 relative"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className={`w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                pending        ? "border-gray-600 opacity-50"
                : f.error      ? "border-gray-500"
                : fake         ? "border-red-500"
                : "border-green-500"
              }`}>
                {f.thumbnail ? (
                  <img src={f.thumbnail} alt={`frame-${i}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    {pending ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> : <X className="w-4 h-4 text-gray-500" />}
                  </div>
                )}
                {!pending && (
                  <div className={`absolute inset-0 rounded-lg flex items-end justify-center pb-1 text-xs font-bold ${
                    fake ? "text-red-300" : "text-green-300"
                  }`}>
                    <span className="bg-black/60 px-1 rounded">{f.result?.confidence ?? "?"}%</span>
                  </div>
                )}
              </div>
              <p className="text-center text-xs text-gray-500 mt-0.5">{f.timeLabel}</p>

              {/* Hover tooltip */}
              <AnimatePresence>
                {hovered === i && f.result && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 bg-gray-900 border border-gray-700 rounded-xl p-2 w-32 shadow-xl text-center"
                  >
                    <p className={`text-xs font-bold ${fake ? "text-red-400" : "text-green-400"}`}>
                      {f.result.verdict}
                    </p>
                    <p className="text-xs text-gray-400">{f.result.confidence}% fake prob.</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Aggregate bar chart */}
      <div className="mt-4 flex items-end gap-1 h-16">
        {frames.map((f, i) => {
          const conf = f.result?.confidence ?? 0;
          const fake = f.result?.verdict === "DEEPFAKE";
          return (
            <motion.div
              key={i}
              className={`flex-1 rounded-t ${fake ? "bg-red-500/70" : "bg-green-500/70"} ${!f.result ? "bg-gray-700/40" : ""}`}
              initial={{ height: 0 }} animate={{ height: `${Math.max(conf, 4)}%` }}
              transition={{ delay: i * 0.06, duration: 0.5 }}
              title={`Frame ${i + 1}: ${conf}%`}
            />
          );
        })}
      </div>
      <p className="text-xs text-gray-600 text-center mt-1">Fake probability per frame</p>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────

const DeepFakeDetector: React.FC = () => {
  const navigate   = useNavigate();
  const token      = localStorage.getItem("token");
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [profileImage,     setProfileImage]    = useState("");

  // Detection state
  const [mode,         setMode]         = useState<Mode>("image");
  const [file,         setFile]         = useState<File | null>(null);
  const [preview,      setPreview]      = useState<string | null>(null);
  const [analyzing,    setAnalyzing]    = useState(false);
  const [result,       setResult]       = useState<ScanResult | null>(null);
  const [frames,       setFrames]       = useState<FrameResult[]>([]);
  const [error,        setError]        = useState<string | null>(null);
  const [status,       setStatus]       = useState<string>("");
  const [progress,     setProgress]     = useState(0);   // 0-100 for video

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/"); };

  // Profile
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.profileImage) setProfileImage(d.profileImage); })
      .catch(() => {});
  }, [token]);

  // ── Reset on mode change ──────────────────────────────────────────────────────
  const resetState = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setFrames([]);
    setError(null);
    setStatus("");
    setProgress(0);
  };

  const switchMode = (m: Mode) => { setMode(m); resetState(); };

  // ── File selection ────────────────────────────────────────────────────────────
  const handleFile = (f: File) => {
    resetState();
    setFile(f);
    if (mode === "image") {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target?.result as string);
      reader.readAsDataURL(f);
    } else if (mode === "video") {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(URL.createObjectURL(f));
    }
  };

  // ── Call backend image endpoint ───────────────────────────────────────────────
  const analyzeImageBlob = async (blob: Blob): Promise<ScanResult> => {
    const fd = new FormData();
    fd.append("file", blob, "frame.jpg");

    const res  = await fetch(`${API_BASE_URL}/deepfake/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Analysis failed.");
    return data as ScanResult;
  };

  // ── Extract video frames & analyse ───────────────────────────────────────────
  const analyzeVideo = async (videoFile: File) => {
    const FRAME_COUNT = 10;
    const video  = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx    = canvas.getContext("2d")!;

    await new Promise<void>((resolve, reject) => {
      video.src = URL.createObjectURL(videoFile);
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not load video."));
      setTimeout(reject, 15_000, new Error("Video load timed out."));
    });

    canvas.width  = Math.min(video.videoWidth,  640);
    canvas.height = Math.min(video.videoHeight, 360);
    const duration = video.duration;

    // Initialise skeleton frames for progressive UI
    const skeleton: FrameResult[] = Array.from({ length: FRAME_COUNT }, (_, i) => ({
      index:     i,
      timeLabel: formatTime((i / (FRAME_COUNT - 1)) * duration),
      thumbnail: "",
      result:    null,
    }));
    setFrames(skeleton);

    const allResults: ScanResult[] = [];

    for (let i = 0; i < FRAME_COUNT; i++) {
      const t = (i / (FRAME_COUNT - 1)) * duration;

      setStatus(`Analysing frame ${i + 1} / ${FRAME_COUNT}…`);
      setProgress(Math.round((i / FRAME_COUNT) * 100));

      // Seek
      await new Promise<void>(resolve => {
        video.currentTime = t;
        video.onseeked = () => resolve();
      });

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnail = canvas.toDataURL("image/jpeg", 0.75);

      const blob = await new Promise<Blob>(resolve =>
        canvas.toBlob(b => resolve(b!), "image/jpeg", 0.8)
      );

      let frameResult: ScanResult | null = null;
      let frameError: string | undefined;

      try {
        frameResult = await analyzeImageBlob(blob);
        allResults.push(frameResult);
      } catch (e: any) {
        frameError = e.message;
      }

      setFrames(prev => prev.map((f, idx) =>
        idx === i ? { ...f, thumbnail, result: frameResult, error: frameError } : f
      ));
    }

    URL.revokeObjectURL(video.src);
    setProgress(100);

    if (allResults.length === 0) throw new Error("All frames failed to analyse.");

    // Aggregate: max fake confidence + majority vote
    const fakeResults      = allResults.filter(r => r.verdict === "DEEPFAKE");
    const uncertainResults = allResults.filter(r => r.verdict === "UNCERTAIN");
    const maxFake          = Math.max(...allResults.map(r => r.confidence));
    const fakeRatio        = fakeResults.length / allResults.length;
    const verdict: "DEEPFAKE" | "AUTHENTIC" | "UNCERTAIN" =
      fakeRatio > 0.5 ? "DEEPFAKE" :
      (fakeResults.length + uncertainResults.length) / allResults.length > 0.4 ? "UNCERTAIN" :
      "AUTHENTIC";

    return {
      verdict,
      confidence:  maxFake,
      topLabel:    `${fakeResults.length}/${allResults.length} frames flagged`,
      breakdown:   [
        { label: "Frames flagged as fake",   score: Math.round((fakeResults.length / allResults.length) * 100) },
        { label: "Max fake probability",     score: maxFake },
        { label: "Avg fake probability",     score: Math.round(allResults.reduce((s, r) => s + r.confidence, 0) / allResults.length) },
      ],
    };
  };

  // ── Call backend audio endpoint ───────────────────────────────────────────────
  const analyzeAudio = async (audioFile: File): Promise<ScanResult> => {
    const fd = new FormData();
    fd.append("file", audioFile);

    const res  = await fetch(`${API_BASE_URL}/deepfake/audio`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Audio analysis failed.");
    return data as ScanResult;
  };

  // ── Run analysis ──────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setResult(null);
    setError(null);
    setFrames([]);
    setProgress(0);

    try {
      let scanResult: ScanResult;

      if (mode === "image") {
        setStatus("Scanning image for manipulation…");
        const blob = await file.arrayBuffer().then(b => new Blob([b], { type: file.type }));
        scanResult = await analyzeImageBlob(blob);

      } else if (mode === "video") {
        setStatus("Extracting frames…");
        scanResult = await analyzeVideo(file);

      } else {
        setStatus("Analysing audio…");
        scanResult = await analyzeAudio(file);
      }

      setResult(scanResult);
      setStatus("");
    } catch (e: any) {
      setError(e.message ?? "Analysis failed.");
      setStatus("");
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const acceptMap: Record<Mode, string> = {
    image: "image/jpeg,image/png,image/webp,image/gif",
    video: "video/mp4,video/webm,video/quicktime",
    audio: "audio/wav,audio/mpeg,audio/ogg,audio/flac,.wav,.mp3,.ogg,.flac",
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#0d1117] text-gray-100">
      <Header
        token={token || ""}
        handleLogout={handleLogout}
        profileImage={profileImage}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AppSidebar sidebarExpanded={sidebarExpanded} setSidebarExpanded={setSidebarExpanded} />


        {/* Main */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-indigo-400 flex items-center gap-2">
              <ScanEye className="w-8 h-8" /> DeepFake Detector
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              AI-powered authenticity analysis for images, videos, and audio — powered by Hugging Face models.
            </p>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-1 mb-6 bg-gray-900 border border-gray-800 p-1 rounded-xl w-fit">
            {(["image", "video", "audio"] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition capitalize ${
                  mode === m
                    ? "bg-indigo-600 text-white shadow"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {m === "image" && <ImageIcon className="w-4 h-4" />}
                {m === "video" && <Film className="w-4 h-4" />}
                {m === "audio" && <Mic className="w-4 h-4" />}
                {m}
              </button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">

            {/* ── Left: Upload + preview ── */}
            <div className="flex flex-col gap-4">
              <DropZone
                mode={mode}
                onFile={handleFile}
                accept={acceptMap[mode]}
                disabled={analyzing}
              />

              {/* Preview */}
              <AnimatePresence mode="wait">
                {preview && (
                  <motion.div
                    key={preview}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="relative rounded-2xl overflow-hidden border border-gray-700 bg-gray-900"
                  >
                    {mode === "image" && (
                      <img src={preview} alt="preview" className="w-full max-h-80 object-contain" />
                    )}
                    {mode === "video" && (
                      <video src={preview} controls className="w-full max-h-72" />
                    )}
                    {mode === "audio" && (
                      <div className="p-4 flex flex-col items-center gap-3">
                        <Mic className="w-12 h-12 text-indigo-400 opacity-60" />
                        <p className="text-sm text-gray-400 truncate max-w-full">{file?.name}</p>
                        <audio src={preview} controls className="w-full" />
                      </div>
                    )}
                    {/* File name overlay */}
                    <div className="absolute top-2 right-2 flex gap-2">
                      <span className="bg-black/70 text-xs text-gray-300 px-2 py-1 rounded-lg truncate max-w-xs">
                        {file?.name}
                      </span>
                      <button
                        onClick={resetState}
                        className="bg-black/70 hover:bg-red-600/80 text-gray-400 hover:text-white p-1 rounded-lg transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Analyse button */}
              {file && (
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-indigo-900/30 transition"
                >
                  {analyzing
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> {status || "Analysing…"}</>
                    : <><ScanEye className="w-5 h-5" /> Analyse {mode}</>
                  }
                </button>
              )}

              {/* Video progress bar */}
              {mode === "video" && analyzing && (
                <div className="space-y-1">
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <motion.div
                      className="h-1.5 rounded-full bg-indigo-500"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center">{progress}%</p>
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-start gap-2 bg-red-900/20 border border-red-700/40 text-red-400 rounded-xl p-3 text-sm"
                  >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Right: Results ── */}
            <div className="flex flex-col gap-4">
              <AnimatePresence mode="wait">
                {!result && !analyzing && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-gray-600"
                  >
                    <ScanEye className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg font-medium">Upload a file to begin</p>
                    <p className="text-sm mt-1">Results will appear here</p>
                  </motion.div>
                )}

                {analyzing && !result && (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 gap-4"
                  >
                    {/* Pulsing scanner ring */}
                    <div className="relative w-36 h-36">
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-indigo-500/30"
                        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute inset-4 rounded-full border-4 border-indigo-400/50"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.7, 0.2, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ScanEye className="w-10 h-10 text-indigo-400 animate-pulse" />
                      </div>
                    </div>
                    <p className="text-indigo-300 font-semibold">{status || "Analysing…"}</p>
                    <p className="text-xs text-gray-500">Hugging Face models may take 20–30 s on first run</p>
                  </motion.div>
                )}

                {result && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-5"
                  >
                    {/* Verdict */}
                    <div className="flex flex-col items-center gap-3">
                      <ConfidenceMeter value={result.confidence} verdict={result.verdict} />
                      <VerdictBadge verdict={result.verdict} />
                      <p className="text-xs text-gray-500 text-center">{result.topLabel}</p>
                    </div>

                    {/* Contextual verdict message */}
                    {result.verdict === "DEEPFAKE" && (
                      <div className="flex items-start gap-2 bg-red-900/20 border border-red-700/30 rounded-xl p-3">
                        <ShieldX className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-300">
                          Strong indicators of AI manipulation detected (&gt;72% fake probability).
                          Treat with caution and verify through trusted sources.
                        </p>
                      </div>
                    )}
                    {result.verdict === "UNCERTAIN" && (
                      <div className="flex items-start gap-2 bg-amber-900/20 border border-amber-700/30 rounded-xl p-3">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-300">
                          The model is not confident enough to reach a verdict (35–72% range).
                          This can happen with heavily compressed, filtered, or low-resolution {mode}s.
                          Consider using a higher-quality source.
                        </p>
                      </div>
                    )}
                    {result.verdict === "AUTHENTIC" && (
                      <div className="flex items-start gap-2 bg-green-900/20 border border-green-700/30 rounded-xl p-3">
                        <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-green-300">
                          No significant signs of AI-generated manipulation detected (&lt;35% fake probability).
                        </p>
                      </div>
                    )}
                    {/* Accuracy disclaimer */}
                    <p className="text-xs text-gray-600 italic border-t border-gray-800 pt-2">
                      These models can produce false positives on real media. Results should be treated as
                      one signal, not a definitive determination.
                    </p>

                    {/* Breakdown bars */}
                    {result.breakdown.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                          <BarChart2 className="w-3.5 h-3.5" /> Model breakdown
                        </p>
                        <div className="flex flex-col gap-2">
                          {result.breakdown.map((b, i) => (
                            <ScoreBar
                              key={i}
                              label={b.label}
                              score={b.score}
                              isFake={/fake/i.test(b.label) || (mode === "video" && i === 0)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Confidence interpretation */}
                    <div className="text-xs text-gray-600 border-t border-gray-800 pt-3">
                      <ChevronRight className="w-3 h-3 inline" />
                      {result.confidence >= 80
                        ? " High confidence — model is strongly certain about this verdict."
                        : result.confidence >= 50
                        ? " Moderate confidence — some uncertainty; consider additional verification."
                        : " Low confidence — model is uncertain. This result may be unreliable."}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Video frame timeline (full width below grid) */}
          {mode === "video" && frames.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl p-6"
            >
              <FrameTimeline frames={frames} />
            </motion.div>
          )}

          {/* Info cards */}
          <div className="mt-8 grid gap-4 sm:grid-cols-3 text-sm">
            {[
              {
                icon: <ImageIcon className="w-5 h-5 text-indigo-400" />,
                title: "Image Forensics",
                desc: "Three independent signals: Error Level Analysis (ELA) detects recompression inconsistencies, noise uniformity flags AI's unnaturally smooth textures, and metadata inspection checks for AI tool signatures and suspicious structure.",
              },
              {
                icon: <Film className="w-5 h-5 text-purple-400" />,
                title: "Video Analysis",
                desc: "Extracts up to 10 frames in-browser via Canvas API, runs full forensic analysis on each independently, and aggregates results into a per-frame timeline.",
              },
              {
                icon: <Mic className="w-5 h-5 text-cyan-400" />,
                title: "Audio Analysis",
                desc: "Uses a dedicated voice cloning / speech synthesis detection model via Hugging Face, with automatic fallback to a backup model if the primary is unavailable.",
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-2">
                {icon}
                <p className="font-semibold text-gray-300">{title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DeepFakeDetector;
