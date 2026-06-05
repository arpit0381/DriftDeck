"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Folder, FileText, Sparkles, Settings as SettingsIcon,
  ArrowUpRight, Lock, Palette, Terminal, FileImage,
  FolderOpen, RefreshCw, CheckCircle, Clock, Download,
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

const THEMES: { value: ThemeType; label: string }[] = [
  { value: "neon-cyberpunk", label: "Neon Cyberpunk" },
  { value: "midnight-glass", label: "Midnight Glass" },
  { value: "crimson-void", label: "Crimson Void" },
  { value: "aurora-green", label: "Aurora Green" },
  { value: "solar-gold", label: "Solar Gold" },
];

// ─── Telegram Login via Bot (/start deeplink + polling) ──────────────────────
// Works on localhost AND production — no domain restriction.
// Flow: User clicks → opens Telegram bot → sends /start <sessionId>
//       → backend creates account & stores JWT → frontend polls & auto-logs in

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

  return <div ref={containerRef} className="flex justify-center w-full" />;
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
      // Keep polling silently
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

  // Cleanup on unmount and handle mobile browser tab switching
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
      <div className="w-full py-3.5 rounded-xl flex items-center justify-center gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm">
        <CheckCircle className="w-5 h-5" />
        Authenticated! Loading dashboard...
      </div>
    );
  }

  if (step === "waiting") {
    return (
      <div className="w-full flex flex-col gap-3">
        <div className="w-full py-3.5 rounded-xl flex items-center justify-center gap-3 bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold text-sm">
          <Clock className="w-4 h-4 animate-pulse" />
          Waiting for Telegram confirmation...
        </div>
        <p className="text-[10px] text-slate-500 text-center font-mono leading-relaxed">
          The Telegram bot should have opened.<br />
          Send <span className="text-slate-400 font-bold">/start</span> to complete login.
        </p>
        <a
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors text-center block w-full"
        >
          Didn't open? Click here to open bot again →
        </a>
        <button
          onClick={() => { if (pollInterval) clearInterval(pollInterval); setStep("idle"); }}
          className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors text-center"
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
      className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-95 hover:scale-[1.01]"
      style={{
        background: "linear-gradient(135deg, #2ca5e0 0%, #1a8cc4 100%)",
        color: "#fff",
        boxShadow: "0 4px 20px rgba(44, 165, 224, 0.3)",
      }}
    >
      {/* Telegram icon */}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
      </svg>
      Sign in with Telegram
    </a>
  );
}

