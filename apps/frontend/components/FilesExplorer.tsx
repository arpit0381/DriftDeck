"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder,
  FolderPlus,
  Plus,
  Search,
  ChevronRight,
  FolderOpen,
  Lock,
  Download,
  Trash2,
  Star,
  MoreVertical,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  RefreshCw,
  Check,
  X,
} from "lucide-react";
import { FileMetadata, Folder as FolderType } from "@drift-deck/types";
import { formatBytes } from "@drift-deck/utils";

interface FilesExplorerProps {
  files: FileMetadata[];
  folders: FolderType[];
  currentFolderId: string | null;
  onOpenFolder: (folder: FolderType) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteFile: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onDownloadFile: (id: string, name: string) => void;
  onCreateFolder: (name: string, color: string) => void;
}

function MimeIcon({ mime }: { mime: string }) {
  if (mime.startsWith("image/")) return <FileImage className="text-pink-500 w-5 h-5 flex-shrink-0" />;
  if (mime.startsWith("video/")) return <FileVideo className="text-purple-500 w-5 h-5 flex-shrink-0" />;
  if (mime.startsWith("audio/")) return <FileAudio className="text-cyan-500 w-5 h-5 flex-shrink-0" />;
  if (mime.includes("pdf")) return <FileText className="text-red-500 w-5 h-5 flex-shrink-0" />;
  return <FileCode className="text-emerald-500 w-5 h-5 flex-shrink-0" />;
}

const FOLDER_COLORS = [
  "#3b82f6", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6",
  "#ef4444", "#06b6d4", "#f97316",
];

export default function FilesExplorer({
  files,
  folders,
  currentFolderId,
  onOpenFolder,
  onUpload,
  onDeleteFile,
  onToggleFavorite,
  onDownloadFile,
  onCreateFolder,
}: FilesExplorerProps) {
  const [search, setSearch] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLORS[0]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const visibleFolders = folders.filter((f) => f.parentFolderId === currentFolderId);

  const visibleFiles = files.filter(
    (f) =>
      f.folderId === currentFolderId &&
      !f.isInTrash &&
      (search === "" || f.name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), newFolderColor);
    setNewFolderName("");
    setShowCreateFolder(false);
  };

  return (
    <motion.div
      key="files"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col gap-6"
      onClick={() => setActiveMenuId(null)}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); setShowCreateFolder(true); }}
            className="px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-xs font-bold transition-all flex items-center gap-2 active:scale-95"
          >
            <FolderPlus className="w-4 h-4" /> New Folder
          </button>
          <label className="px-4 py-2 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/20 text-accent text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95">
            <Plus className="w-4 h-4" /> Add Files
            <input type="file" onChange={onUpload} className="hidden" multiple />
          </label>
        </div>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className="w-56 h-9 bg-card border border-border rounded-xl px-9 text-xs outline-none focus:border-primary/50 transition-colors text-foreground"
          />
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Create Folder modal */}
      <AnimatePresence>
        {showCreateFolder && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel p-5 rounded-xl border-border flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">New Folder</span>
              <button onClick={() => setShowCreateFolder(false)} className="text-muted hover:text-foreground transition-colors">
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
              className="h-9 bg-card border border-border rounded-xl px-3 text-xs outline-none focus:border-primary/50 text-foreground"
            />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold text-muted uppercase">Color:</span>
              {FOLDER_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewFolderColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${newFolderColor === c ? "border-white scale-125" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover font-bold text-xs text-white transition-all flex items-center gap-2"
              >
                <Check className="w-3.5 h-3.5" /> Create
              </button>
              <button
                onClick={() => setShowCreateFolder(false)}
                className="px-4 py-2 rounded-xl bg-border/20 hover:bg-border/40 font-bold text-xs text-muted transition-all"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Folders grid */}
      {visibleFolders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {visibleFolders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => onOpenFolder(folder)}
              className="glass-panel p-4 rounded-xl border-border hover:border-primary/30 cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Folder
                  className="w-5 h-5 flex-shrink-0 group-hover:scale-105 transition-transform"
                  style={{ color: folder.color || "#3b82f6" }}
                />
                <span className="text-xs font-bold text-foreground truncate">{folder.name}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* Files table */}
      <div className="glass-panel rounded-xl border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 text-[10px] font-mono tracking-wider text-muted grid grid-cols-12 gap-2">
          <span className="col-span-5 uppercase">File Name</span>
          <span className="col-span-2 uppercase">Size</span>
          <span className="col-span-2 uppercase">Type</span>
          <span className="col-span-2 uppercase">Encrypted</span>
          <span className="col-span-1 text-center uppercase">•••</span>
        </div>

        {visibleFiles.map((file) => (
          <div
            key={file.id}
            className="px-4 py-3.5 border-b border-border/10 grid grid-cols-12 gap-2 text-xs font-semibold hover:bg-primary/5 items-center transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="col-span-5 flex items-center gap-2 min-w-0">
              <MimeIcon mime={file.mimeType} />
              <span className="truncate text-foreground">{file.name}</span>
              {file.isFavorite && <Star className="w-3 h-3 text-yellow-400 flex-shrink-0 fill-yellow-400" />}
            </div>
            <span className="col-span-2 text-muted">{formatBytes(file.size)}</span>
            <span className="col-span-2 text-muted truncate">
              {file.mimeType.split("/")[1]?.toUpperCase() || "FILE"}
            </span>
            <span className="col-span-2 text-emerald-400 flex items-center gap-1">
              {file.isEncrypted ? (
                <><Lock className="w-3.5 h-3.5" /> AES-256</>
              ) : (
                <span className="text-muted font-normal">—</span>
              )}
            </span>
            <div className="col-span-1 flex justify-center relative">
              <button
                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === file.id ? null : file.id); }}
                className="p-1.5 rounded-lg hover:bg-border/30 text-muted hover:text-foreground transition-all"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {activeMenuId === file.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    className="absolute right-0 top-7 z-30 glass-panel border-border rounded-xl py-1.5 w-36 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { onDownloadFile(file.id, file.name); setActiveMenuId(null); }}
                      className="w-full px-3 py-2 text-xs font-semibold text-left hover:bg-primary/10 flex items-center gap-2 text-foreground transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-primary" /> Download
                    </button>
                    <button
                      onClick={() => { onToggleFavorite(file.id, file.isFavorite); setActiveMenuId(null); }}
                      className="w-full px-3 py-2 text-xs font-semibold text-left hover:bg-yellow-500/10 flex items-center gap-2 text-foreground transition-colors"
                    >
                      <Star className={`w-3.5 h-3.5 ${file.isFavorite ? "text-yellow-400 fill-yellow-400" : "text-muted"}`} />
                      {file.isFavorite ? "Unfavorite" : "Favorite"}
                    </button>
                    <button
                      onClick={() => { onDeleteFile(file.id); setActiveMenuId(null); }}
                      className="w-full px-3 py-2 text-xs font-semibold text-left hover:bg-red-500/10 flex items-center gap-2 text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Move to Trash
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {visibleFiles.length === 0 && (
          <div className="py-14 flex flex-col items-center justify-center text-center text-muted">
            <FolderOpen className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-xs">
              {search ? `No files match "${search}"` : "This folder is empty."}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
