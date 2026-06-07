"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, FileText, RefreshCw, Star, Trash2, ChevronLeft } from "lucide-react";
import { Note } from "@drift-deck/types";

interface NotesEditorProps {
  notes: Note[];
  onCreateNote: () => void;
  onSaveNote: (id: string, title: string, content: string) => Promise<void>;
  onDeleteNote: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
}

export default function NotesEditor({
  notes,
  onCreateNote,
  onSaveNote,
  onDeleteNote,
  onToggleFavorite,
}: NotesEditorProps) {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(
    notes[0]?.id ?? null
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Mobile split view state
  const [mobileView, setMobileView] = useState<"list" | "editor">("list");

  const activeNote = notes.find((n) => n.id === activeNoteId) ?? null;

  // Sync editor fields when active note changes
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
      setDirty(false);
    }
  }, [activeNoteId, activeNote?.id]);

  // Set first note active when notes load (if nothing is active)
  useEffect(() => {
    if (!activeNoteId && notes.length > 0) {
      setActiveNoteId(notes[0].id);
    }
  }, [notes.length]);

  // Auto-focus newly created note and switch to editor on mobile
  const [prevNotesCount, setPrevNotesCount] = useState(notes.length);
  useEffect(() => {
    if (notes.length > prevNotesCount) {
      if (notes[0]) {
        setActiveNoteId(notes[0].id);
        setMobileView("editor");
      }
    }
    setPrevNotesCount(notes.length);
  }, [notes.length, prevNotesCount]);

  const handleSave = async () => {
    if (!activeNote) return;
    setSaving(true);
    await onSaveNote(activeNote.id, title, content);
    setSaving(false);
    setDirty(false);
  };

  // Auto-save on blur
  const handleBlur = () => {
    if (dirty && activeNote) handleSave();
  };

  return (
    <motion.div
      key="notes"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="flex flex-col sm:flex-row gap-5 h-[calc(100vh-10rem)] overflow-hidden"
    >
      {/* Notes list */}
      <div className={`w-full sm:w-60 flex-shrink-0 glass-panel border-border p-3 flex flex-col gap-2 rounded-xl h-full ${mobileView === "editor" ? "hidden sm:flex" : "flex"}`}>
        <div className="flex items-center justify-between border-b border-border/30 pb-2">
          <span className="text-[10px] font-mono font-semibold tracking-wider text-muted uppercase">
            Notes Archive
          </span>
          <button
            onClick={onCreateNote}
            className="p-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all"
            title="New Note"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-1 pr-0.5">
          {notes.length === 0 && (
            <div className="py-6 text-center text-muted text-xs">No notes yet.</div>
          )}
          {notes.map((note) => (
            <button
              key={note.id}
              onClick={() => {
                setActiveNoteId(note.id);
                setMobileView("editor");
              }}
              className={`w-full text-left p-3 rounded-lg flex flex-col gap-0.5 transition-all group ${
                activeNoteId === note.id
                  ? "bg-primary/20 border border-primary/20"
                  : "hover:bg-card/80"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-foreground truncate flex-1">
                  {note.title || "Untitled Note"}
                </span>
                {note.isFavorite && (
                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                )}
              </div>
              <span className="text-[10px] text-muted font-mono">
                {new Date(note.updatedAt).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor pane */}
      <div className={`flex-1 glass-panel border-border p-4 sm:p-6 rounded-xl flex flex-col gap-4 min-w-0 h-full ${mobileView === "list" ? "hidden sm:flex" : "flex"}`}>
        {activeNote ? (
          <>
            {/* Editor toolbar */}
            <div className="flex items-center justify-between border-b border-border/30 pb-3 gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Back to list button on mobile */}
                <button
                  onClick={() => setMobileView("list")}
                  className="sm:hidden p-1.5 rounded-lg hover:bg-border/30 text-muted hover:text-foreground transition-colors flex-shrink-0"
                  title="Back to List"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
                  onBlur={handleBlur}
                  className="bg-transparent text-lg sm:text-xl font-bold border-none outline-none text-foreground flex-1 min-w-0"
                  placeholder="Untitled Note"
                />
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onToggleFavorite(activeNote.id, activeNote.isFavorite)}
                  className={`p-1.5 rounded-lg transition-all ${
                    activeNote.isFavorite
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "hover:bg-border/30 text-muted hover:text-yellow-400"
                  }`}
                  title="Toggle favorite"
                >
                  <Star className={`w-4 h-4 ${activeNote.isFavorite ? "fill-yellow-400" : ""}`} />
                </button>
                <button
                  onClick={() => {
                    onDeleteNote(activeNote.id);
                    setActiveNoteId(null);
                    setMobileView("list");
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-all"
                  title="Delete note"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !dirty}
                  className="px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover font-bold text-xs text-white transition-all flex items-center gap-2 shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>

            {/* Content textarea */}
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); setDirty(true); }}
              onBlur={handleBlur}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm font-mono text-foreground/80 leading-relaxed"
              placeholder={`Start typing...\n\nMarkdown is supported. Use # for headings, ** for bold, etc.`}
            />

            {/* Word count footer */}
            <div className="flex items-center justify-between text-[10px] text-muted border-t border-border/20 pt-2">
              <span className="font-mono">
                {content.split(/\s+/).filter(Boolean).length} words · {content.length} chars
              </span>
              {dirty && (
                <span className="text-amber-400 font-semibold">Unsaved changes</span>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted">
            <FileText className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-xs">Select a note or create a new one to start editing.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
