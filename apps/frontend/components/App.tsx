"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Star, Download, Trash2 } from "lucide-react";

import { useAppStore } from "../lib/store";
import * as api from "../lib/api";
import { FileMetadata, Folder, Note } from "@drift-deck/types";

import LandingPage, { TelegramAuthData } from "./LandingPage";
import DashboardHeader from "./DashboardHeader";
import Sidebar from "./Sidebar";
import DashboardHome from "./DashboardHome";
import FilesExplorer from "./FilesExplorer";
import NotesEditor from "./NotesEditor";
import AIAssistant from "./AIAssistant";
import FavoritesView from "./FavoritesView";
import TrashView from "./TrashView";
import SettingsPanel from "./SettingsPanel";
import FilePreviewModal from "./FilePreviewModal";
import GlobalUploadTracker from "./GlobalUploadTracker";
import InspectorPanel from "./InspectorPanel";

// ─── Normalise backend snake_case → camelCase ────────────────────────────────

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

// ─── Demo seed data ──────────────────────────────────────────────────────────

function loadDemoData() {
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
    {
      id: "f4", userId: "usr1", name: "deleted_secrets.txt", folderId: null,
      telegramMessageId: 104, telegramChannelId: 202,
      size: 1024 * 5, mimeType: "text/plain",
      isEncrypted: false, isFavorite: false, isInTrash: true,
      encryptionSalt: null, trashedAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
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
    {
      id: "fol3", userId: "usr1", name: "Sub Assets", parentFolderId: "fol1",
      color: "#8b5cf6", isFavorite: false,
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
      content: "# CSS variables design guidelines\n\nIndigo: #6366f1\nNeon Pink: #d946ef\nCyber Red: #ef4444\nEmerald: #10b981",
      isFavorite: true, telegramMessageId: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: "n3", userId: "usr1",
      title: "📋 API Notes",
      content: "## Backend Endpoints\n\nAll routes are prefixed with `/api`.\n\n- POST `/auth/login` — Telegram login\n- GET `/files` — list files\n- POST `/files/upload` — upload a file",
      isFavorite: false, telegramMessageId: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  ];

  return { files, folders, notes };
}

// ─── Main App component ───────────────────────────────────────────────────────

export default function App() {
  const {
    theme, setTheme,
    token, user, settings,
    setAuth, logout,
    activeTab, setActiveTab,
    currentFolderId, setCurrentFolderId,
    folderPath, pushFolderPath, setFolderPath,
    files, setFiles,
    folders, setFolders,
    uploadQueue, addToUploadQueue, updateUploadProgress, setUploadStatus,
    masterKey, setMasterKey,
    navigateToFolderWithHistory,
    navigateHistoryBack,
    navigateHistoryForward,
    selectedItemIds,
    clearSelection,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<api.FileStats | null>(null);
  const isDemo = token === "demo_jwt_token_driftdeck_2026";

  // AI chat state
  const [aiChat, setAiChat] = useState<{ sender: "user" | "ai"; text: string }[]>([
    { sender: "ai", text: "Drift Deck Semantic Engine ready. Upload a file or paste a prompt to get started." },
  ]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);

  // ─── Hydrate from localStorage ───────────────────────────────────────────

  useEffect(() => {
    const savedToken = localStorage.getItem("drift-deck-token");
    const savedTheme = localStorage.getItem("drift-deck-theme") as typeof theme | null;
    if (savedTheme) setTheme(savedTheme);

    if (savedToken && !token) {
      api.getMe(savedToken)
        .then(({ user: u, settings: s }) => setAuth(savedToken, u, s))
        .catch(() => localStorage.removeItem("drift-deck-token"));
    }
  }, []);

  // ─── Load data when authenticated ────────────────────────────────────────

  useEffect(() => {
    if (!token) return;

    if (isDemo) {
      const demo = loadDemoData();
      if (files.length === 0) setFiles(demo.files);
      if (folders.length === 0) setFolders(demo.folders);
      if (notes.length === 0) setNotes(demo.notes);
      setActivities([
        { id: "a1", type: "UPLOAD", fileId: "f1", createdAt: new Date(Date.now() - 3600000).toISOString() },
        { id: "a2", type: "SHARE", fileId: "f3", createdAt: new Date(Date.now() - 7200000).toISOString() },
        { id: "a3", type: "EDIT_NOTE", noteId: "n1", createdAt: new Date(Date.now() - 86400000).toISOString() },
      ]);
      return;
    }

    Promise.all([
      api.listFiles(token, { inTrash: false }).catch(() => [] as any[]),
      api.listFolders(token).catch(() => [] as any[]),
      api.listNotes(token).catch(() => [] as any[]),
      api.getFileStats(token).catch(() => null),
      api.listActivities(token).catch(() => [] as any[]),
    ]).then(([rawFiles, rawFolders, rawNotes, rawStats, rawActivities]) => {
      setFiles((rawFiles as any[]).map(normaliseFile));
      setFolders((rawFolders as any[]).map(normaliseFolder));
      setNotes((rawNotes as any[]).map(normaliseNote));
      setStats(rawStats);
      setActivities(rawActivities);
    });
  }, [token]);

  // ─── Telegram real login ─────────────────────────────────────────────────

  const handleTelegramLogin = useCallback(async (data: any) => {
    setLoading(true);
    try {
      if (data._jwt) {
        // Already logged in via bot deep link
        const jwt = data._jwt;
        const { settings: s } = await api.getMe(jwt);
        // remove _jwt before storing user state to keep it clean
        const { _jwt, ...userObj } = data;
        setAuth(jwt, userObj, s);
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        return;
      }

      // Legacy Telegram Login Widget flow
      const { token: jwt, user: u } = await api.loginWithTelegram(data);
      // Fetch settings after login
      const { settings: s } = await api.getMe(jwt);
      setAuth(jwt, u, s);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    } catch (err: any) {
      console.error("Telegram login failed:", err.message);
      alert("Login failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Demo login ──────────────────────────────────────────────────────────

  const handleDemoLogin = useCallback(() => {    setLoading(true);
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
  }, [theme]);

  // ─── File operations ─────────────────────────────────────────────────────

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = e.target.files;
      if (!picked || picked.length === 0) return;

      for (let i = 0; i < picked.length; i++) {
        const file = picked[i];
        const uploadId = Math.random().toString(36).substring(7);

        addToUploadQueue({ id: uploadId, name: file.name, size: file.size, progress: 0, status: "uploading" });

        if (isDemo) {
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
              setFiles([newFile, ...useAppStore.getState().files]);
              confetti({ particleCount: 40, spread: 50, colors: ["#6366f1", "#d946ef", "#10b981"] });
            }
          }, 280);
        } else if (token) {
          api.uploadFile(
            token, 
            file, 
            currentFolderId, 
            masterKey !== null, 
            undefined, 
            (progress) => updateUploadProgress(uploadId, progress)
          )
            .then((raw) => {
              setUploadStatus(uploadId, "completed");
              updateUploadProgress(uploadId, 100);
              setFiles([normaliseFile(raw), ...useAppStore.getState().files]);
              confetti({ particleCount: 40, spread: 50 });
            })
            .catch(() => setUploadStatus(uploadId, "failed"));
        }
      }
      e.target.value = "";
    },
    [token, isDemo, currentFolderId, masterKey, user] // removed files from deps
  );

  const handleDeleteFile = useCallback(
    (id: string) => {
      setFiles(useAppStore.getState().files.map((f) => f.id === id ? { ...f, isInTrash: true, trashedAt: new Date().toISOString() } : f));
      if (!isDemo && token) api.deleteFile(token, id).catch(() => {});
    },
    [token, isDemo]
  );

  const handleRestoreFile = useCallback(
    (id: string) => {
      setFiles(useAppStore.getState().files.map((f) => f.id === id ? { ...f, isInTrash: false, trashedAt: null } : f));
      confetti({ particleCount: 30, spread: 40 });
      if (!isDemo && token) api.restoreFile(token, id).catch(() => {});
    },
    [token, isDemo]
  );

  const handleToggleFavorite = useCallback(
    (id: string, current: boolean) => {
      setFiles(useAppStore.getState().files.map((f) => f.id === id ? { ...f, isFavorite: !current } : f));
      if (!isDemo && token) api.toggleFileFavorite(token, id, !current).catch(() => {});
    },
    [token, isDemo]
  );

  const handleDownloadFile = useCallback(
    (id: string, name: string) => {
      if (isDemo) {
        confetti({ particleCount: 30, spread: 40 });
        return;
      }
      if (!token) return;
      fetch(api.getFileDownloadUrl(id), { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => res.blob())
        .then((blob) => {
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = name;
          a.click();
          URL.revokeObjectURL(a.href);
        });
    },
    [token, isDemo]
  );

  const handlePreviewFile = useCallback(
    (id: string, mime: string) => {
      const file = files.find(f => f.id === id);
      if (file) {
        setPreviewFile(file);
      }
    },
    [files]
  );

  // ─── Folder operations ───────────────────────────────────────────────────

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
        // Log activity
        setActivities(prev => [
          { id: `act_${Math.random()}`, type: "UPLOAD", createdAt: new Date().toISOString() },
          ...prev
        ]);
        return;
      }
      if (!token) return;
      api.createFolder(token, name, currentFolderId, color)
        .then((raw) => {
          setFolders([...folders, normaliseFolder(raw)]);
          api.listActivities(token).then(setActivities).catch(() => {});
        })
        .catch(() => {});
    },
    [token, isDemo, folders, currentFolderId, user]
  );

  const handleRenameFolder = useCallback(
    async (id: string, name: string, color?: string) => {
      setFolders(useAppStore.getState().folders.map((f) => f.id === id ? { ...f, name, color: color ?? f.color } : f));
      if (!isDemo && token) {
        await api.renameFolder(token, id, name, color).catch(() => {});
        api.listActivities(token).then(setActivities).catch(() => {});
      }
    },
    [token, isDemo, setFolders]
  );

  const handleDeleteFolder = useCallback(
    async (id: string) => {
      setFolders(useAppStore.getState().folders.filter((f) => f.id !== id));
      // Delete child files
      const childFiles = useAppStore.getState().files.filter((f) => f.folderId === id);
      childFiles.forEach((file) => handleDeleteFile(file.id));
      if (!isDemo && token) {
        await api.deleteFolder(token, id).catch(() => {});
        api.listActivities(token).then(setActivities).catch(() => {});
      }
    },
    [token, isDemo, setFolders, handleDeleteFile]
  );

  const handleRenameFile = useCallback(
    async (id: string, name: string) => {
      setFiles(useAppStore.getState().files.map((f) => f.id === id ? { ...f, name } : f));
      if (!isDemo && token) {
        await api.renameFile(token, id, name).catch(() => {});
        api.listActivities(token).then(setActivities).catch(() => {});
      }
    },
    [token, isDemo, setFiles]
  );

  const handleMoveFile = useCallback(
    async (id: string, targetFolderId: string | null) => {
      setFiles(useAppStore.getState().files.map((f) => f.id === id ? { ...f, folderId: targetFolderId } : f));
      if (!isDemo && token) {
        await api.moveFile(token, id, targetFolderId).catch(() => {});
        api.listActivities(token).then(setActivities).catch(() => {});
      }
    },
    [token, isDemo, setFiles]
  );

  // ─── Notes operations ────────────────────────────────────────────────────

  const handleCreateNote = useCallback(() => {
    const blank: Note = {
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
      api.createNote(token, blank.title)
        .then((raw) => setNotes([normaliseNote(raw), ...notes]))
        .catch(() => setNotes([blank, ...notes]));
    } else {
      setNotes([blank, ...notes]);
    }
  }, [token, isDemo, notes, user]);

  const handleSaveNote = useCallback(
    async (id: string, title: string, content: string) => {
      setNotes(notes.map((n) => n.id === id ? { ...n, title, content, updatedAt: new Date().toISOString() } : n));
      if (!isDemo && token) {
        await api.updateNote(token, id, { title, content }).catch(() => {});
      }
    },
    [token, isDemo, notes]
  );

  const handleDeleteNote = useCallback(
    (id: string) => {
      setNotes(notes.filter((n) => n.id !== id));
      if (!isDemo && token) api.deleteNote(token, id).catch(() => {});
    },
    [token, isDemo, notes]
  );

  const handleToggleNoteFavorite = useCallback(
    (id: string, current: boolean) => {
      setNotes(notes.map((n) => n.id === id ? { ...n, isFavorite: !current } : n));
      if (!isDemo && token) api.updateNote(token, id, { isFavorite: !current }).catch(() => {});
    },
    [token, isDemo, notes]
  );

  // ─── AI ─────────────────────────────────────────────────────────────────

  const handleAiSend = useCallback(() => {
    if (!aiPrompt.trim() || aiLoading) return;

    setAiChat((prev) => [...prev, { sender: "user", text: aiPrompt }]);
    const promptText = aiPrompt;
    setAiPrompt("");
    setAiLoading(true);

    if (!isDemo && token) {
      api.queryAI(token, promptText)
        .then(({ reply }) => setAiChat((prev) => [...prev, { sender: "ai", text: reply }]))
        .catch(() => setAiChat((prev) => [...prev, { sender: "ai", text: "⚠️ AI service unavailable. Please try again." }]))
        .finally(() => setAiLoading(false));
    } else {
      setTimeout(() => {
        const reply = `[AI Cloud Terminal] Semantic analysis complete for:\n"${promptText}"\n\nKey findings:\n- Vector overlap matches structural design targets.\n- Client-side encryption layers verified.\n\nRecommendation: Continue utilizing zero-knowledge schemas.`;
        setAiChat((prev) => [...prev, { sender: "ai", text: reply }]);
        setAiLoading(false);
      }, 1400);
    }
  }, [aiPrompt, aiLoading, token, isDemo]);

  // ─── Settings ────────────────────────────────────────────────────────────

  const handleSavePipelineCredentials = useCallback(
    async (botToken: string, channelId: number) => {
      if (!token || isDemo) return;
      await api.updateSettings(token, { telegramBotToken: botToken, telegramChannelId: channelId }).catch(() => {});
    },
    [token, isDemo]
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  if (!token) {
    return (
      <LandingPage
        theme={theme}
        setTheme={setTheme}
        onDemoLogin={handleDemoLogin}
        onTelegramLogin={handleTelegramLogin}
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
        onBreadcrumbClick={navigateToFolderWithHistory}
        onLogout={logout}
        onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsMobileMenuOpen(false);
          }}
          masterKey={masterKey}
          onSetupKey={() => {
            setActiveTab("settings");
            setIsMobileMenuOpen(false);
          }}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
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
                onPreviewFile={handlePreviewFile}
                onCreateFolder={handleCreateFolder}
                onRenameFolder={handleRenameFolder}
                onDeleteFolder={handleDeleteFolder}
                onRenameFile={handleRenameFile}
                onMoveFile={handleMoveFile}
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

        {["files", "favorites", "trash", "dashboard"].includes(activeTab) && (
          <InspectorPanel
            activities={activities}
            onDownloadFile={handleDownloadFile}
            onPreviewFile={handlePreviewFile}
            onToggleFavorite={handleToggleFavorite}
            onDeleteFile={handleDeleteFile}
            onRenameFile={(id) => {
              window.dispatchEvent(new CustomEvent("trigger-rename-file", { detail: { id } }));
            }}
            onMoveFile={(id) => {
              window.dispatchEvent(new CustomEvent("trigger-move-file", { detail: { id } }));
            }}
            onRenameFolder={(folder) => {
              window.dispatchEvent(new CustomEvent("trigger-rename-folder", { detail: { folder } }));
            }}
            onDeleteFolder={(id) => {
              handleDeleteFolder(id);
              useAppStore.getState().clearSelection();
            }}
          />
        )}
      </div>

      {/* Sticky Bottom Actions Bar (Google & Apple style, rendered at root viewport level to avoid parent transforms) */}
      <AnimatePresence>
        {selectedItemIds.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-0 right-0 mx-auto z-50 glass-panel px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full border-primary/30 flex items-center gap-3 sm:gap-5 shadow-2xl bg-card w-[92%] sm:w-max max-w-md justify-between"
          >
            <span className="text-xs font-bold text-foreground truncate max-w-[100px] sm:max-w-none">
              {selectedItemIds.length} item{selectedItemIds.length > 1 ? "s" : ""} <span className="hidden sm:inline">selected</span>
            </span>
            <div className="h-4 w-[1px] bg-border/40" />
            
            <div className="flex items-center gap-3">
              {/* Batch Stars */}
              <button
                onClick={() => {
                  const itemsToStar = files.filter(f => selectedItemIds.includes(f.id));
                  itemsToStar.forEach(f => handleToggleFavorite(f.id, f.isFavorite));
                  clearSelection();
                }}
                className="p-1.5 rounded-lg hover:bg-primary/10 text-muted hover:text-yellow-400 transition-all"
                title="Toggle Starred"
              >
                <Star className="w-4 h-4" />
              </button>

              {/* Batch Downloads */}
              <button
                onClick={() => {
                  const filesToDownload = files.filter(f => selectedItemIds.includes(f.id));
                  filesToDownload.forEach(f => handleDownloadFile(f.id, f.name));
                  clearSelection();
                }}
                className="p-1.5 rounded-lg hover:bg-primary/10 text-muted hover:text-primary transition-all"
                title="Download All"
              >
                <Download className="w-4 h-4" />
              </button>

              {/* Batch Delete */}
              <button
                onClick={() => {
                  const filesToDelete = files.filter(f => selectedItemIds.includes(f.id));
                  filesToDelete.forEach(f => handleDeleteFile(f.id));
                  const foldersToDelete = folders.filter(f => selectedItemIds.includes(f.id));
                  foldersToDelete.forEach(f => handleDeleteFolder(f.id));
                  clearSelection();
                }}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-400 transition-all"
                title="Delete Selected"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={clearSelection}
                className="text-xs font-bold bg-border/20 text-muted hover:text-foreground px-3 py-1 rounded-xl transition-all"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FilePreviewModal
        file={previewFile}
        token={token}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownloadFile}
      />

      <GlobalUploadTracker />
    </div>
  );
}
