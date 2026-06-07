"use client";

import { motion } from "framer-motion";
import {
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  Info,
  Folder,
  Lock,
  Calendar,
  HardDrive,
  ExternalLink,
  Activity,
  Download,
  Star,
  Trash2,
  Edit,
  FolderInput,
  ChevronRight,
  Shield,
  Eye,
} from "lucide-react";
import { FileMetadata, Folder as FolderType } from "@drift-deck/types";
import { formatBytes } from "@drift-deck/utils";
import { useAppStore } from "../lib/store";

interface InspectorPanelProps {
  activities: any[];
  onDownloadFile: (id: string, name: string) => void;
  onPreviewFile: (id: string, mime: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string) => void;
  onMoveFile: (id: string) => void;
  onRenameFolder: (folder: FolderType) => void;
  onDeleteFolder: (id: string) => void;
}

function MimeIcon({ mime }: { mime: string }) {
  if (mime.startsWith("image/")) return <FileImage className="text-pink-500 w-10 h-10" />;
  if (mime.startsWith("video/")) return <FileVideo className="text-purple-500 w-10 h-10" />;
  if (mime.startsWith("audio/")) return <FileAudio className="text-cyan-500 w-10 h-10" />;
  if (mime.includes("pdf")) return <FileText className="text-red-500 w-10 h-10" />;
  return <FileCode className="text-emerald-500 w-10 h-10" />;
}

