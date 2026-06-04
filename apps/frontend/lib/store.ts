import { create } from 'zustand';
import { User, Settings, FileMetadata, Folder } from '@drift-deck/types';

export type ActiveTab =
  | 'dashboard'
  | 'files'
  | 'shared'
  | 'favorites'
  | 'recent'
  | 'notes'
  | 'ai'
  | 'trash'
  | 'settings';

export type ThemeType = 'neon-cyberpunk' | 'midnight-glass' | 'crimson-void' | 'aurora-green' | 'solar-gold';

interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

interface AppState {
  // Theme Engine
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;

  // Auth State
  token: string | null;
  user: User | null;
  settings: Settings | null;
  setAuth: (token: string, user: User, settings: Settings) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  logout: () => void;

  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentFolderId: string | null; // null represents Root
  setCurrentFolderId: (id: string | null) => void;
  folderPath: Folder[]; // Breadcrumbs stack
  setFolderPath: (path: Folder[]) => void;
  pushFolderPath: (folder: Folder) => void;
  popFolderPath: () => void;

  // Data Cache states
  files: FileMetadata[];
  setFiles: (files: FileMetadata[]) => void;
  folders: Folder[];
  setFolders: (folders: Folder[]) => void;

  // Upload Queue
  uploadQueue: UploadItem[];
  addToUploadQueue: (item: UploadItem) => void;
  updateUploadProgress: (id: string, progress: number) => void;
  setUploadStatus: (id: string, status: UploadItem['status']) => void;
  clearUploadQueue: () => void;

  // Client-Side Master Password Encryption
  masterKey: string | null;
  setMasterKey: (key: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Theme
  theme: 'neon-cyberpunk',
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('drift-deck-theme', theme);
      // Remove all theme classes and add the new one
      document.body.className = `theme-${theme} antialiased min-h-screen`;
    }
    set({ theme });
  },

  // Auth
  token: null, // Hydrated from localStorage in useEffect on client
  user: null,
  settings: null,
  setAuth: (token, user, settings) => {
    localStorage.setItem('drift-deck-token', token);
    set({ token, user, settings, theme: settings.theme });
    // Apply theme loaded from backend settings
    document.body.className = `theme-${settings.theme} antialiased min-h-screen`;
  },
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...newSettings } : null,
    })),
  logout: () => {
    localStorage.removeItem('drift-deck-token');
    set({ token: null, user: null, settings: null, masterKey: null, activeTab: 'dashboard' });
  },

  // Navigation
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  currentFolderId: null,
  setCurrentFolderId: (id) => set({ currentFolderId: id }),
  folderPath: [],
  setFolderPath: (folderPath) => set({ folderPath }),
  pushFolderPath: (folder) =>
    set((state) => ({ folderPath: [...state.folderPath, folder], currentFolderId: folder.id })),
  popFolderPath: () =>
    set((state) => {
      const nextPath = state.folderPath.slice(0, -1);
      const nextFolderId = nextPath.length > 0 ? nextPath[nextPath.length - 1].id : null;
      return { folderPath: nextPath, currentFolderId: nextFolderId };
    }),

  // Data Cache
  files: [],
  setFiles: (files) => set({ files }),
  folders: [],
  setFolders: (folders) => set({ folders }),

  // Upload Queue
  uploadQueue: [],
  addToUploadQueue: (item) => set((state) => ({ uploadQueue: [...state.uploadQueue, item] })),
  updateUploadProgress: (id, progress) =>
    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) => (item.id === id ? { ...item, progress } : item)),
    })),
  setUploadStatus: (id, status) =>
    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) => (item.id === id ? { ...item, status } : item)),
    })),
  clearUploadQueue: () => set({ uploadQueue: [] }),

  // Zero-Knowledge Master Key
  masterKey: null,
  setMasterKey: (masterKey) => set({ masterKey }),
}));
