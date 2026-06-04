"use client";

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
} from "lucide-react";
import { ThemeType } from "../lib/store";

interface LandingPageProps {
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  onDemoLogin: () => void;
  loading: boolean;
}

const THEMES: { value: ThemeType; label: string }[] = [
  { value: "neon-cyberpunk", label: "Neon Cyberpunk" },
  { value: "midnight-glass", label: "Midnight Glass" },
  { value: "crimson-void", label: "Crimson Void" },
  { value: "aurora-green", label: "Aurora Green" },
  { value: "solar-gold", label: "Solar Gold" },
];

export default function LandingPage({ theme, setTheme, onDemoLogin, loading }: LandingPageProps) {
  return (
    <div className="relative min-h-screen text-slate-100 overflow-hidden font-sans bg-[#06060c]">
      {/* Glowing background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-pink-500/10 blur-[120px] pointer-events-none" />

      {/* Theme selector */}
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
          className="relative px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white transition-all shadow-lg shadow-indigo-500/25 active:scale-95 group overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 flex items-center gap-2">
            {loading ? "Launching..." : "Launch Dashboard"}
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </span>
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 mb-8 shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="text-xs font-semibold text-indigo-300 tracking-wider uppercase font-mono">
            Next-Generation Telegram Cloud Workspace
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black tracking-tight max-w-4xl leading-tight mb-8"
        >
          Futuristic Cloud Storage Meets{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 glow-text">
            Cyberpunk Productive OS
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed mb-12"
        >
          Store files seamlessly using Telegram as a zero-cost backend layer, encrypted
          end-to-end client-side. Integrated with Notion-style docs and floating AI models.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mb-20"
        >
          <button
            onClick={onDemoLogin}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 font-bold rounded-xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all text-white flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Get Started (Demo Login)"}
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 font-bold rounded-xl transition-all text-slate-300 flex items-center justify-center gap-2"
          >
            Explore Features
          </a>
        </motion.div>

        {/* Dashboard preview mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="w-full max-w-5xl rounded-2xl border border-slate-800 bg-slate-950/80 p-3 shadow-2xl relative"
        >
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-transparent to-pink-500/20 blur-xl pointer-events-none" />
          <div className="w-full h-[460px] rounded-xl border border-slate-800/80 bg-slate-950 overflow-hidden relative flex flex-col shadow-inner">
            <div className="h-10 bg-slate-900/90 border-b border-slate-800/80 px-4 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs font-mono text-slate-500">DRIFT DECK OS // VER 1.0.0</div>
              <div className="w-4 h-4 rounded-full bg-indigo-500/20" />
            </div>
            <div className="flex-1 flex overflow-hidden">
              <div className="w-48 bg-slate-900/50 border-r border-slate-800/80 p-4 flex flex-col gap-2">
                <div className="h-8 bg-indigo-500/20 rounded-lg flex items-center px-3 gap-2">
                  <Folder className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-indigo-200">My Drive</span>
                </div>
                {[
                  { icon: <FileText className="w-4 h-4 text-slate-500" />, label: "Notes" },
                  { icon: <Sparkles className="w-4 h-4 text-slate-500" />, label: "AI Engine" },
                  { icon: <SettingsIcon className="w-4 h-4 text-slate-500" />, label: "Settings" },
                ].map((item) => (
                  <div key={item.label} className="h-8 hover:bg-slate-800/30 rounded-lg flex items-center px-3 gap-2">
                    {item.icon}
                    <span className="text-xs font-semibold text-slate-400">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="flex-1 p-6 flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "TOTAL FILES", value: "12,504", color: "text-slate-200" },
                    { label: "ENCRYPTED", value: "100%", color: "text-pink-500" },
                    { label: "STORAGE COST", value: "$0.00", color: "text-emerald-500" },
                  ].map((card) => (
                    <div key={card.label} className="h-28 glass-panel rounded-xl p-4 border-slate-800/60 flex flex-col justify-between">
                      <div className="text-xs text-slate-500 font-semibold font-mono">{card.label}</div>
                      <div className={`text-3xl font-black ${card.color}`}>{card.value}</div>
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
                      <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> AES-256
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 relative z-10 border-t border-slate-900">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight mb-4">Masterfully Crafted Core Integrations</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Everything you need to orchestrate zero-knowledge secure document workspaces on the Telegram layer.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Lock className="w-6 h-6" />,
              bg: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
              title: "Zero-Knowledge Cryptography",
              desc: "AES-256 client-side file encryption before uploading to Telegram servers. Your keys stay in your browser.",
            },
            {
              icon: <Sparkles className="w-6 h-6" />,
              bg: "bg-pink-500/10 border-pink-500/30 text-pink-400",
              title: "Neural Semantic Search",
              desc: "Summarize PDF pages, query large datasets, and retrieve files using modern AI models within floating chat portals.",
            },
            {
              icon: <FolderOpen className="w-6 h-6" />,
              bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
              title: "Virtual Nesting Files",
              desc: "Telegram stores files flatly. Drift Deck builds a virtual nested folder system, cataloged inside Supabase databases.",
            },
          ].map((feat) => (
            <div key={feat.title} className="glass-panel p-8 rounded-2xl border-slate-800/80 hover:border-indigo-500/30 transition-all group">
              <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${feat.bg}`}>
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-100">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
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
