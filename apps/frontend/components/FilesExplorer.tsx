"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Folder,
  FolderPlus,
  Plus,
  Search,
  Eye,
  Download,
  Star,
  Trash2,
  Edit,
  FolderInput,
  X,
  Check,
  MoreVertical,
  Lock,
  ChevronDown,
  Info,
  Filter,
  CheckSquare,
  Square,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  HardDrive,
} from "lucide-react";
import { FileMetadata, Folder as FolderType } from "@drift-deck/types";
import { formatBytes } from "@drift-deck/utils";
import { useAppStore } from "../lib/store";
import * as api from "../lib/api";

interface FilesExplorerProps {
  files: FileMetadata[];
  folders: FolderType[];
  currentFolderId: string | null;
  onOpenFolder: (folder: FolderType) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteFile: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onDownloadFile: (id: string, name: string) => void;
  onPreviewFile: (id: string, mimeType: string) => void;
  onCreateFolder: (name: string, color: string) => void;
  onRenameFolder: (id: string, name: string, color?: string) => void;
  onDeleteFolder: (id: string) => void;
  onRenameFile: (id: string, name: string) => void;
  onMoveFile: (id: string, folderId: string | null) => void;
}

const FOLDER_COLORS = [
  "#3b82f6", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6",
  "#ef4444", "#06b6d4", "#f97316",
];

// Helper to fetch images live in the grid view
function FileCardThumbnail({ file, token }: { file: FileMetadata; token: string | null }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!file.mimeType.startsWith("image/") || !token) return;

    if (token === "demo_jwt_token_driftdeck_2026") {
      setSrc("/logo.png");
      return;
    }

    let active = true;
    fetch(api.getFileDownloadUrl(file.id), { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        if (active) setSrc(URL.createObjectURL(blob));
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [file.id, file.mimeType, token]);

  if (file.mimeType.startsWith("image/")) {
    if (src) {
      return <img src={src} alt={file.name} className="w-full h-full object-cover" />;
    }
    return <FileImage className="text-pink-500 w-8 h-8 opacity-40 animate-pulse" />;
  }

  if (file.mimeType.startsWith("video/")) return <FileVideo className="text-purple-500 w-8 h-8" />;
  if (file.mimeType.startsWith("audio/")) return <FileAudio className="text-cyan-500 w-8 h-8" />;
  if (file.mimeType.includes("pdf")) return <FileText className="text-red-500 w-8 h-8" />;
  return <FileCode className="text-emerald-500 w-8 h-8" />;
}

