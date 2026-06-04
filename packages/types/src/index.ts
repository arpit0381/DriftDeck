export interface User {
  id: string;
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  userId: string;
  name: string;
  parentFolderId?: string | null;
  color?: string; // hex or css class
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FileMetadata {
  id: string;
  userId: string;
  folderId?: string | null;
  name: string;
  telegramMessageId: number;
  telegramChannelId: number;
  size: number;
  mimeType: string;
  isEncrypted: boolean;
  encryptionSalt?: string | null;
  isFavorite: boolean;
  isInTrash: boolean;
  trashedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Share {
  id: string;
  fileId: string;
  sharedBy: string;
  isPublic: boolean;
  passwordHash?: string | null;
  expiresAt?: string | null;
  downloadCount: number;
  allowedDownloads?: number | null;
  createdAt: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  isFavorite: boolean;
  telegramMessageId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  userId: string;
  type: 'UPLOAD' | 'DOWNLOAD' | 'DELETE' | 'RESTORE' | 'SHARE' | 'EDIT_NOTE';
  fileId?: string | null;
  noteId?: string | null;
  details?: Record<string, any> | null;
  createdAt: string;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Settings {
  userId: string;
  theme: 'neon-cyberpunk' | 'midnight-glass' | 'crimson-void' | 'aurora-green' | 'solar-gold';
  telegramBotToken?: string | null;
  telegramChannelId?: number | null;
  encKeySalt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JWTPayload {
  userId: string;
  telegramId: number;
  username?: string;
}
