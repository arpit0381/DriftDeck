"use client";

import { motion } from "framer-motion";
import {
  Trash2,
  Lock,
  RefreshCw,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
} from "lucide-react";
import { FileMetadata } from "@drift-deck/types";
import { formatBytes } from "@drift-deck/utils";

interface TrashViewProps {
  files: FileMetadata[];
  onRestore: (id: string) => void;
}

function MimeIcon({ mime }: { mime: string }) {
  if (mime.startsWith("image/")) return <FileImage className="text-pink-500 w-5 h-5 flex-shrink-0 opacity-60" />;
  if (mime.startsWith("video/")) return <FileVideo className="text-purple-500 w-5 h-5 flex-shrink-0 opacity-60" />;
  if (mime.startsWith("audio/")) return <FileAudio className="text-cyan-500 w-5 h-5 flex-shrink-0 opacity-60" />;
  if (mime.includes("pdf")) return <FileText className="text-red-500 w-5 h-5 flex-shrink-0 opacity-60" />;
  return <FileCode className="text-emerald-500 w-5 h-5 flex-shrink-0 opacity-60" />;
}

export default function TrashView({ files, onRestore }: TrashViewProps) {
  const trashed = files.filter((f) => f.isInTrash);

  return (
    <motion.div
      key="trash"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center gap-2">
        <Trash2 className="w-5 h-5 text-red-400" />
        <h2 className="text-sm font-bold text-foreground">Trash Bin</h2>
        <span className="text-xs text-muted font-mono">({trashed.length} items)</span>
      </div>

      <div className="glass-panel rounded-xl border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 text-[10px] font-mono tracking-wider text-muted grid grid-cols-12 gap-2">
          <span className="col-span-6 uppercase">File Name</span>
          <span className="col-span-3 uppercase">Size</span>
          <span className="col-span-2 uppercase">Encrypted</span>
          <span className="col-span-1 text-center uppercase">•••</span>
        </div>

        {trashed.map((file) => (
          <div
            key={file.id}
            className="px-4 py-3.5 border-b border-border/10 grid grid-cols-12 gap-2 text-xs font-semibold hover:bg-red-500/5 items-center transition-colors opacity-70"
          >
            <div className="col-span-6 flex items-center gap-3 min-w-0">
              <MimeIcon mime={file.mimeType} />
              <span className="truncate text-muted line-through">{file.name}</span>
            </div>
            <span className="col-span-3 text-muted">{formatBytes(file.size)}</span>
            <span className="col-span-2 flex items-center gap-1">
              {file.isEncrypted ? (
                <span className="text-emerald-400/60 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> AES-256
                </span>
              ) : (
                <span className="text-muted">—</span>
              )}
            </span>
            <div className="col-span-1 flex justify-center">
              <button
                onClick={() => onRestore(file.id)}
                className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all"
                title="Restore file"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {trashed.length === 0 && (
          <div className="py-14 flex flex-col items-center justify-center text-center text-muted">
            <Trash2 className="w-10 h-10 mb-3 opacity-30 text-red-400" />
            <p className="text-xs">The trash bin is empty.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
