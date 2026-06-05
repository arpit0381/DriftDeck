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
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
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

export default function Sidebar({ activeTab, setActiveTab, masterKey, onSetupKey, isMobileOpen, onCloseMobile }: SidebarProps) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={onCloseMobile}
        />
      )}
      
      <aside
        className={`w-64 bg-card/95 border-r border-border p-4 flex-col justify-between flex-shrink-0 absolute md:relative z-50 h-full transition-transform duration-300 ${
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        } flex`}
      >
        <div>
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center glow-border overflow-hidden bg-black/50">
            <img src="/logo.png" alt="DriftDeck" className="w-full h-full object-cover" />
          </div>
          <span className="font-mono text-lg font-black tracking-widest text-foreground glow-text">
            DRIFT DECK
          </span>
        </div>

        <nav className="flex flex-col gap-1.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full h-10 rounded-xl flex items-center px-4 gap-3 text-sm font-semibold transition-all ${
                activeTab === item.id
                  ? "bg-primary/20 text-primary border border-primary/30 glow-border"
                  : "hover:bg-card-foreground/10 text-muted hover:text-foreground"
              }`}
            >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      </div>

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
    </>
  );
}
