"use client";

import { motion } from "framer-motion";
import { Check, Upload, RefreshCw } from "lucide-react";
import { FileMetadata, Folder } from "@drift-deck/types";
import { formatBytes } from "@drift-deck/utils";
import { FileStats } from "../lib/api";

interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "completed" | "failed";
}

interface DashboardHomeProps {
  files: FileMetadata[];
  folders: Folder[];
  uploadQueue: UploadItem[];
  stats: FileStats | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function DashboardHome({
  files,
  folders,
  uploadQueue,
  stats,
  onUpload,
}: DashboardHomeProps) {
  const totalSize = stats?.totalSize ?? files.reduce((s, f) => s + f.size, 0);
  const totalFiles = stats?.totalFiles ?? files.length;
  const activeUploads = uploadQueue.filter((u) => u.status === "uploading");

  return (
    <motion.div
      key="dashboard"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col gap-6"
    >
      {/* Top stats row */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Cloud capacity card */}
        <div className="flex-1 glass-panel p-6 rounded-2xl border-border flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold font-mono tracking-widest text-muted">
              TELEGRAM CLOUD STORAGE
            </span>
            <span className="text-3xl font-black text-foreground">{formatBytes(totalSize)}</span>
            <span className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> 100% Free Telegram Node
            </span>
          </div>
          <div className="w-20 h-20 rounded-full border-4 border-border flex items-center justify-center relative shadow-inner">
            <div className="absolute inset-1 rounded-full border-4 border-primary border-t-transparent animate-spin" style={{ animationDuration: "3s" }} />
            <span className="text-xs font-black font-mono text-foreground">
              {totalFiles}
            </span>
          </div>
        </div>

        {/* Quick counters */}
        <div className="grid grid-cols-2 gap-4 md:w-96">
          <div className="glass-panel p-4 rounded-xl border-border flex flex-col justify-between">
            <span className="text-[10px] font-mono font-semibold tracking-wider text-muted">
              SECURED ARCHIVES
            </span>
            <div className="text-2xl font-black text-primary">{totalFiles} Files</div>
          </div>
          <div className="glass-panel p-4 rounded-xl border-border flex flex-col justify-between">
            <span className="text-[10px] font-mono font-semibold tracking-wider text-muted">
              NESTED DIRECTORIES
            </span>
            <div className="text-2xl font-black text-accent">{folders.length} Folders</div>
          </div>
          {stats && (
            <>
              <div className="glass-panel p-4 rounded-xl border-border flex flex-col justify-between">
                <span className="text-[10px] font-mono font-semibold tracking-wider text-muted">
                  IMAGES
                </span>
                <div className="text-lg font-black text-pink-400">{formatBytes(stats.categories.images)}</div>
              </div>
              <div className="glass-panel p-4 rounded-xl border-border flex flex-col justify-between">
                <span className="text-[10px] font-mono font-semibold tracking-wider text-muted">
                  VIDEOS
                </span>
                <div className="text-lg font-black text-purple-400">{formatBytes(stats.categories.videos)}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Upload dropzone */}
      <label className="glass-panel p-8 rounded-2xl border-border border-dashed flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:border-primary/40 transition-all">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Upload className="w-10 h-10 text-primary animate-bounce mb-4" />
        <h3 className="text-base font-bold mb-2 text-foreground">Drag and drop assets here</h3>
        <p className="text-xs text-muted mb-6 text-center max-w-sm">
          Or click to select files. Files larger than 20 MB are streamed automatically via MTProto chunks.
        </p>
        <span className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover font-bold text-xs text-white shadow-md shadow-primary/20 transition-all active:scale-95 pointer-events-none">
          Browse File Repository
        </span>
        <input type="file" onChange={onUpload} className="hidden" multiple />
      </label>

      {/* Active upload pipeline */}
      {activeUploads.length > 0 && (
        <div className="glass-panel p-4 rounded-xl border-border flex flex-col gap-3">
          <span className="text-[10px] font-mono font-semibold tracking-wider text-muted border-b border-border/30 pb-2">
            ACTIVE UPLOAD PIPELINE
          </span>
          {activeUploads.map((item) => (
            <div key={item.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-2 text-foreground">
                  <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span>
                    {item.name} ({formatBytes(item.size)})
                  </span>
                </div>
                <span className="text-primary font-mono font-black">{item.progress}%</span>
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
