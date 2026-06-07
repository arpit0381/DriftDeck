"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder, FileText, Sparkles, Settings as SettingsIcon,
  ArrowUpRight, Lock, Palette, Terminal, FileImage,
  FolderOpen, RefreshCw, CheckCircle, Clock, Download,
  Shield, Cpu, HelpCircle, ChevronRight, Layers, Eye
} from "lucide-react";
import { ThemeType } from "../lib/store";

interface LandingPageProps {
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  onDemoLogin: () => void;
  onTelegramLogin: (data: TelegramAuthData) => void;
  loading: boolean;
}

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

const THEMES: { value: ThemeType; label: string; primaryColor: string; bgClass: string }[] = [
  { value: "neon-cyberpunk", label: "Neon Cyberpunk", primaryColor: "#6366f1", bgClass: "from-indigo-600 to-pink-600" },
  { value: "midnight-glass", label: "Midnight Glass", primaryColor: "#38bdf8", bgClass: "from-sky-500 to-indigo-500" },
  { value: "crimson-void", label: "Crimson Void", primaryColor: "#ef4444", bgClass: "from-red-600 to-orange-600" },
  { value: "aurora-green", label: "Aurora Green", primaryColor: "#10b981", bgClass: "from-emerald-500 to-teal-600" },
  { value: "solar-gold", label: "Solar Gold", primaryColor: "#f59e0b", bgClass: "from-amber-500 to-yellow-600" },
];

// ─── Telegram Login via Bot ──────────────────────
function TelegramLoginWidget({ onAuth }: { onAuth: (user: TelegramAuthData) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (window as any).onTelegramAuth = (user: TelegramAuthData) => {
      onAuth(user);
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "driftdeck_bot");
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    if (containerRef.current) {
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(script);
    }

    return () => {
      delete (window as any).onTelegramAuth;
    };
  }, [onAuth]);

  return <div ref={containerRef} className="flex justify-center w-full min-h-[44px]" />;
}

