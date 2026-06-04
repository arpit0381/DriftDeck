"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Folder,
  FileText,
  Sparkles,
  Settings as SettingsIcon,
  ArrowUpRight,
  Lock,
  Palette,
  Terminal,
  FileImage,
  FolderOpen,
  RefreshCw,
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

// Telegram bot username extracted from token (format: botId:hash)
const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "DriftDeckBot";

declare global {
  interface Window {
    TelegramLoginCallback?: (user: TelegramAuthData) => void;
  }
}

function TelegramLoginWidget({ onLogin }: { onLogin: (data: TelegramAuthData) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Register global callback that Telegram widget calls
    window.TelegramLoginCallback = onLogin;

    // Remove any old script
    const oldScript = document.getElementById("telegram-login-script");
    if (oldScript) oldScript.remove();

    // Inject Telegram Login Widget script
    const script = document.createElement("script");
    script.id = "telegram-login-script";
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "TelegramLoginCallback(user)");
    script.setAttribute("data-request-access", "write");
    script.async = true;

    containerRef.current.appendChild(script);

    return () => {
      delete window.TelegramLoginCallback;
      script.remove();
    };
  }, [onLogin]);

  return (
    <div ref={containerRef} className="flex justify-center min-h-[52px] items-center" />
  );
}

export default function LandingPage({
  theme,
  setTheme,
  onDemoLogin,
  onTelegramLogin,
  loading,
}: LandingPageProps) {
  return (
    <div className="relative min-h-screen text-slate-100 overflow-hidden font-sans bg-[#06060c]">
      {/* Glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-500/10 blur-[120px] pointer-events-none" />

      {/* Theme picker */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2 glass-panel p-2 rounded-full border-slate-800">
        <Palette className="w-4 h-4 text-indigo-400 ml-2" />
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as ThemeType)}
          className="bg-transparent text-sm font-semibold outline-none border-none pr-3 cursor-pointer text-slate-200"
        >
          {THEMES.map((t) => (
            <option key={t.value} value={t.value} className="bg-slate-950 text-slate-200">
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 glow-border">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <span className="font-mono text-xl font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
            DRIFT DECK
          </span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
          <a href="#security" className="hover:text-indigo-400 transition-colors">Security</a>
          <a href="#themes" className="hover:text-indigo-400 transition-colors">Themes</a>
        </nav>
        <button
          onClick={onDemoLogin}
          disabled={loading}
          className="relative px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white transition-all shadow-lg shadow-indigo-500/25 active:scale-95 group overflow-hidden disabled:opacity-60"
        >
          <span className="relative z-10 flex items-center gap-2">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            {loading ? "Loading..." : "Try Demo"}
            {!loading && <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
          </span>
        </button>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 mb-8 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-300 tracking-wider uppercase font-mono">
            Next-Generation Telegram Cloud Workspace
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black tracking-tight max-w-4xl leading-tight mb-8"
        >
          Futuristic Cloud Storage Meets{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 glow-text">
            Cyberpunk Productive OS
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10"
        >
          Store files seamlessly using Telegram as a zero-cost backend layer, encrypted
          end-to-end client-side. Integrated with Notion-style docs and floating AI models.
        </motion.p>

        {/* CTA block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-center gap-5 w-full max-w-sm mb-20"
        >
          {/* Telegram Login Widget */}
          <div className="w-full">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 font-mono text-center">
              Sign in with your Telegram account
            </p>
            <TelegramLoginWidget onLogin={onTelegramLogin} />
          </div>

          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600 font-mono">or</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          <button
            onClick={onDemoLogin}
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 font-bold rounded-xl transition-all text-slate-300 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-indigo-400" />}
            {loading ? "Launching..." : "Try Interactive Demo"}
          </button>
        </motion.div>

        {/* Dashboard preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }}
          className="w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-950/80 p-3 shadow-2xl relative"
        >
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-transparent to-pink-500/20 blur-xl pointer-events-none" />
          <div className="w-full h-[440px] rounded-xl border border-slate-800/80 bg-slate-950 overflow-hidden relative flex flex-col shadow-inner">
            <div className="h-10 bg-slate-900/90 border-b border-slate-800/80 px-4 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs font-mono text-slate-500">DRIFT DECK OS // VER 2.0</div>
              <div className="w-4 h-4 rounded-full bg-indigo-500/20" />
            </div>
            <div className="flex-1 flex overflow-hidden">
              <div className="w-48 bg-slate-900/50 border-r border-slate-800/80 p-4 flex flex-col gap-2">
                {[
                  { icon: <Folder className="w-4 h-4 text-indigo-400" />, label: "My Drive", active: true },
                  { icon: <FileText className="w-4 h-4 text-slate-500" />, label: "Notes", active: false },
                  { icon: <Sparkles className="w-4 h-4 text-slate-500" />, label: "AI Engine", active: false },
                  { icon: <SettingsIcon className="w-4 h-4 text-slate-500" />, label: "Settings", active: false },
                ].map((item) => (
                  <div key={item.label} className={`h-8 rounded-lg flex items-center px-3 gap-2 ${item.active ? "bg-indigo-500/20" : "hover:bg-slate-800/30"}`}>
                    {item.icon}
                    <span className={`text-xs font-semibold ${item.active ? "text-indigo-200" : "text-slate-400"}`}>{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex-1 p-6 flex flex-col gap-5">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "TOTAL FILES", value: "12,504", color: "text-slate-200" },
                    { label: "ENCRYPTED", value: "100%", color: "text-pink-500" },
                    { label: "STORAGE COST", value: "$0.00", color: "text-emerald-500" },
                  ].map((c) => (
                    <div key={c.label} className="h-24 glass-panel rounded-xl p-4 border-slate-800/60 flex flex-col justify-between">
                      <div className="text-xs text-slate-500 font-semibold font-mono">{c.label}</div>
                      <div className={`text-2xl font-black ${c.color}`}>{c.value}</div>
                    </div>
                  ))}
                </div>
                <div className="flex-1 glass-panel rounded-xl border-slate-800/60 p-4 flex flex-col gap-3">
                  <div className="text-xs font-mono text-slate-500 border-b border-slate-800/40 pb-2">ACTIVE STORAGE STACK</div>
                  {[
                    { icon: <FileText className="w-4 h-4 text-indigo-400" />, name: "financial_ledger_2026.pdf" },
                    { icon: <FileImage className="w-4 h-4 text-pink-400" />, name: "hologram_core.png" },
                  ].map((f) => (
                    <div key={f.name} className="flex items-center justify-between border-b border-slate-900 pb-2">
                      <div className="flex items-center gap-3">{f.icon}<span className="text-xs font-semibold">{f.name}</span></div>
                      <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1"><Lock className="w-3 h-3" /> AES-256</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-slate-900">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Masterfully Crafted Core Integrations</h2>
          <p className="text-slate-400 max-w-xl mx-auto">Everything you need to orchestrate zero-knowledge secure document workspaces.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Lock className="w-6 h-6" />,
              cls: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
              title: "Zero-Knowledge Cryptography",
              desc: "AES-256 client-side encryption before upload. Your keys never leave your browser.",
            },
            {
              icon: <Sparkles className="w-6 h-6" />,
              cls: "bg-pink-500/10 border-pink-500/30 text-pink-400",
              title: "Neural Semantic Search",
              desc: "Summarize PDFs, query large datasets, retrieve files using AI within floating chat portals.",
            },
            {
              icon: <FolderOpen className="w-6 h-6" />,
              cls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
              title: "Virtual Folder System",
              desc: "Telegram stores files flat. Drift Deck builds nested virtual directories via Supabase.",
            },
          ].map((f) => (
            <div key={f.title} className="glass-panel p-8 rounded-2xl border-slate-800/80 hover:border-indigo-500/30 transition-all group">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${f.cls}`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-100">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-900 py-12 text-center text-xs text-slate-600 font-mono relative z-10">
        DRIFT DECK CLOUD WORKSPACE // DESIGNED IN 2026 // ALL RIGHTS RESERVED
      </footer>
    </div>
  );
}