export default function InspectorPanel({
  activities,
  onDownloadFile,
  onPreviewFile,
  onToggleFavorite,
  onDeleteFile,
  onRenameFile,
  onMoveFile,
  onRenameFolder,
  onDeleteFolder,
}: InspectorPanelProps) {
  const {
    files,
    folders,
    selectedItemIds,
    detailsPanelOpen,
    setDetailsPanelOpen,
  } = useAppStore();

  if (!detailsPanelOpen) return null;

  // Identify what is selected
  // We can select files or folders. Let's look for match in files first, then folders
  const selectedFiles = files.filter(f => selectedItemIds.includes(f.id));
  const selectedFolders = folders.filter(f => selectedItemIds.includes(f.id));
  const totalSelectedCount = selectedFiles.length + selectedFolders.length;

  const isSingleFile = selectedFiles.length === 1 && selectedFolders.length === 0;
  const isSingleFolder = selectedFolders.length === 1 && selectedFiles.length === 0;
  const isMultiSelect = totalSelectedCount > 1;

  const selectedFile = isSingleFile ? selectedFiles[0] : null;
  const selectedFolder = isSingleFolder ? selectedFolders[0] : null;

  // Cumulative statistics for folders
  const getFolderStats = (folderId: string) => {
    const childFiles = files.filter(f => f.folderId === folderId && !f.isInTrash);
    const totalSize = childFiles.reduce((sum, f) => sum + f.size, 0);
    return { count: childFiles.length, size: totalSize };
  };

  // Categories storage breakdown when nothing is selected
  const nonTrashedFiles = files.filter(f => !f.isInTrash);
  const totalSize = nonTrashedFiles.reduce((sum, f) => sum + f.size, 0);
  const totalFiles = nonTrashedFiles.length;

  const categories = nonTrashedFiles.reduce(
    (acc, f) => {
      if (f.mimeType.startsWith("image/")) acc.images += f.size;
      else if (f.mimeType.startsWith("video/")) acc.videos += f.size;
      else if (f.mimeType.startsWith("audio/")) acc.audio += f.size;
      else if (f.mimeType.includes("pdf") || f.mimeType.startsWith("text/")) acc.docs += f.size;
      else acc.others += f.size;
      return acc;
    },
    { images: 0, videos: 0, audio: 0, docs: 0, others: 0 }
  );

  return (
    <motion.aside
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 100 }}
      className="w-full sm:w-80 bg-background md:bg-card border-l border-border h-full flex flex-col flex-shrink-0 absolute md:relative right-0 top-0 z-30 shadow-2xl md:shadow-none overflow-hidden"
    >
      {/* Header */}
      <div className="h-16 px-5 border-b border-border/30 flex items-center justify-between bg-card/50">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">Inspector</span>
        </div>
        <button
          onClick={() => setDetailsPanelOpen(false)}
          className="text-xs text-muted hover:text-foreground font-semibold px-2 py-1 rounded-lg hover:bg-border/30 transition-colors"
        >
          Hide
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        {/* Scenario 1: Single File Selected */}
        {selectedFile && (
          <div className="flex flex-col gap-5">
            {/* File Icon Container */}
            <div className="glass-panel p-6 rounded-2xl border-border flex flex-col items-center justify-center relative group">
              <MimeIcon mime={selectedFile.mimeType} />
              <span className="text-xs font-bold text-center mt-3 text-foreground break-all max-w-[200px]">
                {selectedFile.name}
              </span>
              <span className="text-[10px] text-muted font-mono mt-1">
                {selectedFile.mimeType.split("/")[1]?.toUpperCase() || "FILE"}
              </span>
            </div>

            {/* Quick action grid */}
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => onPreviewFile(selectedFile.id, selectedFile.mimeType)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-card hover:bg-border/30 text-muted hover:text-foreground transition-all"
                title="Preview"
              >
                <Eye className="w-4 h-4 text-cyan-400" />
                <span className="text-[9px] font-bold">Preview</span>
              </button>
              <button
                onClick={() => onDownloadFile(selectedFile.id, selectedFile.name)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-card hover:bg-border/30 text-muted hover:text-foreground transition-all"
                title="Download"
              >
                <Download className="w-4 h-4 text-primary" />
                <span className="text-[9px] font-bold">Download</span>
              </button>
              <button
                onClick={() => onToggleFavorite(selectedFile.id, selectedFile.isFavorite)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-card hover:bg-border/30 text-muted hover:text-foreground transition-all"
                title="Favorite"
              >
                <Star className={`w-4 h-4 ${selectedFile.isFavorite ? "text-yellow-400 fill-yellow-400" : ""}`} />
                <span className="text-[9px] font-bold">{selectedFile.isFavorite ? "Starred" : "Star"}</span>
              </button>
              <button
                onClick={() => onDeleteFile(selectedFile.id)}
                className="flex flex-col items-center gap-1 p-2 rounded-xl bg-card hover:bg-red-500/10 text-muted hover:text-red-400 transition-all"
                title="Trash"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span className="text-[9px] font-bold">Delete</span>
              </button>
            </div>

            {/* Edit details */}
            <div className="flex gap-2">
              <button
                onClick={() => onRenameFile(selectedFile.id)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" /> Rename
              </button>
              <button
                onClick={() => onMoveFile(selectedFile.id)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent border border-accent/25 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5"
              >
                <FolderInput className="w-3.5 h-3.5" /> Move
              </button>
            </div>

            {/* File properties */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider font-mono">Properties</span>
              <div className="flex flex-col gap-2 bg-black/20 p-3 rounded-xl border border-border/10 text-xs">
                <div className="flex justify-between py-1 border-b border-border/5">
                  <span className="text-muted">Size</span>
                  <span className="font-semibold text-foreground font-mono">{formatBytes(selectedFile.size)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/5">
                  <span className="text-muted">Created</span>
                  <span className="font-semibold text-foreground">{new Date(selectedFile.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/5">
                  <span className="text-muted">Encryption</span>
                  <span className={`font-bold flex items-center gap-1 ${selectedFile.isEncrypted ? "text-emerald-400" : "text-muted"}`}>
                    <Shield className="w-3 h-3" />
                    {selectedFile.isEncrypted ? "AES-256 (Local)" : "None"}
                  </span>
                </div>
              </div>
            </div>

            {/* Telegram storage details */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider font-mono">Telegram Backend</span>
              </div>
              <div className="flex flex-col gap-2 bg-black/20 p-3 rounded-xl border border-border/10 text-xs font-mono">
                <div className="flex justify-between py-0.5">
                  <span className="text-muted">Message ID</span>
                  <span className="font-semibold text-foreground">{selectedFile.telegramMessageId || "Seeded"}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-muted">Channel ID</span>
                  <span className="font-semibold text-foreground truncate max-w-[120px]">{selectedFile.telegramChannelId || "Seeded"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scenario 2: Single Folder Selected */}
        {selectedFolder && (
          <div className="flex flex-col gap-5">
            {/* Folder Icon Container */}
            <div className="glass-panel p-6 rounded-2xl border-border flex flex-col items-center justify-center relative">
              <Folder
                className="w-12 h-12"
                style={{ color: selectedFolder.color || "#3b82f6" }}
              />
              <span className="text-sm font-bold text-center mt-3 text-foreground truncate max-w-[200px]">
                {selectedFolder.name}
              </span>
              <span className="text-[10px] text-muted font-mono mt-1">
                DIRECTORY
              </span>
            </div>

            {/* Folder Operations */}
            <div className="flex gap-2">
              <button
                onClick={() => onRenameFolder(selectedFolder)}
                className="flex-1 py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5"
              >
                <Edit className="w-3.5 h-3.5" /> Rename
              </button>
              <button
                onClick={() => onDeleteFolder(selectedFolder.id)}
                className="flex-1 py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>

            {/* Folder properties */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider font-mono">Properties</span>
              <div className="flex flex-col gap-2 bg-black/20 p-3 rounded-xl border border-border/10 text-xs">
                <div className="flex justify-between py-1 border-b border-border/5">
                  <span className="text-muted">Contains</span>
                  <span className="font-semibold text-foreground font-mono">{getFolderStats(selectedFolder.id).count} files</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/5">
                  <span className="text-muted">Total Size</span>
                  <span className="font-semibold text-foreground font-mono">{formatBytes(getFolderStats(selectedFolder.id).size)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted">Created</span>
                  <span className="font-semibold text-foreground">{new Date(selectedFolder.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scenario 3: Multiple Items Selected */}
        {isMultiSelect && (
          <div className="flex flex-col gap-5">
            <div className="glass-panel p-6 rounded-2xl border-border flex flex-col items-center justify-center relative">
              <HardDrive className="w-12 h-12 text-accent" />
              <span className="text-sm font-bold text-center mt-3 text-foreground">
                {totalSelectedCount} Items Selected
              </span>
              <span className="text-xs text-muted font-mono mt-1">
                {selectedFiles.length} files · {selectedFolders.length} folders
              </span>
            </div>

            {/* Cumulative properties */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider font-mono">Selection Stats</span>
              <div className="flex flex-col gap-2 bg-black/20 p-3 rounded-xl border border-border/10 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-muted">Total size</span>
                  <span className="font-semibold text-foreground font-mono">
                    {formatBytes(selectedFiles.reduce((sum, f) => sum + f.size, 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Mass actions */}
            <button
              onClick={() => {
                selectedFiles.forEach((file) => onDeleteFile(file.id));
                // Clear selection
                useAppStore.getState().clearSelection();
              }}
              className="py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" /> Move All to Trash
            </button>
          </div>
        )}

        {/* Scenario 4: Nothing Selected - Storage Breakdown & Activity Log */}
        {!selectedFile && !selectedFolder && !isMultiSelect && (
          <div className="flex flex-col gap-6">
            {/* Storage Distribution */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider font-mono">Storage Breakdown</span>
              
              <div className="flex flex-col gap-3 bg-black/25 p-4 rounded-xl border border-border/15">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-foreground">Cloud Used</span>
                  <span className="text-lg font-black text-primary font-mono">{formatBytes(totalSize)}</span>
                </div>
                
                {/* Horizontal cumulative bar */}
                <div className="h-2.5 bg-border/20 rounded-full flex overflow-hidden">
                  <div
                    style={{ width: `${totalSize > 0 ? (categories.images / totalSize) * 100 : 0}%` }}
                    className="h-full bg-pink-500"
                    title="Images"
                  />
                  <div
                    style={{ width: `${totalSize > 0 ? (categories.videos / totalSize) * 100 : 0}%` }}
                    className="h-full bg-purple-500"
                    title="Videos"
                  />
                  <div
                    style={{ width: `${totalSize > 0 ? (categories.docs / totalSize) * 100 : 0}%` }}
                    className="h-full bg-emerald-500"
                    title="Documents"
                  />
                  <div
                    style={{ width: `${totalSize > 0 ? (categories.audio / totalSize) * 100 : 0}%` }}
                    className="h-full bg-cyan-500"
                    title="Audio"
                  />
                  <div
                    style={{ width: `${totalSize > 0 ? (categories.others / totalSize) * 100 : 0}%` }}
                    className="h-full bg-slate-500"
                    title="Others"
                  />
                </div>

                {/* Legend list */}
                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-muted mt-1">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-pink-500" />
                    <span className="truncate">Images ({formatBytes(categories.images)})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="truncate">Videos ({formatBytes(categories.videos)})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="truncate">Docs ({formatBytes(categories.docs)})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    <span className="truncate">Audio ({formatBytes(categories.audio)})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Stream */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-1.5 border-b border-border/10 pb-2">
                <Activity className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider font-mono">Recent Activity</span>
              </div>
              
              <div className="flex flex-col gap-3.5 max-h-[300px] pr-0.5 overflow-y-auto">
                {activities.length === 0 ? (
                  <span className="text-[11px] text-muted italic text-center py-4">No recent activity.</span>
                ) : (
                  activities.map((act) => {
                    const relativeTime = new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={act.id} className="flex gap-2.5 items-start text-[11px]">
                        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-primary">
                          <Activity className="w-3 h-3" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-foreground font-semibold leading-snug">
                            {act.type === "UPLOAD" && "Uploaded file"}
                            {act.type === "DOWNLOAD" && "Downloaded file"}
                            {act.type === "DELETE" && "Deleted file"}
                            {act.type === "RESTORE" && "Restored file"}
                            {act.type === "SHARE" && "Created share link"}
                            {act.type === "EDIT_NOTE" && "Edited text note"}
                          </span>
                          <span className="text-[10px] text-muted">{relativeTime}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