function TelegramBotLogin({ onLogin }: { onLogin: (jwt: string) => void }) {
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 12));
  const [step, setStep] = useState<"idle" | "waiting" | "success">("idle");
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api").replace("/api", "");
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "driftdeck_bot";
  const deepLink = `https://t.me/${botUsername}?start=${sessionId}`;
  const pollUrl = `${apiUrl}/api/auth/poll/${sessionId}`;

  const pollNow = async () => {
    try {
      const res = await fetch(pollUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          setStep("success");
          onLogin(data.token);
          return true;
        }
      }
    } catch {
      // Poll silently
    }
    return false;
  };

  const startPolling = () => {
    const interval = setInterval(async () => {
      const success = await pollNow();
      if (success) clearInterval(interval);
    }, 2000);
    setPollInterval(interval);
    return interval;
  };

  const handleClick = () => {
    setStep("waiting");
    startPolling();
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && step === 'waiting') {
        pollNow();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      if (pollInterval) clearInterval(pollInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [pollInterval, step]);

  if (step === "success") {
    return (
      <div className="w-full py-3 rounded-xl flex items-center justify-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm">
        <CheckCircle className="w-5 h-5" />
        Authenticated! Loading...
      </div>
    );
  }

  if (step === "waiting") {
    return (
      <div className="w-full flex flex-col gap-3">
        <div className="w-full py-3 rounded-xl flex items-center justify-center gap-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold text-sm">
          <Clock className="w-4 h-4 animate-pulse" />
          Waiting for Bot response...
        </div>
        <p className="text-[10px] text-muted text-center font-mono leading-relaxed">
          Telegram bot opened in a new tab.<br />
          Send <span className="text-foreground font-bold">/start</span> to verify login.
        </p>
        <a
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline text-center block w-full"
        >
          Open Bot Manual Link →
        </a>
        <button
          onClick={() => { if (pollInterval) clearInterval(pollInterval); setStep("idle"); }}
          className="text-[10px] text-muted hover:text-foreground transition-colors text-center"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <a
      href={deepLink}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-95 hover:shadow-lg hover:shadow-sky-500/10 hover:brightness-110"
      style={{
        background: "linear-gradient(135deg, #2ca5e0 0%, #1a8cc4 100%)",
        color: "#fff",
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
      </svg>
      Log in via Bot Start
    </a>
  );
}

export default function LandingPage({
  theme, setTheme, onDemoLogin, onTelegramLogin, loading,
}: LandingPageProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installAvailable, setInstallAvailable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallAvailable(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setInstallAvailable(false);
    }
  };

  const handleBotLogin = async (jwt: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const res = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error("Token validation failed");
      const { user } = await res.json();
      onTelegramLogin({ ...user, _jwt: jwt } as any);
    } catch {
      alert("Verification failed. Please try again.");
    }
  };

  return (
    <div className="relative min-h-screen text-foreground overflow-x-hidden font-sans bg-background pb-20 md:pb-0 transition-colors duration-500">
      
      {/* Dynamic Cosmic Orbs Background */}
      <div className="absolute top-[5%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-primary/10 blur-[130px] pointer-events-none animate-float-orb" />
      <div className="absolute bottom-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-accent/8  blur-[140px] pointer-events-none animate-float-orb-reverse" />
      <div className="absolute top-[50%] left-[20%] w-[35vw] h-[35vw] rounded-full bg-primary/5 blur-[120px] pointer-events-none animate-float-orb" />

      {/* Grid Pulse Overlay */}
      <div className="absolute inset-0 grid-overlay pointer-events-none z-0" />

      {/* Persistent Floating FAB for Installing App on Mobile */}
      {installAvailable && (
        <button
          onClick={handleInstallClick}
          aria-label="Install DriftDeck App"
          className="floating-fab md:hidden flex items-center justify-center"
        >
          <Download className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Navigation / Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between relative z-10 border-b border-border/10 bg-background/20 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center glow-border overflow-hidden bg-black/40 border border-border">
            <img src="/logo.png" alt="DriftDeck Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-mono text-lg font-black tracking-widest text-foreground glow-text">
            DRIFT DECK
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#interactive-preview" className="hover:text-primary transition-colors">Interface</a>
          <a href="#how-it-works" className="hover:text-primary transition-colors">Walkthrough</a>
          <a href="#themes" className="hover:text-primary transition-colors">Theme Sandbox</a>
        </nav>

        <div className="flex items-center gap-3">
          {installAvailable && (
            <button
              onClick={handleInstallClick}
              className="hidden sm:flex px-4 py-2 rounded-xl font-bold text-sm bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 transition-all shadow-md active:scale-95 items-center gap-2"
            >
              <Download className="w-4 h-4 animate-bounce" /> Install App
            </button>
          )}

          <button
            onClick={onDemoLogin}
            disabled={loading}
            className="relative px-5 py-2 rounded-xl font-bold text-sm bg-primary hover:bg-primary-hover text-white transition-all shadow-md glow-border active:scale-95 disabled:opacity-60 flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-white animate-pulse" />}
            <span>{loading ? "Launching..." : "Instant Demo"}</span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 md:pt-24 pb-16 relative z-10 flex flex-col items-center text-center">
        
        {/* Accent badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/25 bg-primary/5 mb-8 backdrop-blur-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span className="text-[10px] sm:text-xs font-semibold text-primary tracking-widest uppercase font-mono">
            E2E Encrypted Telegram Cloud Storage
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight max-w-4xl leading-[1.15] mb-6"
        >
          Cyberpunk Dashboard Meets{" "}
          <span className="gradient-text glow-text">
            Zero-Cost Storage
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-muted max-w-2xl leading-relaxed mb-10 px-2"
        >
          Your personal deck of data. Store, organize, and query files client-side encrypted using Telegram as a limitless, secure database. Integrated Docs & AI nodes.
        </motion.p>

        {/* Auth / Login Container */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-full max-w-3xl flex flex-col md:flex-row items-stretch gap-5 justify-center mb-12"
        >
          {/* Box 1: Bot login */}
          <div className="flex-1 p-5 rounded-2xl glass-panel flex flex-col justify-between border border-border/40 hover:border-primary/30 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.05)] text-left">
            <div>
              <h3 className="text-xs font-mono font-black text-primary uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> Telegram Bot Link
              </h3>
              <p className="text-xs text-muted leading-relaxed mb-5">
                Launches deep-linked authentication with our automated bot. Highly reliable on mobile browsers.
              </p>
            </div>
            <TelegramBotLogin onLogin={handleBotLogin} />
          </div>

          {/* Divider */}
          <div className="flex md:flex-col items-center justify-center gap-3 opacity-40">
            <div className="h-px w-8 md:h-12 md:w-px bg-border" />
            <span className="text-[10px] text-muted font-mono tracking-widest">OR</span>
            <div className="h-px w-8 md:h-12 md:w-px bg-border" />
          </div>

          {/* Box 2: Official widget */}
          <div className="flex-1 p-5 rounded-2xl glass-panel flex flex-col justify-between border border-border/40 hover:border-accent/30 transition-all hover:shadow-[0_0_20px_rgba(217,70,239,0.05)] text-left">
            <div>
              <h3 className="text-xs font-mono font-black text-accent uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> Telegram Login Widget
              </h3>
              <p className="text-xs text-muted leading-relaxed mb-5">
                Direct Telegram Authentication. Recommended for desktop screens (requires third-party cookies enabled).
              </p>
            </div>
            <div className="flex items-center justify-center w-full min-h-[44px]">
              <TelegramLoginWidget onAuth={onTelegramLogin} />
            </div>
          </div>
        </motion.div>

        {/* Demo Fallback Trigger */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto mb-16"
        >
          <button
            onClick={onDemoLogin}
            disabled={loading}
            className="w-full py-3 bg-card/60 hover:bg-card border border-border/80 font-bold rounded-xl transition-all text-foreground flex items-center justify-center gap-2.5 text-sm active:scale-98 shadow-sm hover:border-muted-foreground/35"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin text-primary" /> : <Sparkles className="w-4 h-4 text-primary animate-pulse" />}
            <span>Try Interactive Demo (No Signup)</span>
          </button>
        </motion.div>

        {/* Core Stats Bar */}
        <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 py-6 border-y border-border/10 mb-20 bg-card/10 backdrop-blur-sm rounded-xl px-4">
          {[
            { value: "Unlimited", label: "Encrypted Storage" },
            { value: "Zero-Cost", label: "Server Architecture" },
            { value: "AES-256", label: "Client-Side Crypt" },
            { value: "Notion-Style", label: "Doc Integrations" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-lg sm:text-2xl font-black font-mono text-primary glow-text">{stat.value}</div>
              <div className="text-[10px] sm:text-xs text-muted uppercase font-mono mt-1 tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Dashboard Preview / Mockup Container */}
        <section id="interactive-preview" className="w-full max-w-5xl rounded-2xl overflow-hidden glass-panel border border-border/50 shadow-2xl relative bg-black/40">
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          
          {/* Header mockup window */}
          <div className="h-10 bg-card/80 border-b border-border/30 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="text-[10px] text-muted font-mono bg-black/30 px-3 py-1 rounded border border-border/20">
              https://driftdeck.cloud/dashboard
            </div>
            <div className="w-8" />
          </div>

          {/* Body mockup window */}
          <div className="h-[300px] sm:h-[450px] md:h-[550px] flex overflow-hidden">
            {/* Sidebar Mock */}
            <div className="w-48 hidden md:flex flex-col gap-4 border-r border-border/30 p-4 bg-card/20 select-none">
              <div className="h-6 bg-primary/10 rounded w-2/3 mb-4 flex items-center justify-center text-[10px] font-mono font-bold text-primary">WORKSPACE</div>
              {[
                { icon: <Folder className="w-3.5 h-3.5 text-primary" />, label: "All Files" },
                { icon: <Layers className="w-3.5 h-3.5 text-accent" />, label: "Document Canvas" },
                { icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />, label: "AI Co-Pilot" },
                { icon: <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />, label: "System Config" },
              ].map((item, idx) => (
                <div key={idx} className="h-8 rounded bg-card/30 border border-border/10 flex items-center gap-2.5 px-3.5 text-xs text-muted hover:text-foreground">
                  {item.icon}
                  <span className="font-mono">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Dashboard Workspace Mock */}
            <div className="flex-1 p-4 sm:p-6 flex flex-col gap-5 text-left bg-black/20 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm sm:text-base font-bold flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-primary" /> Root Directory
                  </h4>
                  <p className="text-[10px] text-muted font-mono mt-0.5">Encrypted Session: ACTIVE</p>
                </div>
                <div className="h-6 w-20 bg-primary/10 rounded border border-primary/20 flex items-center justify-center text-[9px] font-mono text-primary animate-pulse">
                  SECURE DECK
                </div>
              </div>

              {/* Grid boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { icon: <Folder className="w-6 h-6 text-primary" />, name: "Design Assets", count: "12 files" },
                  { icon: <FileImage className="w-6 h-6 text-accent" />, name: "System Mockups", count: "8 files" },
                  { icon: <FileText className="w-6 h-6 text-emerald-400" />, name: "AI Prompts.md", count: "4.2 KB" },
                ].map((box, idx) => (
                  <div key={idx} className="p-3 bg-card/40 rounded-xl border border-border/20 flex flex-col gap-2.5 hover:border-primary/40 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 rounded bg-black/40 flex items-center justify-center border border-border/10 group-hover:scale-105 transition-transform">
                      {box.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-tight truncate">{box.name}</div>
                      <div className="text-[9px] text-muted font-mono mt-0.5">{box.count}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating terminal bar mockup */}
              <div className="mt-auto bg-card/60 border border-border/40 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-primary">
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="text-[10px] sm:text-xs">aes-256-gcm: encrypting deck_document.pdf...</span>
                </div>
                <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  OK
                </span>
              </div>
            </div>
          </div>
        </section>
      </section>

      {/* Dynamic Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 relative z-10 border-t border-border/15">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-foreground font-mono">
            CYBERPUNK FEATURES SHEET
          </h2>
          <p className="text-muted text-sm max-w-xl mx-auto">
            Engineered with high performance client-side crypt engines and floating system modules.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Lock className="w-5 h-5" />,
              color: "text-primary border-primary/20 bg-primary/5 shadow-primary/10",
              title: "Client-Side Cryptography",
              desc: "Zero-knowledge security. Your master passphrase encrypts files locally via AES-256 before transit."
            },
            {
              icon: <Cpu className="w-5 h-5" />,
              color: "text-accent border-accent/20 bg-accent/5 shadow-accent/10",
              title: "Neural Copilot Integration",
              desc: "Leverage embedded AI nodes to compile document codebases, extract PDFs, or analyze documents."
            },
            {
              icon: <FolderOpen className="w-5 h-5" />,
              color: "text-emerald-400 border-emerald-400/20 bg-emerald-400/5 shadow-emerald-400/10",
              title: "Virtual Nesting Folders",
              desc: "Telegram storage is natively flat. DriftDeck reconstructs dynamic multi-layered folder configurations."
            },
            {
              icon: <RefreshCw className="w-5 h-5 animate-spin-slow" />,
              color: "text-sky-400 border-sky-400/20 bg-sky-400/5 shadow-sky-400/10",
              title: "Accelerated Linker Sync",
              desc: "Multi-threaded upload architecture routes binary payloads directly to Telegram channels via API."
            },
            {
              icon: <Palette className="w-5 h-5" />,
              color: "text-amber-400 border-amber-400/20 bg-amber-400/5 shadow-amber-400/10",
              title: "5 Dynamic Layout Themes",
              desc: "Hot-swap between Neon Cyberpunk, Midnight Glass, Crimson Void, Aurora, or Solar Gold with hotkeys."
            },
            {
              icon: <Shield className="w-5 h-5" />,
              color: "text-rose-500 border-rose-500/20 bg-rose-500/5 shadow-rose-500/10",
              title: "Progressive PWA Install",
              desc: "Convert your workspace into an isolated desktop app or mobile utility for instant access."
            }
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-2xl glass-panel border border-border/40 hover:border-primary/40 hover:scale-[1.01] hover:shadow-lg transition-all group">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform ${feature.color}`}>
                {feature.icon}
              </div>
              <h3 className="text-base font-bold mb-2 font-mono text-foreground">{feature.title}</h3>
              <p className="text-muted text-xs leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works / Walkthrough Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 relative z-10 border-t border-border/15 bg-black/10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-foreground font-mono">
            DRIFT DECK WORKFLOW
          </h2>
          <p className="text-muted text-sm max-w-xl mx-auto">
            Zero configuration. Secure. Link, encrypt, and navigate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
          {[
            {
              num: "01",
              title: "Establish Authentication",
              desc: "Authenticating with our Telegram Bot or the Login Widget creates your unique cloud endpoint."
            },
            {
              num: "02",
              title: "Client-Side Crypt Engine",
              desc: "Create an optional Master Password. DriftDeck initializes local cryptography inside your browser storage."
            },
            {
              num: "03",
              title: "Store & Orchestrate",
              desc: "Drag-and-drop binaries, create custom notes, code, or ask the AI to query files from your secure terminal."
            }
          ].map((step, i) => (
            <div key={i} className="relative p-6 glass-panel rounded-2xl border-border/30 hover:border-accent/40 transition-colors text-left group">
              <div className="text-4xl font-black font-mono text-primary/30 group-hover:text-primary transition-colors mb-4">
                {step.num}
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-2 font-mono text-foreground">{step.title}</h3>
              <p className="text-muted text-xs leading-relaxed">{step.desc}</p>
              
              {/* Connector line for desktop */}
              {i < 2 && <div className="hidden md:block step-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* Install App Section */}
      <section id="install-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 relative z-10 border-t border-border/15">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4 text-foreground font-mono">
            NATIVE DESKTOP & MOBILE APP
          </h2>
          <p className="text-muted text-sm max-w-xl mx-auto font-mono">
            Experience DriftDeck as a standalone desktop console or mobile utility. No browser tabs, no distractions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Card 1: Features / Benefits of PWA */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl glass-panel border border-border/40 bg-card/10 backdrop-blur-md flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-mono text-primary uppercase tracking-widest">NATIVE ENGINE</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-mono mb-4 text-foreground">
                STANDALONE PROGRESSIVE WEB APP
              </h3>
              <p className="text-muted text-xs sm:text-sm leading-relaxed mb-6">
                DriftDeck leverages advanced service worker architectures to bypass standard browser restrictions. Enjoy full hardware acceleration, dedicated dock launcher icons, and frameless operation.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {[
                  { title: "Standalone Window", desc: "Launches in a clean container without browser navigation elements." },
                  { title: "Launch from Desktop", desc: "Adds launcher icons directly to your desktop dock or phone home screen." },
                  { title: "Direct Cache Sync", desc: "Enables caching protocols for lighting-fast dashboard load times." },
                  { title: "Instant Access", desc: "One-click launch to access your Telegram cloud assets instantly." },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-foreground font-mono">{item.title}</h4>
                      <p className="text-[11px] text-muted leading-tight mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Install trigger area */}
            <div className="pt-4 border-t border-border/10 flex flex-col sm:flex-row items-center gap-4">
              {installAvailable ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm bg-primary hover:bg-primary-hover text-white transition-all shadow-[0_0_20px_var(--primary-glow)] active:scale-95 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 animate-bounce" />
                  <span>Install App on this Device</span>
                </button>
              ) : (
                <div className="w-full text-center sm:text-left text-xs font-mono text-muted bg-black/30 border border-border/20 rounded-xl p-3">
                  💡 App install signature ready. To install manually, open browser options and click <span className="text-foreground font-bold">"Add to Home Screen"</span> or <span className="text-foreground font-bold">"Install DriftDeck"</span>.
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Interactive Installer Instructions */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl glass-panel border border-border/40 bg-black/30 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-accent uppercase tracking-wider mb-4 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-accent" /> INSTALLATION METHODS
              </h3>
              
              <div className="flex flex-col gap-4">
                {[
                  {
                    browser: "Google Chrome & Edge",
                    steps: "Click the install icon in the address bar or open settings (three dots) and select 'Install Drift Deck'."
                  },
                  {
                    browser: "Apple Safari (iOS/macOS)",
                    steps: "Tap the share button (square with arrow up) at the bottom/top of the screen and select 'Add to Home Screen'."
                  },
                  {
                    browser: "Mozilla Firefox",
                    steps: "Open browser settings and select 'Install' or click 'Add to Home Screen' from the menu bar."
                  }
                ].map((inst, idx) => (
                  <div key={idx} className="p-3 bg-card/30 rounded-xl border border-border/10">
                    <h4 className="text-xs font-bold text-foreground font-mono flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" /> {inst.browser}
                    </h4>
                    <p className="text-[11px] text-muted leading-relaxed mt-1">{inst.steps}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <p className="text-[10px] text-muted font-mono leading-relaxed mt-6 text-center lg:text-left">
              * Fully compatible with iOS PWA engine, Android Chrome, Windows/macOS Chrome, Edge and Safari.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Theme Switcher Sandbox */}
      <section id="themes" className="max-w-7xl mx-auto px-4 sm:px-6 py-20 relative z-10 border-t border-border/15">
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-border/40 bg-card/20 backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="absolute inset-0 bg-gradient-radial from-accent/5 to-transparent pointer-events-none" />
          
          <div className="max-w-md text-left z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 mb-4">
              <Palette className="w-3.5 h-3.5 text-accent animate-pulse" />
              <span className="text-[10px] font-mono text-accent uppercase tracking-widest">VISUAL ENGINE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-mono mb-3 leading-tight">
              HOT-SWAP ENVIRONMENT THEMES
            </h2>
            <p className="text-muted text-xs leading-relaxed">
              Experiment with cyberpunk aesthetics. Click any palette swatch below to apply the color profiles globally across your screen.
            </p>
          </div>

          {/* Swatches selector */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 z-10 w-full md:w-auto">
            {THEMES.map((t) => {
              const active = theme === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`px-4 py-3 rounded-xl border font-mono text-xs font-bold transition-all flex items-center justify-between sm:justify-start gap-2.5 relative overflow-hidden active:scale-95 flex-1 sm:flex-none ${
                    active
                      ? "border-primary text-foreground bg-primary/10 shadow-[0_0_15px_var(--primary-glow)]"
                      : "border-border/60 text-muted hover:border-muted-foreground hover:text-foreground bg-card/40"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full bg-gradient-to-r ${t.bgClass} flex-shrink-0`} />
                  <span>{t.label}</span>
                  {active && <CheckCircle className="w-3.5 h-3.5 text-primary ml-auto sm:ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Premium Footer with Social Profiles */}
      <footer className="border-t border-border/15 bg-black/60 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Logo & description */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-black/50 border border-border flex items-center justify-center">
                <img src="/logo.png" alt="DriftDeck Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-mono text-base font-black tracking-widest text-foreground">
                DRIFT DECK
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted max-w-sm font-mono mt-1">
              Limitless zero-knowledge data orchestrator. Operating in 2026.
            </p>
          </div>

          {/* Social Links and Developer Credit */}
          <div className="flex flex-col items-center md:items-end gap-4">
            <span className="text-xs font-mono font-bold text-muted uppercase tracking-widest">
              DEVELOPED BY <span className="text-foreground glow-text">ARPIT BAJPAI</span>
            </span>
            
            {/* Social Icons row */}
            <div className="flex items-center gap-3">
              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/in/arpit-bajpai-6780aa220/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="LinkedIn Profile"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com/arpit0381"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="GitHub Profile"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/arpitexplores/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                aria-label="Instagram Profile"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Legal copyright footer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-8 text-center text-[10px] text-muted font-mono tracking-widest">
          DRIFT DECK CLOUD WORKSPACE // DESIGNED IN 2026 // ALL RIGHTS RESERVED
        </div>
      </footer>
    </div>
  );
}