export default function FilesExplorer({
  files,
  folders,
  currentFolderId,
  onOpenFolder,
  onUpload,
  onDeleteFile,
  onToggleFavorite,
  onDownloadFile,
  onPreviewFile,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onRenameFile,
  onMoveFile,
}: FilesExplorerProps) {
  const {
    viewMode,
    setViewMode,
    detailsPanelOpen,
    setDetailsPanelOpen,
    selectedItemIds,
    setSelectedItemIds,
    toggleSelectedItem,
    clearSelection,
    token,
    historyStack,
    historyIndex,
    navigateHistoryBack,
    navigateHistoryForward,
  } = useAppStore();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all"); // 'all' | 'images' | 'videos' | 'audio' | 'docs'
  const [sortBy, setSortBy] = useState<"name" | "size" | "created">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modals state
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);

  const [renameItem, setRenameItem] = useState<{ id: string; name: string; type: "file" | "folder"; color?: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const [moveItem, setMoveItem] = useState<{ id: string; name: string } | null>(null);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; id: string; type: "file" | "folder"; isFavorite: boolean; mimeType?: string } | null>(null);

  // Active folder menu inside Explorer
  const [activeFolderMenuId, setActiveFolderMenuId] = useState<string | null>(null);
  const [activeFileMenuId, setActiveFileMenuId] = useState<string | null>(null);

  // Listen for custom trigger events from Details Panel
  useEffect(() => {
    const handleRenameFileEvent = (e: any) => {
      const fileId = e.detail?.id;
      const file = files.find((f) => f.id === fileId);
      if (file) {
        setRenameItem({ id: file.id, name: file.name, type: "file" });
        setRenameValue(file.name);
      }
    };

    const handleRenameFolderEvent = (e: any) => {
      const folderObj = e.detail?.folder;
      if (folderObj) {
        setRenameItem({ id: folderObj.id, name: folderObj.name, type: "folder", color: folderObj.color });
        setRenameValue(folderObj.name);
      }
    };

    const handleMoveFileEvent = (e: any) => {
      const fileId = e.detail?.id;
      const file = files.find((f) => f.id === fileId);
      if (file) {
        setMoveItem({ id: file.id, name: file.name });
      }
    };

    window.addEventListener("trigger-rename-file", handleRenameFileEvent);
    window.addEventListener("trigger-rename-folder", handleRenameFolderEvent);
    window.addEventListener("trigger-move-file", handleMoveFileEvent);

    return () => {
      window.removeEventListener("trigger-rename-file", handleRenameFileEvent);
      window.removeEventListener("trigger-rename-folder", handleRenameFolderEvent);
      window.removeEventListener("trigger-move-file", handleMoveFileEvent);
    };
  }, [files]);

  // Clean clicks close menus
  useEffect(() => {
    const closeAll = () => {
      setContextMenu(null);
      setActiveFolderMenuId(null);
      setActiveFileMenuId(null);
    };
    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, []);

  // Filter & Sort
  const visibleFolders = folders.filter(
    (f) =>
      f.parentFolderId === currentFolderId &&
      (search === "" || f.name.toLowerCase().includes(search.toLowerCase()))
  );

  const visibleFiles = files.filter((f) => {
    if (f.folderId !== currentFolderId || f.isInTrash) return false;

    // Category check
    if (categoryFilter === "images" && !f.mimeType.startsWith("image/")) return false;
    if (categoryFilter === "videos" && !f.mimeType.startsWith("video/")) return false;
    if (categoryFilter === "audio" && !f.mimeType.startsWith("audio/")) return false;
    if (categoryFilter === "docs" && !f.mimeType.includes("pdf") && !f.mimeType.startsWith("text/")) return false;

    // Search check
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;

    return true;
  });

  // Sort logic
  const sortedFiles = [...visibleFiles].sort((a, b) => {
    let diff = 0;
    if (sortBy === "name") diff = a.name.localeCompare(b.name);
    else if (sortBy === "size") diff = a.size - b.size;
    else if (sortBy === "created") diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

    return sortOrder === "asc" ? diff : -diff;
  });

  const sortedFolders = [...visibleFolders].sort((a, b) => {
    const diff = a.name.localeCompare(b.name);
    return sortOrder === "asc" ? diff : -diff;
  });

  // Handlers
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), newFolderColor);
    setNewFolderName("");
    setShowCreateFolder(false);
  };

  const handleRenameSubmit = () => {
    if (!renameItem || !renameValue.trim()) return;
    if (renameItem.type === "file") {
      onRenameFile(renameItem.id, renameValue.trim());
    } else {
      onRenameFolder(renameItem.id, renameValue.trim(), renameItem.color);
    }
    setRenameItem(null);
  };

  const handleMoveSubmit = (targetFolderId: string | null) => {
    if (!moveItem) return;
    onMoveFile(moveItem.id, targetFolderId);
    setMoveItem(null);
    clearSelection();
  };

  const handleContextMenu = (e: React.MouseEvent, item: any, type: "file" | "folder") => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      id: item.id,
      type,
      isFavorite: item.isFavorite,
      mimeType: item.mimeType,
    });
  };

  // Selection toggles
  const handleItemSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSelectedItem(id);
  };

  const handleSelectAll = () => {
    const allIds = [...sortedFolders.map(f => f.id), ...sortedFiles.map(f => f.id)];
    if (selectedItemIds.length === allIds.length) {
      clearSelection();
    } else {
      setSelectedItemIds(allIds);
    }
  };

  const handleSort = (field: "name" | "size" | "created") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <motion.div
      key="files"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col gap-5 min-h-[75vh]"
    >
      {/* ─── TOOLBAR (Finder & Drive inspired) ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-card/40 p-3 rounded-2xl border border-border/10 backdrop-blur-md">
        {/* Navigation History */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-black/30 border border-border/10 rounded-xl p-1">
            <button
              onClick={navigateHistoryBack}
              disabled={historyIndex === 0}
              className="p-1.5 rounded-lg hover:bg-border/30 text-muted disabled:opacity-30 disabled:pointer-events-none hover:text-foreground transition-all"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={navigateHistoryForward}
              disabled={historyIndex >= historyStack.length - 1}
              className="p-1.5 rounded-lg hover:bg-border/30 text-muted disabled:opacity-30 disabled:pointer-events-none hover:text-foreground transition-all"
              title="Forward"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 ml-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowCreateFolder(true);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/25 text-primary text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
            >
              <FolderPlus className="w-4 h-4" /> New Folder
            </button>
            <label className="px-3.5 py-1.5 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/25 text-accent text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95">
              <Plus className="w-4 h-4" /> Upload
              <input type="file" onChange={onUpload} className="hidden" multiple />
            </label>
          </div>
        </div>

        {/* Filters and Searches */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search directory..."
              className="w-44 sm:w-56 h-9 bg-card border border-border/20 rounded-xl px-9 text-xs outline-none focus:border-primary/50 transition-colors text-foreground"
            />
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-2.5" />
          </div>

          {/* View Toggles */}
          <div className="flex items-center bg-black/30 border border-border/10 rounded-xl p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-primary/20 text-primary" : "text-muted hover:text-foreground"}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-primary/20 text-primary" : "text-muted hover:text-foreground"}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {/* Toggle details sidebar */}
          <button
            onClick={() => setDetailsPanelOpen(!detailsPanelOpen)}
            className={`p-2 rounded-xl border transition-all ${detailsPanelOpen ? "bg-accent/10 border-accent/35 text-accent" : "bg-card border-border/20 text-muted hover:text-foreground"}`}
            title="Toggle Inspector"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── CATEGORY FILTER PILLS ───────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-muted font-bold mr-1.5 flex items-center gap-1">
          <Filter className="w-3 h-3 text-primary" /> Filter:
        </span>
        {[
          { id: "all", label: "All Assets" },
          { id: "images", label: "Images" },
          { id: "videos", label: "Videos" },
          { id: "audio", label: "Audio" },
          { id: "docs", label: "Documents" },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
              categoryFilter === cat.id
                ? "bg-primary text-white border-transparent shadow-md shadow-primary/15"
                : "bg-card/50 border-border/20 text-muted hover:text-foreground hover:bg-card"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* ─── LIST VIEW RENDERING ─────────────────────────────────────────────── */}
      {viewMode === "list" && (
        <div className="glass-panel rounded-2xl border-border/30 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/25 text-[10px] font-mono tracking-wider text-muted grid grid-cols-12 gap-2 bg-black/25">
            <div className="col-span-10 sm:col-span-6 flex items-center gap-3">
              <button onClick={handleSelectAll} className="text-muted hover:text-foreground transition-colors">
                {selectedItemIds.length > 0 && selectedItemIds.length === (sortedFolders.length + sortedFiles.length) ? (
                  <CheckSquare className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
              </button>
              <span onClick={() => handleSort("name")} className="cursor-pointer hover:text-foreground transition-colors flex items-center gap-1 select-none uppercase">
                Name {sortBy === "name" && (sortOrder === "asc" ? "▲" : "▼")}
              </span>
            </div>
            <span onClick={() => handleSort("size")} className="hidden sm:block sm:col-span-2 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1 select-none uppercase">
              Size {sortBy === "size" && (sortOrder === "asc" ? "▲" : "▼")}
            </span>
            <span className="hidden md:block md:col-span-2 uppercase">Type</span>
            <span className="hidden sm:block sm:col-span-1 uppercase">Encryption</span>
            <span className="col-span-2 sm:col-span-1 text-center uppercase">Actions</span>
          </div>

          {/* Folders in List */}
          {sortedFolders.map((folder) => {
            const isSelected = selectedItemIds.includes(folder.id);
            return (
              <div
                key={folder.id}
                onContextMenu={(e) => handleContextMenu(e, folder, "folder")}
                className={`px-4 py-2.5 border-b border-border/10 grid grid-cols-12 gap-2 text-xs font-semibold hover:bg-primary/5 items-center transition-colors cursor-pointer ${isSelected ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
                onClick={() => {
                  setSelectedItemIds([folder.id]);
                  onOpenFolder(folder);
                }}
              >
                <div className="col-span-10 sm:col-span-6 flex items-center gap-3 min-w-0">
                  <button
                    onClick={(e) => handleItemSelect(folder.id, e)}
                    className="text-muted hover:text-foreground transition-all flex-shrink-0"
                  >
                    {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-primary" /> : <Square className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />}
                  </button>
                  <Folder className="w-4 h-4 flex-shrink-0" style={{ color: folder.color || "#3b82f6" }} />
                  <span className="truncate text-foreground font-bold">{folder.name}</span>
                </div>
                <span className="hidden sm:block sm:col-span-2 text-muted">—</span>
                <span className="hidden md:block md:col-span-2 text-muted">Folder</span>
                <span className="hidden sm:block sm:col-span-1 text-muted">—</span>
                <div className="col-span-2 sm:col-span-1 flex justify-center relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveFolderMenuId(activeFolderMenuId === folder.id ? null : folder.id);
                    }}
                    className="p-1 rounded-lg hover:bg-border/30 text-muted hover:text-foreground transition-all"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  <AnimatePresence>
                    {activeFolderMenuId === folder.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-7 z-30 glass-panel border-border rounded-xl py-1.5 w-32 shadow-xl"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setRenameItem({ id: folder.id, name: folder.name, type: "folder", color: folder.color });
                            setRenameValue(folder.name);
                            setActiveFolderMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-left hover:bg-primary/10 flex items-center gap-2 text-foreground"
                        >
                          <Edit className="w-3.5 h-3.5 text-primary" /> Rename
                        </button>
                        <button
                          onClick={() => {
                            onDeleteFolder(folder.id);
                            setActiveFolderMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-left hover:bg-red-500/10 flex items-center gap-2 text-red-400 font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}

          {/* Files in List */}
          {sortedFiles.map((file) => {
            const isSelected = selectedItemIds.includes(file.id);
            return (
              <div
                key={file.id}
                onContextMenu={(e) => handleContextMenu(e, file, "file")}
                className={`px-4 py-3.5 border-b border-border/10 grid grid-cols-12 gap-2 text-xs font-semibold hover:bg-primary/5 items-center transition-colors cursor-pointer ${isSelected ? "bg-primary/10 border-l-2 border-l-primary" : ""}`}
                onClick={() => {
                  setSelectedItemIds([file.id]);
                  onPreviewFile(file.id, file.mimeType);
                }}
              >
                <div className="col-span-10 sm:col-span-6 flex items-center gap-3 min-w-0">
                  <button
                    onClick={(e) => handleItemSelect(file.id, e)}
                    className="text-muted hover:text-foreground transition-all flex-shrink-0"
                  >
                    {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-primary" /> : <Square className="w-3.5 h-3.5 opacity-40 hover:opacity-100" />}
                  </button>
                  {file.mimeType.startsWith("image/") ? <FileImage className="text-pink-500 w-4 h-4 flex-shrink-0" /> :
                   file.mimeType.startsWith("video/") ? <FileVideo className="text-purple-500 w-4 h-4 flex-shrink-0" /> :
                   file.mimeType.startsWith("audio/") ? <FileAudio className="text-cyan-500 w-4 h-4 flex-shrink-0" /> :
                   file.mimeType.includes("pdf") ? <FileText className="text-red-500 w-4 h-4 flex-shrink-0" /> :
                   <FileCode className="text-emerald-500 w-4 h-4 flex-shrink-0" />}
                  <span className="truncate text-foreground font-bold">{file.name}</span>
                  {file.isFavorite && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
                </div>
                <span className="hidden sm:block sm:col-span-2 text-muted font-mono">{formatBytes(file.size)}</span>
                <span className="hidden md:block md:col-span-2 text-muted truncate">{file.mimeType.split("/")[1]?.toUpperCase() || "FILE"}</span>
                <span className="hidden sm:block sm:col-span-1">
                  {file.isEncrypted ? (
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <Lock className="w-3 h-3" /> AES
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </span>
                <div className="col-span-2 sm:col-span-1 flex justify-center relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveFileMenuId(activeFileMenuId === file.id ? null : file.id);
                    }}
                    className="p-1 rounded-lg hover:bg-border/30 text-muted hover:text-foreground transition-all"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                  <AnimatePresence>
                    {activeFileMenuId === file.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute right-0 top-7 z-30 glass-panel border-border rounded-xl py-1.5 w-36 shadow-xl"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            onPreviewFile(file.id, file.mimeType);
                            setActiveFileMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-left hover:bg-primary/10 flex items-center gap-2 text-foreground"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" /> Preview
                        </button>
                        <button
                          onClick={() => {
                            onDownloadFile(file.id, file.name);
                            setActiveFileMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-left hover:bg-primary/10 flex items-center gap-2 text-foreground"
                        >
                          <Download className="w-3.5 h-3.5 text-primary" /> Download
                        </button>
                        <button
                          onClick={() => {
                            onToggleFavorite(file.id, file.isFavorite);
                            setActiveFileMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-left hover:bg-primary/10 flex items-center gap-2 text-foreground"
                        >
                          <Star className={`w-3.5 h-3.5 ${file.isFavorite ? "text-yellow-400 fill-yellow-400" : "text-muted"}`} />
                          {file.isFavorite ? "Starred" : "Star"}
                        </button>
                        <button
                          onClick={() => {
                            setRenameItem({ id: file.id, name: file.name, type: "file" });
                            setRenameValue(file.name);
                            setActiveFileMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-left hover:bg-primary/10 flex items-center gap-2 text-foreground"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-400" /> Rename
                        </button>
                        <button
                          onClick={() => {
                            setMoveItem({ id: file.id, name: file.name });
                            setActiveFileMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-left hover:bg-primary/10 flex items-center gap-2 text-foreground"
                        >
                          <FolderInput className="w-3.5 h-3.5 text-accent" /> Move File
                        </button>
                        <button
                          onClick={() => {
                            onDeleteFile(file.id);
                            setActiveFileMenuId(null);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-left hover:bg-red-500/10 flex items-center gap-2 text-red-400 font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Trash
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}

          {sortedFiles.length === 0 && sortedFolders.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center text-muted">
              <Folder className="w-12 h-12 mb-3 opacity-25" />
              <p className="text-sm font-semibold">Folder is empty</p>
            </div>
          )}
        </div>
      )}

      {/* ─── GRID VIEW RENDERING ─────────────────────────────────────────────── */}
      {viewMode === "grid" && (
        <div className="flex flex-col gap-6">
          {/* Folders Row */}
          {sortedFolders.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-mono font-semibold tracking-wider text-muted uppercase">Folders</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {sortedFolders.map((folder) => {
                  const isSelected = selectedItemIds.includes(folder.id);
                  return (
                    <div
                      key={folder.id}
                      onContextMenu={(e) => handleContextMenu(e, folder, "folder")}
                      onClick={() => {
                        setSelectedItemIds([folder.id]);
                        onOpenFolder(folder);
                      }}
                      className={`glass-panel p-4 rounded-2xl border-border/30 hover:border-primary/40 cursor-pointer transition-all flex items-center justify-between group relative select-none ${isSelected ? "ring-2 ring-primary/65 border-transparent bg-primary/10" : ""}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Folder className="w-6 h-6 flex-shrink-0" style={{ color: folder.color || "#3b82f6" }} />
                        <span className="text-xs font-bold text-foreground truncate">{folder.name}</span>
                      </div>
                      
                      <button
                        onClick={(e) => handleItemSelect(folder.id, e)}
                        className={`absolute top-2 right-2 text-muted hover:text-foreground transition-all z-10 ${isSelected ? "block" : "hidden group-hover:block"}`}
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 text-primary fill-background" /> : <Square className="w-4 h-4 opacity-40 hover:opacity-100" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Files Row */}
          {sortedFiles.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-mono font-semibold tracking-wider text-muted uppercase">Files</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {sortedFiles.map((file) => {
                  const isSelected = selectedItemIds.includes(file.id);
                  return (
                    <div
                      key={file.id}
                      onContextMenu={(e) => handleContextMenu(e, file, "file")}
                      onClick={() => {
                        setSelectedItemIds([file.id]);
                        onPreviewFile(file.id, file.mimeType);
                      }}
                      className={`glass-panel rounded-2xl border-border/30 overflow-hidden hover:border-primary/40 transition-all flex flex-col group relative select-none ${isSelected ? "ring-2 ring-primary/65 border-transparent bg-primary/10" : ""}`}
                    >
                      {/* Selection Toggle */}
                      <button
                        onClick={(e) => handleItemSelect(file.id, e)}
                        className={`absolute top-2 left-2 text-muted hover:text-foreground transition-all z-20 ${isSelected ? "block" : "hidden group-hover:block"}`}
                      >
                        {isSelected ? <CheckSquare className="w-4.5 h-4.5 text-primary fill-background" /> : <Square className="w-4.5 h-4.5 opacity-60 hover:opacity-100" />}
                      </button>

                      {/* Favorite star */}
                      {file.isFavorite && (
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 absolute top-2.5 right-2.5 z-10 shadow-sm" />
                      )}

                      {/* Card Cover (Thumbnail container) */}
                      <div className="h-28 bg-black/30 flex items-center justify-center border-b border-border/10 relative overflow-hidden">
                        <FileCardThumbnail file={file} token={token} />
                        
                        {/* ZK lock badge overlay */}
                        {file.isEncrypted && (
                          <div className="absolute bottom-2 right-2 bg-emerald-500/80 backdrop-blur-sm text-[9px] font-bold text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> AES-256
                          </div>
                        )}
                      </div>

                      {/* Card info */}
                      <div className="p-3.5 flex flex-col gap-1">
                        <span className="text-xs font-bold text-foreground truncate break-all" title={file.name}>
                          {file.name}
                        </span>
                        <div className="flex items-center justify-between text-[10px] text-muted font-mono">
                          <span>{formatBytes(file.size)}</span>
                          <span className="uppercase">{file.mimeType.split("/")[1] || "FILE"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {sortedFiles.length === 0 && sortedFolders.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center text-muted">
              <Folder className="w-12 h-12 mb-3 opacity-25" />
              <p className="text-sm font-semibold">Folder is empty</p>
            </div>
          )}
        </div>
      )}


      {/* ─── FLOATING RIGHT-CLICK CONTEXT MENU ─────────────────────────────────── */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ 
              top: contextMenu.y, 
              left: typeof window !== "undefined" ? Math.min(contextMenu.x, window.innerWidth - 170) : contextMenu.x 
            }}
            className="fixed z-50 w-40 bg-card/95 border border-border rounded-xl py-1.5 shadow-2xl backdrop-blur-md"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {contextMenu.type === "file" && (
              <>
                <button
                  onClick={() => {
                    if (contextMenu.mimeType) onPreviewFile(contextMenu.id, contextMenu.mimeType);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-left hover:bg-cyan-500/10 flex items-center gap-2 text-foreground"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" /> Preview
                </button>
                <button
                  onClick={() => {
                    const f = files.find(x => x.id === contextMenu.id);
                    if (f) onDownloadFile(f.id, f.name);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-left hover:bg-primary/10 flex items-center gap-2 text-foreground"
                >
                  <Download className="w-3.5 h-3.5 text-primary" /> Download
                </button>
                <button
                  onClick={() => {
                    onToggleFavorite(contextMenu.id, contextMenu.isFavorite);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-left hover:bg-primary/10 flex items-center gap-2 text-foreground"
                >
                  <Star className="w-3.5 h-3.5 text-yellow-400" /> Favorite
                </button>
                <button
                  onClick={() => {
                    const f = files.find(x => x.id === contextMenu.id);
                    if (f) {
                      setRenameItem({ id: f.id, name: f.name, type: "file" });
                      setRenameValue(f.name);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-left hover:bg-primary/10 flex items-center gap-2 text-foreground"
                >
                  <Edit className="w-3.5 h-3.5 text-amber-400" /> Rename
                </button>
                <button
                  onClick={() => {
                    const f = files.find(x => x.id === contextMenu.id);
                    if (f) setMoveItem({ id: f.id, name: f.name });
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-left hover:bg-primary/10 flex items-center gap-2 text-foreground"
                >
                  <FolderInput className="w-3.5 h-3.5 text-accent" /> Move File
                </button>
                <button
                  onClick={() => {
                    onDeleteFile(contextMenu.id);
                    setContextMenu(null);
                    clearSelection();
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-left hover:bg-red-500/10 flex items-center gap-2 text-red-400 font-bold border-t border-border/10 mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Move to Trash
                </button>
              </>
            )}

            {contextMenu.type === "folder" && (
              <>
                <button
                  onClick={() => {
                    const f = folders.find(x => x.id === contextMenu.id);
                    if (f) onOpenFolder(f);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-left hover:bg-primary/10 flex items-center gap-2 text-foreground"
                >
                  <Folder className="w-3.5 h-3.5 text-primary" /> Open
                </button>
                <button
                  onClick={() => {
                    const f = folders.find(x => x.id === contextMenu.id);
                    if (f) {
                      setRenameItem({ id: f.id, name: f.name, type: "folder", color: f.color });
                      setRenameValue(f.name);
                    }
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-left hover:bg-primary/10 flex items-center gap-2 text-foreground"
                >
                  <Edit className="w-3.5 h-3.5 text-amber-400" /> Rename
                </button>
                <button
                  onClick={() => {
                    onDeleteFolder(contextMenu.id);
                    setContextMenu(null);
                    clearSelection();
                  }}
                  className="w-full px-3 py-2 text-xs font-semibold text-left hover:bg-red-500/10 flex items-center gap-2 text-red-400 font-bold border-t border-border/10 mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Folder
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: CREATE FOLDER ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateFolder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-5 rounded-2xl border-border max-w-sm w-full flex flex-col gap-4"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">New Folder</span>
                <button onClick={() => setShowCreateFolder(false)} className="text-muted hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                placeholder="Folder name..."
                className="h-9 bg-card border border-border/20 rounded-xl px-3 text-xs outline-none focus:border-primary/50 text-foreground"
              />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold text-muted uppercase">Color:</span>
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewFolderColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${newFolderColor === c ? "border-white scale-125 shadow-md" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <button
                  onClick={() => setShowCreateFolder(false)}
                  className="px-4 py-2 rounded-xl bg-border/20 hover:bg-border/40 font-bold text-xs text-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover font-bold text-xs text-white transition-all flex items-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" /> Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: RENAME ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {renameItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-5 rounded-2xl border-border max-w-sm w-full flex flex-col gap-4"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Rename {renameItem.type === "file" ? "File" : "Folder"}</span>
                <button onClick={() => setRenameItem(null)} className="text-muted hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                autoFocus
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
                className="h-9 bg-card border border-border/20 rounded-xl px-3 text-xs outline-none focus:border-primary/50 text-foreground"
              />
              <div className="flex gap-2 justify-end mt-2">
                <button
                  onClick={() => setRenameItem(null)}
                  className="px-4 py-2 rounded-xl bg-border/20 hover:bg-border/40 font-bold text-xs text-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameSubmit}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover font-bold text-xs text-white transition-all flex items-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── MODAL: MOVE FILE ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {moveItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-5 rounded-2xl border-border max-w-sm w-full flex flex-col gap-4 max-h-[75vh]"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border/10 pb-2">
                <span className="text-sm font-bold text-foreground">Move "{moveItem.name}" to:</span>
                <button onClick={() => setMoveItem(null)} className="text-muted hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Folder list selector */}
              <div className="flex flex-col gap-1 overflow-y-auto max-h-60 pr-1 py-1">
                {/* Root Directory */}
                <button
                  onClick={() => handleMoveSubmit(null)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all hover:bg-primary/15 ${currentFolderId === null ? "bg-card border border-border/10" : ""}`}
                >
                  <HardDrive className="w-4 h-4 text-primary" /> Root Directory
                </button>
                
                {folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleMoveSubmit(f.id)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all hover:bg-primary/15 ${currentFolderId === f.id ? "bg-card border border-border/10" : ""}`}
                  >
                    <Folder className="w-4 h-4" style={{ color: f.color || "#3b82f6" }} /> {f.name}
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-2 border-t border-border/10 mt-1">
                <button
                  onClick={() => setMoveItem(null)}
                  className="px-4 py-2 rounded-xl bg-border/20 hover:bg-border/40 font-bold text-xs text-muted transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
