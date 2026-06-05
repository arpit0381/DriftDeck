/**
 * Drift Deck API Client
 * Typed fetch wrappers for all backend endpoints.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// ─── Generic helper ───────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Don't force Content-Type for FormData uploads
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: import("@drift-deck/types").User;
}

export function loginWithTelegram(
  telegramData: Record<string, unknown>
): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(telegramData),
  });
}

export function getMe(
  token: string
): Promise<{ user: import("@drift-deck/types").User; settings: import("@drift-deck/types").Settings }> {
  return request("/auth/me", {}, token);
}

// ─── Files ───────────────────────────────────────────────────────────────────

export interface FileStats {
  totalFiles: number;
  totalSize: number;
  categories: {
    images: number;
    videos: number;
    audio: number;
    documents: number;
    others: number;
  };
}

export interface ListFilesParams {
  folderId?: string | null;
  inTrash?: boolean;
  isFavorite?: boolean;
  mimeTypeGroup?: string;
  search?: string;
}

export function listFiles(
  token: string,
  params: ListFilesParams = {}
): Promise<import("@drift-deck/types").FileMetadata[]> {
  const q = new URLSearchParams();
  if (params.folderId === null) q.set("folderId", "root");
  else if (params.folderId) q.set("folderId", params.folderId);
  if (params.inTrash !== undefined) q.set("inTrash", String(params.inTrash));
  if (params.isFavorite !== undefined) q.set("isFavorite", String(params.isFavorite));
  if (params.mimeTypeGroup) q.set("mimeTypeGroup", params.mimeTypeGroup);
  if (params.search) q.set("search", params.search);
  return request(`/files?${q.toString()}`, {}, token);
}

export function getFileStats(token: string): Promise<FileStats> {
  return request("/files/stats", {}, token);
}

export function uploadFile(
  token: string,
  file: File,
  folderId?: string | null,
  isEncrypted?: boolean,
  encryptionSalt?: string,
  onProgress?: (progress: number) => void
): Promise<import("@drift-deck/types").FileMetadata> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    if (folderId) form.append("folderId", folderId);
    if (isEncrypted) form.append("isEncrypted", "true");
    if (encryptionSalt) form.append("encryptionSalt", encryptionSalt);

    const xhr = new XMLHttpRequest();
    const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

    xhr.open("POST", `${url}/files/upload`, true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          reject(new Error("Failed to parse response"));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network error during upload"));
    };

    xhr.send(form);
  });
}

export function renameFile(
  token: string,
  id: string,
  name: string
): Promise<import("@drift-deck/types").FileMetadata> {
  return request(`/files/${id}/rename`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  }, token);
}

export function moveFile(
  token: string,
  id: string,
  folderId: string | null
): Promise<import("@drift-deck/types").FileMetadata> {
  return request(`/files/${id}/move`, {
    method: "PATCH",
    body: JSON.stringify({ folderId }),
  }, token);
}

export function toggleFileFavorite(
  token: string,
  id: string,
  isFavorite: boolean
): Promise<import("@drift-deck/types").FileMetadata> {
  return request(`/files/${id}/favorite`, {
    method: "PATCH",
    body: JSON.stringify({ isFavorite }),
  }, token);
}

export function deleteFile(
  token: string,
  id: string
): Promise<import("@drift-deck/types").FileMetadata> {
  return request(`/files/${id}`, { method: "DELETE" }, token);
}

export function restoreFile(
  token: string,
  id: string
): Promise<import("@drift-deck/types").FileMetadata> {
  return request(`/files/${id}/restore`, { method: "POST" }, token);
}

export function getFileDownloadUrl(id: string): string {
  return `${API_URL}/files/${id}/download`;
}

export function getFileStreamUrl(id: string, token: string): string {
  return `${API_URL}/files/${id}/stream?token=${token}`;
}

// ─── Folders ─────────────────────────────────────────────────────────────────

export function listFolders(
  token: string,
  parentFolderId?: string | null
): Promise<import("@drift-deck/types").Folder[]> {
  const q = new URLSearchParams();
  if (parentFolderId === null) q.set("parentFolderId", "root");
  else if (parentFolderId) q.set("parentFolderId", parentFolderId);
  return request(`/folders?${q.toString()}`, {}, token);
}

export function createFolder(
  token: string,
  name: string,
  parentFolderId?: string | null,
  color?: string
): Promise<import("@drift-deck/types").Folder> {
  return request("/folders", {
    method: "POST",
    body: JSON.stringify({ name, parentFolderId, color }),
  }, token);
}

export function renameFolder(
  token: string,
  id: string,
  name: string,
  color?: string
): Promise<import("@drift-deck/types").Folder> {
  return request(`/folders/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name, color }),
  }, token);
}

export function deleteFolder(
  token: string,
  id: string
): Promise<{ message: string }> {
  return request(`/folders/${id}`, { method: "DELETE" }, token);
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export function listNotes(
  token: string
): Promise<import("@drift-deck/types").Note[]> {
  return request("/notes", {}, token);
}

export function createNote(
  token: string,
  title: string,
  content?: string
): Promise<import("@drift-deck/types").Note> {
  return request("/notes", {
    method: "POST",
    body: JSON.stringify({ title, content }),
  }, token);
}

export function updateNote(
  token: string,
  id: string,
  data: { title?: string; content?: string; isFavorite?: boolean }
): Promise<import("@drift-deck/types").Note> {
  return request(`/notes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }, token);
}

export function deleteNote(
  token: string,
  id: string
): Promise<{ message: string }> {
  return request(`/notes/${id}`, { method: "DELETE" }, token);
}

// ─── Activities ───────────────────────────────────────────────────────────────

export function listActivities(
  token: string
): Promise<import("@drift-deck/types").Activity[]> {
  return request("/activities", {}, token);
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function updateSettings(
  token: string,
  data: {
    theme?: string;
    telegramBotToken?: string;
    telegramChannelId?: number;
    encKeySalt?: string;
  }
): Promise<import("@drift-deck/types").Settings> {
  return request("/settings", {
    method: "PATCH",
    body: JSON.stringify(data),
  }, token);
}

// ─── AI ──────────────────────────────────────────────────────────────────────

export function queryAI(
  token: string,
  prompt: string,
  fileContext?: { name: string; mimeType: string }
): Promise<{ reply: string }> {
  return request("/ai/query", {
    method: "POST",
    body: JSON.stringify({ prompt, fileContext }),
  }, token);
}
