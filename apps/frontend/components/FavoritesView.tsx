"use client";

import { motion } from "framer-motion";
import { Star, Lock, Download, FileText, FileImage, FileVideo, FileAudio, FileCode } from "lucide-react";
import { FileMetadata } from "@drift-deck/types";
import { formatBytes } from "@drift-deck/utils";

interface FavoritesViewProps {
  files: FileMetadata[];
  onDownload: (id: string, name: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
}

function MimeIcon({ mime }: { mime: string }) {
  if (mime.startsWith("image/")) return <FileImage className="text-pink-500 w-5 h-5 flex-shrink-0" />;
  if (mime.startsWith("video/")) return <FileVideo className="text-purple-500 w-5 h-5 flex-shrink-0" />;
  if (mime.startsWith("audio/")) return <FileAudio className="text-cyan-500 w-5 h-5 flex-shrink-0" />;
  if (mime.includes("pdf")) return <FileText className="text-red-500 w-5 h-5 flex-shrink-0" />;
  return <FileCode className="text-emerald-500 w-5 h-5 flex-shrink-0" />;
}

export default function FavoritesView({ files, onDownload, onToggleFavorite }: FavoritesViewProps) {
  const favorites = files.filter((f) => f.isFavorite && !f.isInTrash);

  return (
    <motion.div
      key="favorites"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
        <h2 className="text-sm font-bold text-foreground">Starred Files</h2>
        <span className="text-xs text-muted font-mono">({favorites.length})</span>
      </div>

      <div className="glass-panel rounded-xl border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border/30 text-[10px] font-mono tracking-wider text-muted grid grid-cols-12 gap-2">
          <span className="col-span-6 uppercase">File Name</span>
          <span className="col-span-3 uppercase">Size</span>
          <span className="col-span-2 uppercase">Encrypted</span>
          <span className="col-span-1 text-center uppercase">•••</span>
        </div>

        {favorites.map((file) => (
          <div
            key={file.id}
            className="px-4 py-3.5 border-b border-border/10 grid grid-cols-12 gap-2 text-xs font-semibold hover:bg-primary/5 items-center transition-colors"
          >
            <div className="col-span-6 flex items-center gap-3 min-w-0">
              <MimeIcon mime={file.mimeType} />
              <span className="truncate text-foreground">{file.name}</span>
            </div>
            <span className="col-span-3 text-muted">{formatBytes(file.size)}</span>
            <span className="col-span-2 flex items-center gap-1">
              {file.isEncrypted ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> AES-256
                </span>
              ) : (
                <span className="text-muted">—</span>
              )}
            </span>
            <div className="col-span-1 flex justify-center gap-1">
              <button
                onClick={() => onDownload(file.id, file.name)}
                className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all"
                title="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {favorites.length === 0 && (
          <div className="py-14 flex flex-col items-center justify-center text-center text-muted">
            <Star className="w-10 h-10 mb-3 opacity-30 text-yellow-400" />
            <p className="text-xs">No favorites yet. Star a file to see it here.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