export default function LandingPage({
  theme, setTheme, onDemoLogin, onTelegramLogin, loading,
}: LandingPageProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
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
    }
  };

  const handleBotLogin = async (jwt: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
      const res = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error("Token validation failed");
      const { user, settings } = await res.json();
      onTelegramLogin({ ...user, _jwt: jwt } as any);
    } catch {
      alert("Login failed — please try again.");
    }
  };

  return (
    <div className="relative min-h-screen text-foreground overflow-hidden font-sans bg-background transition-colors duration-500">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center glow-border overflow-hidden bg-black/50">
            <img src="/logo.png" alt="DriftDeck Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-mono text-xl font-black tracking-widest text-foreground glow-text">
            DRIFT DECK
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#security" className="hover:text-primary transition-colors">Security</a>
          <a href="#themes" className="hover:text-primary transition-colors">Themes</a>
        </nav>
        <div className="flex items-center gap-3">
          {deferredPrompt && (
            <button
              onClick={handleInstallClick}
              className="hidden md:flex px-4 py-2.5 rounded-xl font-bold text-sm bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 transition-all shadow-lg active:scale-95 items-center gap-2"
            >
              <Download className="w-4 h-4" /> Install App
            </button>
          )}
          <button
            onClick={onDemoLogin}
            disabled={loading}
            className="relative px-6 py-2.5 rounded-xl font-bold text-sm bg-primary hover:bg-primary-hover text-white transition-all shadow-lg glow-border active:scale-95 disabled:opacity-60"
          >
            <span className="flex items-center gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Loading..." : <>Try Demo <ArrowUpRight className="w-4 h-4" /></>}
            </span>
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8"
        >
          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-xs font-semibold text-primary tracking-wider uppercase font-mono">
            Next-Generation Telegram Cloud Workspace
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black tracking-tight max-w-4xl leading-tight mb-8"
        >
          Futuristic Cloud Storage Meets{" "}
          <span className="text-primary glow-text">
            Cyberpunk Productive OS
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-muted max-w-2xl leading-relaxed mb-10"
        >
          Store files using Telegram as a zero-cost backend. Encrypted end-to-end client-side.
          Integrated with Notion-style docs and floating AI models.
        </motion.p>

        {/* Login CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col md:flex-row items-center gap-6 w-full max-w-3xl justify-center mb-20"
        >
          <div className="w-full md:w-1/2 p-4 glass-panel rounded-2xl border border-border">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-4 font-mono text-center">
              Login via Telegram Bot
            </p>
            <TelegramBotLogin onLogin={handleBotLogin} />
          </div>

          <div className="flex md:flex-col items-center gap-3 w-full md:w-auto opacity-50">
            <div className="flex-1 md:h-8 md:w-px h-px bg-border" />
            <span className="text-xs text-muted font-mono">OR</span>
            <div className="flex-1 md:h-8 md:w-px h-px bg-border" />
          </div>

          <div className="w-full md:w-1/2 p-4 glass-panel rounded-2xl border border-border flex flex-col items-center justify-center">
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-4 font-mono text-center">
              Official Telegram Widget
            </p>
            <TelegramLoginWidget onAuth={onTelegramLogin} />
          </div>
        </motion.div>

        <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto mb-20">
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted font-mono">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={onDemoLogin}
            disabled={loading}
            className="w-full py-3 bg-card hover:bg-card-foreground/10 border border-border font-bold rounded-xl transition-all text-foreground flex items-center justify-center gap-2 text-sm disabled:opacity-60"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />}
            {loading ? "Launching..." : "Try Interactive Demo (instant, no login)"}
          </button>
        </div>

        {/* Dashboard preview */}
        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }}
          className="w-full max-w-5xl rounded-3xl overflow-hidden glass-panel border border-border shadow-2xl relative"
        >
          <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
          {/* Mac-like header */}
          <div className="h-8 bg-card border-b border-border flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          {/* Dummy dashboard */}
          <div className="h-[400px] md:h-[600px] p-6 flex gap-6">
            <div className="w-64 hidden md:flex flex-col gap-4 border-r border-border pr-6 opacity-60">
              <div className="h-8 bg-card rounded-lg w-full mb-4 animate-pulse" />
              {[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-card rounded-lg w-full animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />)}
            </div>
            <div className="flex-1 flex flex-col gap-6">
              <div className="flex gap-4">
                <div className="h-32 flex-1 bg-card rounded-xl border border-border flex items-center justify-center glow-border opacity-80">
                  <Folder className="w-8 h-8 text-primary opacity-50" />
                </div>
                <div className="h-32 flex-1 bg-card rounded-xl border border-border flex items-center justify-center opacity-60">
                  <FileImage className="w-8 h-8 text-accent opacity-50" />
                </div>
                <div className="h-32 flex-1 hidden md:flex bg-card rounded-xl border border-border items-center justify-center opacity-60">
                  <FileText className="w-8 h-8 text-primary opacity-50" />
                </div>
              </div>
              <div className="flex-1 bg-card rounded-xl border border-border opacity-50" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-border">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight mb-4 text-foreground">Masterfully Crafted Core Integrations</h2>
          <p className="text-muted max-w-xl mx-auto">Everything you need to orchestrate zero-knowledge secure document workspaces.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Lock className="w-6 h-6" />, cls: "bg-primary/10 border-primary/30 text-primary", title: "Zero-Knowledge Cryptography", desc: "AES-256 client-side encryption before upload. Your keys never leave your browser." },
            { icon: <Sparkles className="w-6 h-6" />, cls: "bg-accent/10 border-accent/30 text-accent", title: "Neural Semantic Search", desc: "Summarize PDFs, query large datasets, retrieve files using AI within floating chat portals." },
            { icon: <FolderOpen className="w-6 h-6" />, cls: "bg-green-500/10 border-green-500/30 text-green-400", title: "Virtual Folder System", desc: "Telegram stores files flat. Drift Deck builds nested virtual directories via Supabase." },
          ].map((f) => (
            <div key={f.title} className="glass-panel p-8 rounded-2xl border-border hover:border-primary/50 transition-all group">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${f.cls}`}>{f.icon}</div>
              <h3 className="text-xl font-bold mb-3 text-foreground">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-12 text-center text-xs text-muted font-mono relative z-10">
        DRIFT DECK CLOUD WORKSPACE // DESIGNED IN 2026 // ALL RIGHTS RESERVED
      </footer>
    </div>
  );
}
