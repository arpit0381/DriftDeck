"use client";

import {
  TrendingUp,
  Folder,
  Star,
  FileText,
  Sparkles,
  Trash2,
  Settings as SettingsIcon,
  Lock,
} from "lucide-react";
import { ActiveTab } from "../lib/store";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  masterKey: string | null;
  onSetupKey: () => void;
}

const NAV_ITEMS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "files", label: "Files Explorer", icon: <Folder className="w-4 h-4" /> },
  { id: "favorites", label: "Favorites", icon: <Star className="w-4 h-4" /> },
  { id: "notes", label: "Notes OS", icon: <FileText className="w-4 h-4" /> },
  { id: "ai", label: "AI Assistant", icon: <Sparkles className="w-4 h-4" /> },
  { id: "trash", label: "Trash Bin", icon: <Trash2 className="w-4 h-4" /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon className="w-4 h-4" /> },
];

export default function Sidebar({ activeTab, setActiveTab, masterKey, onSetupKey }: SidebarProps) {
  return (
    <aside className="w-64 bg-card/60 border-r border-border p-4 flex-col justify-between hidden md:flex backdrop-blur-md flex-shrink-0">
      <nav className="flex flex-col gap-1.5">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full h-10 rounded-xl flex items-center px-4 gap-3 text-sm font-semibold transition-all ${
              activeTab === item.id
                ? "bg-primary/20 text-primary border border-primary/30 glow-border"
                : "hover:bg-slate-900/30 text-muted hover:text-foreground"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Encryption status widget */}
      <div className="glass-panel p-4 rounded-xl border-border flex flex-col gap-2 mt-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono font-semibold tracking-wider text-muted uppercase">
            Zero-Knowledge AES
          </span>
          <Lock
            className={`w-3.5 h-3.5 ${masterKey ? "text-emerald-400 animate-pulse" : "text-muted"}`}
          />
        </div>
        {masterKey ? (
          <span className="text-xs font-bold text-emerald-400">Keys derived successfully</span>
        ) : (
          <button
            onClick={onSetupKey}
            className="text-[11px] font-bold text-primary hover:text-primary/80 transition-colors text-left"
          >
            Setup Master Key →
          </button>
        )}
      </div>
    </aside>
  );
}
