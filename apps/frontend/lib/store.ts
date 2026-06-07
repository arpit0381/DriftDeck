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

  // Navigation History (Google/Apple manager style)
  historyStack: { folderId: string | null; folderPath: Folder[] }[];
  historyIndex: number;
  navigateToFolderWithHistory: (folderId: string | null, path: Folder[]) => void;
  navigateHistoryBack: () => void;
  navigateHistoryForward: () => void;

  // Sidebar & View Mode Layouts
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  detailsPanelOpen: boolean;
  setDetailsPanelOpen: (open: boolean) => void;

  // Multi-selection
  selectedItemIds: string[];
  setSelectedItemIds: (ids: string[]) => void;
  toggleSelectedItem: (id: string) => void;
  clearSelection: () => void;

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
    set({
      token: null,
      user: null,
      settings: null,
      masterKey: null,
      activeTab: 'dashboard',
      selectedItemIds: [],
      historyStack: [{ folderId: null, folderPath: [] }],
      historyIndex: 0,
    });
  },

  // Navigation
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  currentFolderId: null,
  setCurrentFolderId: (id) =>
    set((state) => {
      // If we directly change folder (e.g. from header), clear selection
      return { currentFolderId: id, selectedItemIds: [] };
    }),
  folderPath: [],
  setFolderPath: (folderPath) => set({ folderPath }),
  pushFolderPath: (folder) =>
    set((state) => {
      const nextPath = [...state.folderPath, folder];
      const nextFolderId = folder.id;
      // Add to navigation history
      const newStack = state.historyStack.slice(0, state.historyIndex + 1);
      newStack.push({ folderId: nextFolderId, folderPath: nextPath });
      return {
        folderPath: nextPath,
        currentFolderId: nextFolderId,
        historyStack: newStack,
        historyIndex: newStack.length - 1,
        selectedItemIds: [], // reset selection
      };
    }),
  popFolderPath: () =>
    set((state) => {
      const nextPath = state.folderPath.slice(0, -1);
      const nextFolderId = nextPath.length > 0 ? nextPath[nextPath.length - 1].id : null;
      // Add to navigation history
      const newStack = state.historyStack.slice(0, state.historyIndex + 1);
      newStack.push({ folderId: nextFolderId, folderPath: nextPath });
      return {
        folderPath: nextPath,
        currentFolderId: nextFolderId,
        historyStack: newStack,
        historyIndex: newStack.length - 1,
        selectedItemIds: [], // reset selection
      };
    }),

  // Navigation History
  historyStack: [{ folderId: null, folderPath: [] }],
  historyIndex: 0,
  navigateToFolderWithHistory: (folderId, path) =>
    set((state) => {
      const newStack = state.historyStack.slice(0, state.historyIndex + 1);
      newStack.push({ folderId, folderPath: path });
      return {
        currentFolderId: folderId,
        folderPath: path,
        historyStack: newStack,
        historyIndex: newStack.length - 1,
        selectedItemIds: [],
      };
    }),
  navigateHistoryBack: () =>
    set((state) => {
      if (state.historyIndex > 0) {
        const nextIndex = state.historyIndex - 1;
        const target = state.historyStack[nextIndex];
        return {
          historyIndex: nextIndex,
          currentFolderId: target.folderId,
          folderPath: target.folderPath,
          selectedItemIds: [],
        };
      }
      return {};
    }),
  navigateHistoryForward: () =>
    set((state) => {
      if (state.historyIndex < state.historyStack.length - 1) {
        const nextIndex = state.historyIndex + 1;
        const target = state.historyStack[nextIndex];
        return {
          historyIndex: nextIndex,
          currentFolderId: target.folderId,
          folderPath: target.folderPath,
          selectedItemIds: [],
        };
      }
      return {};
    }),

  // Sidebar & View Mode
  sidebarCollapsed: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  viewMode: 'list',
  setViewMode: (viewMode) => set({ viewMode }),
  detailsPanelOpen: true, // open by default on desktop for premium feel
  setDetailsPanelOpen: (detailsPanelOpen) => set({ detailsPanelOpen }),

  // Multi-selection
  selectedItemIds: [],
  setSelectedItemIds: (selectedItemIds) => set({ selectedItemIds }),
  toggleSelectedItem: (id) =>
    set((state) => {
      const exists = state.selectedItemIds.includes(id);
      const nextIds = exists
        ? state.selectedItemIds.filter((itemId) => itemId !== id)
        : [...state.selectedItemIds, id];
      return { selectedItemIds: nextIds };
    }),
  clearSelection: () => set({ selectedItemIds: [] }),

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
