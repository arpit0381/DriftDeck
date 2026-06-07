"use client";

import { ChevronRight, Palette, Terminal, User, LogOut, Menu } from "lucide-react";
import { ActiveTab, ThemeType } from "../lib/store";
import { Folder } from "@drift-deck/types";

interface DashboardHeaderProps {
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  username?: string;
  activeTab: ActiveTab;
  folderPath: Folder[];
  onBreadcrumbClick: (id: string | null, path: Folder[]) => void;
  onLogout: () => void;
  onToggleMobileMenu?: () => void;
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
  onBreadcrumbClick,
  onLogout,
  onToggleMobileMenu,
}: DashboardHeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between relative z-20 backdrop-blur-md flex-shrink-0">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 -ml-2 rounded-lg text-muted hover:text-foreground hover:bg-border/30 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo (Visible only on mobile) */}
        <div className="flex md:hidden items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-black/50 flex items-center justify-center shadow-lg shadow-primary/20 glow-border overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Breadcrumbs for file explorer */}
        {activeTab === "files" && (
          <div className="flex items-center gap-2 text-xs font-semibold text-muted overflow-x-auto whitespace-nowrap scrollbar-none max-w-[150px] sm:max-w-xs md:max-w-none">
            <button
              onClick={() => onBreadcrumbClick(null, [])}
              className="hover:text-primary transition-colors hover:underline flex-shrink-0"
            >
              Root
            </button>
            {folderPath.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2 flex-shrink-0">
                <ChevronRight className="w-3 h-3 text-muted/50" />
                <button
                  onClick={() => idx < folderPath.length - 1 && onBreadcrumbClick(item.id, folderPath.slice(0, idx + 1))}
                  className={
                    idx === folderPath.length - 1
                      ? "text-foreground font-bold cursor-default"
                      : "hover:text-primary transition-colors hover:underline cursor-pointer"
                  }
                  disabled={idx === folderPath.length - 1}
                >
                  {item.name}
                </button>
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
