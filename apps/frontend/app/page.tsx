"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

import { useAppStore } from "../lib/store";
import * as api from "../lib/api";
import { FileMetadata, Folder, Note } from "@drift-deck/types";
import { encryptText } from "@drift-deck/utils";

import LandingPage from "../components/LandingPage";
import DashboardHeader from "../components/DashboardHeader";
import Sidebar from "../components/Sidebar";
import DashboardHome from "../components/DashboardHome";
import FilesExplorer from "../components/FilesExplorer";
import NotesEditor from "../components/NotesEditor";
import AIAssistant from "../components/AIAssistant";
import FavoritesView from "../components/FavoritesView";
import TrashView from "../components/TrashView";
import SettingsPanel from "../components/SettingsPanel";

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Normalise backend snake_case file fields to camelCase types */
function normaliseFile(raw: any): FileMetadata {
  return {
    id: raw.id,
    userId: raw.user_id ?? raw.userId,
    folderId: raw.folder_id ?? raw.folderId ?? null,
    name: raw.name,
    telegramMessageId: raw.telegram_message_id ?? raw.telegramMessageId ?? 0,
    telegramChannelId: raw.telegram_channel_id ?? raw.telegramChannelId ?? 0,
    size: raw.size,
    mimeType: raw.mime_type ?? raw.mimeType,
    isEncrypted: raw.is_encrypted ?? raw.isEncrypted ?? false,
    encryptionSalt: raw.encryption_salt ?? raw.encryptionSalt ?? null,
    isFavorite: raw.is_favorite ?? raw.isFavorite ?? false,
    isInTrash: raw.is_in_trash ?? raw.isInTrash ?? false,
    trashedAt: raw.trashed_at ?? raw.trashedAt ?? null,
    createdAt: raw.created_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  };
}

function normaliseFolder(raw: any): Folder {
  return {
    id: raw.id,
    userId: raw.user_id ?? raw.userId,
    name: raw.name,
    parentFolderId: raw.parent_folder_id ?? raw.parentFolderId ?? null,
    color: raw.color ?? "#3b82f6",
    isFavorite: raw.is_favorite ?? raw.isFavorite ?? false,
    createdAt: raw.created_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  };
}

function normaliseNote(raw: any): Note {
  return {
    id: raw.id,
    userId: raw.user_id ?? raw.userId,
    title: raw.title,
    content: raw.content ?? "",
    isFavorite: raw.is_favorite ?? raw.isFavorite ?? false,
    telegramMessageId: raw.telegram_message_id ?? raw.telegramMessageId ?? null,
    createdAt: raw.created_at ?? raw.createdAt,
    updatedAt: raw.updated_at ?? raw.updatedAt,
  };
}

// ─── DEMO mock data (used when not connected to a real backend) ──────────────

