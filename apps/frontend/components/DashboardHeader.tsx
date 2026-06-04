"use client";

import { ChevronRight, Palette, Terminal, User, LogOut } from "lucide-react";
import { ActiveTab, ThemeType } from "../lib/store";
import { Folder } from "@drift-deck/types";

interface DashboardHeaderProps {
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  username?: string;
  activeTab: ActiveTab;
  folderPath: Folder[];
  setCurrentFolderId: (id: string | null) => void;
  onLogout: () => void;
}

const THEMES: { value: ThemeType; label: string }[] = [
  { value: "neon-cyberpunk", label: "Neon Cyberpunk" },
  { value: "midnight-glass", label: "Midnight Glass" },
  { value: "crimson-void", label: "Crimson Void" },
  { value: "aurora-green", label: "Aurora Green" },
  { value: "solar-gold", label: "Solar Gold" },
];

export default function DashboardHeader({
  theme,
  setTheme,
  username,
  activeTab,
  folderPath,
  setCurrentFolderId,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between relative z-20 backdrop-blur-md flex-shrink-0">
      <div className="flex items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 glow-border">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <span className="font-mono text-sm font-black tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent glow-text">
            DRIFT DECK
          </span>
        </div>

        {/* Breadcrumbs for file explorer */}
        {activeTab === "files" && (
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-muted">
            <button
              onClick={() => setCurrentFolderId(null)}
              className="hover:text-primary transition-colors"
            >
              Root
            </button>
            {folderPath.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2">
                <ChevronRight className="w-3 h-3" />
                <span
                  className={
                    idx === folderPath.length - 1
                      ? "text-foreground"
                      : "hover:text-primary transition-colors cursor-pointer"
                  }
                >
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Theme selector */}
        <div className="flex items-center gap-2 glass-panel py-1.5 px-3 rounded-full border-border">
          <Palette className="w-3.5 h-3.5 text-primary" />
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeType)}
            className="bg-transparent text-xs font-bold outline-none border-none cursor-pointer text-foreground pr-2"
          >
            {THEMES.map((t) => (
              <option key={t.value} value={t.value} className="bg-background text-foreground">
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* User badge */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          {username && (
            <span className="hidden sm:inline text-xs font-semibold text-foreground">
              @{username}
            </span>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all hover:scale-105 active:scale-95"
          title="Log Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
