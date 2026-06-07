"use client";

import { useState } from "react";
import {
  TrendingUp,
  Folder,
  Star,
  FileText,
  Sparkles,
  Trash2,
  Settings as SettingsIcon,
  Lock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  HardDrive,
  FolderOpen,
} from "lucide-react";
import { ActiveTab, useAppStore } from "../lib/store";
import { Folder as FolderType } from "@drift-deck/types";
import { formatBytes } from "@drift-deck/utils";

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  masterKey: string | null;
  onSetupKey: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const NAV_ITEMS: { id: ActiveTab; label: string; icon: React.ComponentType<any> }[] = [
  { id: "dashboard", label: "Dashboard", icon: TrendingUp },
  { id: "files", label: "Files Explorer", icon: Folder },
  { id: "favorites", label: "Favorites", icon: Star },
  { id: "notes", label: "Notes OS", icon: FileText },
  { id: "ai", label: "AI Assistant", icon: Sparkles },
  { id: "trash", label: "Trash Bin", icon: Trash2 },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  masterKey,
  onSetupKey,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    folders,
    files,
    navigateToFolderWithHistory,
  } = useAppStore();

  const [foldersExpanded, setFoldersExpanded] = useState(true);

  // Compute folder path hierarchy recursively
  const getFolderPathForFolder = (folder: FolderType, allFolders: FolderType[]): FolderType[] => {
    const path: FolderType[] = [];
    let current: FolderType | undefined = folder;
    while (current) {
      path.unshift(current);
      const parentId: string | null | undefined = current.parentFolderId;
      current = parentId ? allFolders.find((f) => f.id === parentId) : undefined;
    }
    return path;
  };

  const handleSidebarFolderClick = (folder: FolderType) => {
    const path = getFolderPathForFolder(folder, folders);
    navigateToFolderWithHistory(folder.id, path);
    setActiveTab("files");
    if (onCloseMobile) onCloseMobile();
  };

  // Compute storage stats
  const totalSize = files.reduce((sum, f) => sum + (f.isInTrash ? 0 : f.size), 0);
  const totalFiles = files.filter((f) => !f.isInTrash).length;

  // Render Sidebar
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/70 backdrop-blur-md z-30 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`bg-background md:bg-card/95 backdrop-blur-2xl border-r border-border p-4 flex flex-col justify-between flex-shrink-0 absolute md:relative z-40 h-full transition-all duration-300 ${
          isMobileOpen
            ? "translate-x-0 w-64 shadow-2xl"
            : "-translate-x-full md:translate-x-0 " + (sidebarCollapsed ? "w-20" : "w-64")
        }`}
      >
        {/* Toggle Collapse Button (Desktop only) */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border items-center justify-center text-muted hover:text-foreground shadow-lg hover:border-primary/50 transition-colors z-50"
        >
          {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          {/* Logo Section */}
          <div className={`flex items-center gap-3 mb-8 px-2 ${sidebarCollapsed ? "justify-center" : ""}`}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center glow-border overflow-hidden bg-black/50 flex-shrink-0">
              <img src="/logo.png" alt="DriftDeck" className="w-full h-full object-cover" />
            </div>
            {!sidebarCollapsed && (
              <span className="font-mono text-lg font-black tracking-widest text-foreground glow-text truncate">
                DRIFT DECK
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 mb-6">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full h-10 rounded-xl flex items-center gap-3 text-sm font-semibold transition-all relative group ${
                    sidebarCollapsed ? "justify-center" : "px-4"
                  } ${
                    isSelected
                      ? "bg-primary/20 text-primary border border-primary/30 glow-border"
                      : "hover:bg-card-foreground/10 text-muted hover:text-foreground"
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                  {sidebarCollapsed && (
                    <div className="absolute left-16 bg-background border border-border text-foreground text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Folders Accordion (Google/Apple manager foldout) */}
          {!sidebarCollapsed && folders.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t border-border/20 pt-4 mb-4">
              <button
                onClick={() => setFoldersExpanded(!foldersExpanded)}
                className="flex items-center justify-between text-[10px] font-mono font-semibold tracking-wider text-muted uppercase px-2 hover:text-foreground transition-colors"
              >
                <span>Directories</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${foldersExpanded ? "" : "-rotate-90"}`} />
              </button>
              {foldersExpanded && (
                <div className="flex flex-col gap-0.5 pl-2 max-h-40 overflow-y-auto mt-1 scrollbar-thin">
                  {folders
                    .filter((f) => !f.parentFolderId) // show top-level folders in tree
                    .map((folder) => (
                      <button
                        key={folder.id}
                        onClick={() => handleSidebarFolderClick(folder)}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-card-foreground/5 text-muted hover:text-foreground transition-colors text-left text-xs font-semibold truncate"
                      >
                        <Folder className="w-3.5 h-3.5 flex-shrink-0" style={{ color: folder.color || "#3b82f6" }} />
                        <span className="truncate">{folder.name}</span>
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer widgets */}
        <div className="flex flex-col gap-3 flex-shrink-0">
          {/* Storage tracker widget (Finder/Drive style) */}
          <div className={`glass-panel p-3.5 rounded-xl border-border flex flex-col gap-2 ${sidebarCollapsed ? "items-center" : ""}`}>
            <div className="flex items-center justify-between w-full">
              {!sidebarCollapsed && (
                <span className="text-[9px] font-mono font-semibold tracking-wider text-muted uppercase">
                  Cloud Storage
                </span>
              )}
              <HardDrive className={`w-3.5 h-3.5 text-primary ${sidebarCollapsed ? "" : "opacity-75"}`} />
            </div>
            {!sidebarCollapsed ? (
              <div className="flex flex-col gap-1.5 w-full">
                <span className="text-xs font-bold text-foreground truncate">
                  {formatBytes(totalSize)} used
                </span>
                {/* Mock progress relative to 2GB upload size limit representing storage usage */}
                <div className="h-1.5 bg-border/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (totalSize / (1024 * 1024 * 2048)) * 100)}%` }}
                  />
                </div>
                <span className="text-[9px] text-muted font-bold font-mono">
                  ∞ Unlimited Telegram Node
                </span>
              </div>
            ) : (
              <div className="absolute left-16 bg-background border border-border text-foreground text-[10px] font-bold py-2 px-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 flex flex-col gap-1">
                <span>Storage: {formatBytes(totalSize)}</span>
                <span className="text-muted font-mono text-[9px]">∞ Unlimited Telegram Space</span>
              </div>
            )}
          </div>

          {/* Encryption status widget */}
          <div
            className={`glass-panel p-3.5 rounded-xl border-border flex flex-col gap-2 cursor-pointer hover:border-primary/40 transition-colors ${
              sidebarCollapsed ? "items-center" : ""
            }`}
            onClick={onSetupKey}
          >
            <div className="flex items-center justify-between w-full">
              {!sidebarCollapsed && (
                <span className="text-[9px] font-mono font-semibold tracking-wider text-muted uppercase">
                  Zero-Knowledge
                </span>
              )}
              <Lock
                className={`w-3.5 h-3.5 ${masterKey ? "text-emerald-400 animate-pulse" : "text-muted"}`}
              />
            </div>
            {!sidebarCollapsed ? (
              <span className={`text-[10px] font-bold truncate ${masterKey ? "text-emerald-400" : "text-primary"}`}>
                {masterKey ? "Keys Active" : "Setup Encryption Key →"}
              </span>
            ) : (
              <div className="absolute left-16 bg-background border border-border text-foreground text-[10px] font-bold py-1.5 px-2.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {masterKey ? "AES-256 Encryption Active" : "Setup Local Encryption"}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