function loadDemoData(): { files: FileMetadata[]; folders: Folder[]; notes: Note[] } {
  const files: FileMetadata[] = [
    {
      id: "f1", userId: "usr1", name: "quantum_ledger.pdf", folderId: null,
      telegramMessageId: 101, telegramChannelId: 202,
      size: 1048576 * 15, mimeType: "application/pdf",
      isEncrypted: true, isFavorite: true, isInTrash: false,
      encryptionSalt: null, trashedAt: null,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "f2", userId: "usr1", name: "matrix_hologram.mp4", folderId: null,
      telegramMessageId: 102, telegramChannelId: 202,
      size: 1048576 * 125, mimeType: "video/mp4",
      isEncrypted: false, isFavorite: false, isInTrash: false,
      encryptionSalt: null, trashedAt: null,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "f3", userId: "usr1", name: "cyber_blueprint.png", folderId: "fol1",
      telegramMessageId: 103, telegramChannelId: 202,
      size: 1048576 * 3, mimeType: "image/png",
      isEncrypted: true, isFavorite: false, isInTrash: false,
      encryptionSalt: null, trashedAt: null,
      createdAt: new Date(Date.now() - 1000000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const folders: Folder[] = [
    {
      id: "fol1", userId: "usr1", name: "Cyber Assets", parentFolderId: null,
      color: "#ec4899", isFavorite: true,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: "fol2", userId: "usr1", name: "Encrypted Logs", parentFolderId: null,
      color: "#f59e0b", isFavorite: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  ];

  const notes: Note[] = [
    {
      id: "n1", userId: "usr1",
      title: "🚀 Launch Strategy",
      content: "# Product Launch\n\n- Build high fidelity landing page\n- Connect custom Bot storage API\n- Stream videos on-the-fly via MTProto proxy.",
      isFavorite: false, telegramMessageId: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: "n2", userId: "usr1",
      title: "💡 Cyberpunk Color Tokens",
      content: "# CSS variables design guidelines\n\nIndigo: #6366f1\nNeon Pink: #d946ef\nCyber Red: #ef4444",
      isFavorite: true, telegramMessageId: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  ];

  return { files, folders, notes };
}

// ─── Root page ───────────────────────────────────────────────────────────────

export default function Home() {
  const {
    theme, setTheme,
    token, user, settings,
    setAuth, logout,
    activeTab, setActiveTab,
    currentFolderId, setCurrentFolderId,
    folderPath, pushFolderPath, popFolderPath,
    files, setFiles,
    folders, setFolders,
    uploadQueue, addToUploadQueue, updateUploadProgress, setUploadStatus,
    masterKey, setMasterKey,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<api.FileStats | null>(null);
  const isDemo = token === "demo_jwt_token_driftdeck_2026";

  // AI chat state lives here so it persists across tab switches
  const [aiChat, setAiChat] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Drift Deck Semantic Engine ready. Upload a file or paste a prompt to get started." },
  ]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // ─── Bootstrap on auth ────────────────────────────────────────────────────

  useEffect(() => {
    if (!token) return;

    if (isDemo) {
      const { files: demoFiles, folders: demoFolders, notes: demoNotes } = loadDemoData();
      if (files.length === 0) setFiles(demoFiles);
      if (folders.length === 0) setFolders(demoFolders);
      if (notes.length === 0) setNotes(demoNotes);
      return;
    }

    // Real API: load all data in parallel
    Promise.all([
      api.listFiles(token, { inTrash: false }).catch(() => [] as any[]),
      api.listFolders(token).catch(() => [] as any[]),
      api.listNotes(token).catch(() => [] as any[]),
      api.getFileStats(token).catch(() => null),
    ]).then(([rawFiles, rawFolders, rawNotes, rawStats]) => {
      setFiles((rawFiles as any[]).map(normaliseFile));
      setFolders((rawFolders as any[]).map(normaliseFolder));
      setNotes((rawNotes as any[]).map(normaliseNote));
      setStats(rawStats);
    });
  }, [token]);

  // ─── Auth ────────────────────────────────────────────────────────────────

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setAuth(
        "demo_jwt_token_driftdeck_2026",
        {
          id: "usr_de7a72f9b8c",
          telegramId: 987654321,
          username: "neo_cyber_deck",
          firstName: "Neo",
          lastName: "Hacker",
          photoUrl: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          userId: "usr_de7a72f9b8c",
          theme: theme || "neon-cyberpunk",
          telegramBotToken: "",
          telegramChannelId: 0,
          encKeySalt: "slt_4a9b22f_drift_deck_2026",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      setLoading(false);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }, 700);
  };

  // ─── File operations ──────────────────────────────────────────────────────

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = e.target.files;
      if (!picked || picked.length === 0) return;

      for (let i = 0; i < picked.length; i++) {
        const file = picked[i];
        const uploadId = Math.random().toString(36).substring(7);

        addToUploadQueue({ id: uploadId, name: file.name, size: file.size, progress: 0, status: "uploading" });

        if (isDemo) {
          // Simulate upload for demo mode
          let progress = 0;
          const tick = setInterval(() => {
            progress = Math.min(100, progress + Math.floor(Math.random() * 20) + 8);
            updateUploadProgress(uploadId, progress);
            if (progress >= 100) {
              clearInterval(tick);
              setUploadStatus(uploadId, "completed");
              const newFile: FileMetadata = {
                id: `fil_${Math.random().toString(36).substring(7)}`,
                userId: user?.id ?? "usr1",
                name: file.name,
                size: file.size,
                mimeType: file.type || "application/octet-stream",
                folderId: currentFolderId,
                isEncrypted: masterKey !== null,
                isFavorite: false,
                isInTrash: false,
                telegramMessageId: 0,
                telegramChannelId: 0,
                encryptionSalt: null,
                trashedAt: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              setFiles([newFile, ...files]);
              confetti({ particleCount: 40, spread: 50, colors: ["#6366f1", "#d946ef", "#10b981"] });
            }
          }, 280);
        } else if (token) {
          // Real upload
          api.uploadFile(token, file, currentFolderId, masterKey !== null)
            .then((raw) => {
              setUploadStatus(uploadId, "completed");
              updateUploadProgress(uploadId, 100);
              setFiles([normaliseFile(raw), ...files]);
              confetti({ particleCount: 40, spread: 50 });
            })
            .catch(() => setUploadStatus(uploadId, "failed"));
        }
      }
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [token, isDemo, files, currentFolderId, masterKey, user]
  );

  const handleDeleteFile = useCallback(
    (id: string) => {
      if (isDemo) {
        setFiles(files.map((f) => f.id === id ? { ...f, isInTrash: true } : f));
        return;
      }
      if (!token) return;
      api.deleteFile(token, id).then(() =>
        setFiles(files.map((f) => f.id === id ? { ...f, isInTrash: true } : f))
      );
    },
    [token, isDemo, files]
  );

  const handleRestoreFile = useCallback(
    (id: string) => {
      if (isDemo) {
        setFiles(files.map((f) => f.id === id ? { ...f, isInTrash: false } : f));
        confetti({ particleCount: 30, spread: 40 });
        return;
      }
      if (!token) return;
      api.restoreFile(token, id).then(() => {
        setFiles(files.map((f) => f.id === id ? { ...f, isInTrash: false } : f));
        confetti({ particleCount: 30, spread: 40 });
      });
    },
    [token, isDemo, files]
  );

  const handleToggleFavorite = useCallback(
    (id: string, current: boolean) => {
      if (isDemo) {
        setFiles(files.map((f) => f.id === id ? { ...f, isFavorite: !current } : f));
        return;
      }
      if (!token) return;
      api.toggleFileFavorite(token, id, !current).then((raw) =>
        setFiles(files.map((f) => f.id === id ? normaliseFile(raw) : f))
      );
    },
    [token, isDemo, files]
  );

  const handleDownloadFile = useCallback(
    (id: string, name: string) => {
      if (isDemo) {
        confetti({ particleCount: 30, spread: 40 });
        return;
      }
      if (!token) return;
      const url = `${api.getFileDownloadUrl(id)}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      // Pass auth token via fetch for authenticated download
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.blob())
        .then((blob) => {
          a.href = URL.createObjectURL(blob);
          a.click();
          URL.revokeObjectURL(a.href);
        });
    },
    [token, isDemo]
  );

  // ─── Folder operations ────────────────────────────────────────────────────

  const handleCreateFolder = useCallback(
    (name: string, color: string) => {
      if (isDemo) {
        const newFolder: Folder = {
          id: `fol_${Math.random().toString(36).substring(7)}`,
          userId: user?.id ?? "usr1",
          name,
          parentFolderId: currentFolderId,
          color,
          isFavorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setFolders([...folders, newFolder]);
        return;
      }
      if (!token) return;
      api.createFolder(token, name, currentFolderId, color).then((raw) =>
        setFolders([...folders, normaliseFolder(raw)])
      );
    },
    [token, isDemo, folders, currentFolderId, user]
  );

  // ─── Notes operations ─────────────────────────────────────────────────────

  const handleCreateNote = useCallback(() => {
    const blankNote: Note = {
      id: `n_${Math.random().toString(36).substring(7)}`,
      userId: user?.id ?? "usr1",
      title: "Untitled Note",
      content: "",
      isFavorite: false,
      telegramMessageId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!isDemo && token) {
      api.createNote(token, blankNote.title).then((raw) =>
        setNotes([normaliseNote(raw), ...notes])
      );
    } else {
      setNotes([blankNote, ...notes]);
    }
  }, [token, isDemo, notes, user]);

  const handleSaveNote = useCallback(
    async (id: string, title: string, content: string) => {
      if (isDemo) {
        setNotes(notes.map((n) => n.id === id ? { ...n, title, content, updatedAt: new Date().toISOString() } : n));
        return;
      }
      if (!token) return;
      const raw = await api.updateNote(token, id, { title, content });
      setNotes(notes.map((n) => n.id === id ? normaliseNote(raw) : n));
    },
    [token, isDemo, notes]
  );

  const handleDeleteNote = useCallback(
    (id: string) => {
      setNotes(notes.filter((n) => n.id !== id));
      if (!isDemo && token) api.deleteNote(token, id);
    },
    [token, isDemo, notes]
  );

  const handleToggleNoteFavorite = useCallback(
    (id: string, current: boolean) => {
      setNotes(notes.map((n) => n.id === id ? { ...n, isFavorite: !current } : n));
      if (!isDemo && token) api.updateNote(token, id, { isFavorite: !current });
    },
    [token, isDemo, notes]
  );

  // ─── AI ──────────────────────────────────────────────────────────────────

  const handleAiSend = useCallback(() => {
    if (!aiPrompt.trim() || aiLoading) return;

    const userMsg = { sender: "user" as const, text: aiPrompt };
    setAiChat((prev) => [...prev, userMsg]);
    const promptText = aiPrompt;
    setAiPrompt("");
    setAiLoading(true);

    if (!isDemo && token) {
      api.queryAI(token, promptText)
        .then(({ reply }) => {
          setAiChat((prev) => [...prev, { sender: "ai" as const, text: reply }]);
        })
        .catch(() => {
          setAiChat((prev) => [...prev, { sender: "ai" as const, text: "⚠️ AI service unavailable. Please try again." }]);
        })
        .finally(() => setAiLoading(false));
    } else {
      // Demo mock response
      setTimeout(() => {
        const reply = `[AI Cloud Terminal] Semantic analysis completed for:\n"${promptText}"\n\nKey findings:\n- Vector overlap matches structural design targets.\n- Client-side encryption layers verified.\n\nRecommendation: Continue utilizing zero-knowledge schemas.`;
        setAiChat((prev) => [...prev, { sender: "ai" as const, text: reply }]);
        setAiLoading(false);
      }, 1400);
    }
  }, [aiPrompt, aiLoading, token, isDemo]);

  // ─── Settings ─────────────────────────────────────────────────────────────

  const handleSavePipelineCredentials = useCallback(
    async (botToken: string, channelId: number) => {
      if (!token || isDemo) return;
      await api.updateSettings(token, { telegramBotToken: botToken, telegramChannelId: channelId });
    },
    [token, isDemo]
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!token) {
    return (
      <LandingPage
        theme={theme}
        setTheme={setTheme}
        onDemoLogin={handleDemoLogin}
        loading={loading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden transition-all duration-300 relative">
      {/* Ambient glow orbs */}
      <div className="absolute top-[20%] left-[-10%] w-[350px] h-[350px] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />

      <DashboardHeader
        theme={theme}
        setTheme={setTheme}
        username={user?.username}
        activeTab={activeTab}
        folderPath={folderPath}
        setCurrentFolderId={(id) => {
          setCurrentFolderId(id);
          // Trim folder path when navigating to root
          if (id === null) {
            useAppStore.getState().setFolderPath([]);
          }
        }}
        onLogout={logout}
      />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          masterKey={masterKey}
          onSetupKey={() => setActiveTab("settings")}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <DashboardHome
                key="dashboard"
                files={files}
                folders={folders}
                uploadQueue={uploadQueue}
                stats={stats}
                onUpload={handleUpload}
              />
            )}

            {activeTab === "files" && (
              <FilesExplorer
                key="files"
                files={files}
                folders={folders}
                currentFolderId={currentFolderId}
                onOpenFolder={pushFolderPath}
                onUpload={handleUpload}
                onDeleteFile={handleDeleteFile}
                onToggleFavorite={handleToggleFavorite}
                onDownloadFile={handleDownloadFile}
                onCreateFolder={handleCreateFolder}
              />
            )}

            {activeTab === "favorites" && (
              <FavoritesView
                key="favorites"
                files={files}
                onDownload={handleDownloadFile}
                onToggleFavorite={handleToggleFavorite}
              />
            )}

            {activeTab === "notes" && (
              <NotesEditor
                key="notes"
                notes={notes}
                onCreateNote={handleCreateNote}
                onSaveNote={handleSaveNote}
                onDeleteNote={handleDeleteNote}
                onToggleFavorite={handleToggleNoteFavorite}
              />
            )}

            {activeTab === "ai" && (
              <AIAssistant
                key="ai"
                chat={aiChat}
                prompt={aiPrompt}
                loading={aiLoading}
                onPromptChange={setAiPrompt}
                onSend={handleAiSend}
              />
            )}

            {activeTab === "trash" && (
              <TrashView
                key="trash"
                files={files}
                onRestore={handleRestoreFile}
              />
            )}

            {activeTab === "settings" && (
              <SettingsPanel
                key="settings"
                settings={settings}
                masterKey={masterKey}
                onSavePipelineCredentials={handleSavePipelineCredentials}
                onSetMasterKey={setMasterKey}
              />
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
