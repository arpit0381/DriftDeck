import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Download, FileText, Image as ImageIcon, Film, Music } from 'lucide-react';
import { FileMetadata } from '@drift-deck/types';
import * as api from '../lib/api';

interface FilePreviewModalProps {
  file: FileMetadata | null;
  token: string | null;
  onClose: () => void;
  onDownload: (id: string, name: string) => void;
}

export default function FilePreviewModal({ file, token, onClose, onDownload }: FilePreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !token) return;

    // Reset state
    setBlobUrl(null);
    setStreamUrl(null);
    setTextContent(null);
    setError(null);
    setLoading(true);

    const isVideoOrAudio = file.mimeType.startsWith('video/') || file.mimeType.startsWith('audio/');
    if (isVideoOrAudio) {
      setStreamUrl(api.getFileStreamUrl(file.id, token));
      setLoading(false);
      return;
    }

    const isText = file.mimeType.startsWith('text/') || file.mimeType === 'application/json';

    fetch(api.getFileDownloadUrl(file.id), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load file preview");
        const blob = await res.blob();
        
        // Ensure proper mime type is set for the blob
        const typedBlob = new Blob([blob], { type: file.mimeType });
        
        if (isText) {
          const text = await typedBlob.text();
          setTextContent(text);
        } else {
          const url = URL.createObjectURL(typedBlob);
          setBlobUrl(url);
        }
      })
      .catch((err) => {
        console.error("Preview error:", err);
        setError("Could not load preview. The file might be encrypted or corrupted.");
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      // Cleanup blob url on unmount or file change
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [file, token]);

  if (!file) return null;

  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isAudio = file.mimeType.startsWith('audio/');
  const isPdf = file.mimeType === 'application/pdf';
  const isText = file.mimeType.startsWith('text/') || file.mimeType === 'application/json';

  const canPreview = isImage || isVideo || isAudio || isPdf || isText;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl max-h-[90vh] glass-panel border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-card/50">
            <div className="flex items-center gap-3 min-w-0">
              {isImage && <ImageIcon className="w-5 h-5 text-pink-500" />}
              {isVideo && <Film className="w-5 h-5 text-purple-500" />}
              {isAudio && <Music className="w-5 h-5 text-cyan-500" />}
              {(isPdf || isText) && <FileText className="w-5 h-5 text-emerald-500" />}
              {!canPreview && <FileText className="w-5 h-5 text-muted" />}
              <span className="font-bold text-sm text-foreground truncate">{file.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDownload(file.id, file.name)}
                className="p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors flex items-center gap-2 text-xs font-bold"
                title="Download"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-border/30 text-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto bg-black/10 flex items-center justify-center min-h-[300px] p-6">
            {loading && (
              <div className="flex flex-col items-center gap-4 text-muted">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-sm font-semibold tracking-wide">Loading secure preview...</span>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center text-center gap-4 text-red-400">
                <X className="w-10 h-10" />
                <div>
                  <p className="font-bold">{error}</p>
                  <p className="text-xs text-muted mt-2">Try downloading the file instead.</p>
                </div>
              </div>
            )}

            {!loading && !error && (
              <>
                {!canPreview && (
                  <div className="flex flex-col items-center gap-4 text-muted">
                    <FileText className="w-16 h-16 opacity-30" />
                    <p className="text-sm font-medium">No preview available for {file.mimeType}</p>
                    <button
                      onClick={() => onDownload(file.id, file.name)}
                      className="px-6 py-2 mt-2 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm transition-colors"
                    >
                      Download to View
                    </button>
                  </div>
                )}

                {canPreview && blobUrl && isImage && (
                  <img src={blobUrl} alt={file.name} className="max-w-full max-h-[70vh] rounded-lg shadow-lg object-contain" />
                )}

                {canPreview && streamUrl && isVideo && (
                  <video src={streamUrl} controls autoPlay className="max-w-full max-h-[70vh] rounded-lg shadow-lg bg-black" />
                )}

                {canPreview && streamUrl && isAudio && (
                  <audio src={streamUrl} controls autoPlay className="w-full max-w-md shadow-lg" />
                )}

                {canPreview && blobUrl && isPdf && (
                  <iframe src={blobUrl} className="w-full h-[75vh] rounded-lg bg-white" title={file.name} />
                )}

                {canPreview && isText && textContent !== null && (
                  <div className="w-full h-[70vh] bg-card/80 border border-border rounded-lg overflow-auto p-4 text-left">
                    <pre className="text-xs font-mono text-foreground/90 whitespace-pre-wrap">{textContent}</pre>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
