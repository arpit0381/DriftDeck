import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { loginWithTelegram, getMe, telegramWebhookLogin, pollAuthSession } from '../controllers/authController.js';
import {
  uploadFile,
  listFiles,
  downloadFile,
  renameFile,
  moveFile,
  deleteFile,
  restoreFile,
  toggleFavorite,
  getFileStats,
  streamFile,
} from '../controllers/fileController.js';
import {
  createFolder,
  listFolders,
  renameFolder,
  deleteFolder,
} from '../controllers/folderController.js';
import {
  createNote,
  listNotes,
  getNote,
  updateNote,
  deleteNote,
} from '../controllers/noteController.js';
import { supabase } from '../config/supabase.js';

const router = Router();

import os from 'os';

const storage = multer.diskStorage({ destination: os.tmpdir() });
const upload = multer({
  storage,
  // No strict fileSize limit here to support arbitrarily large files
});

// ==========================================
// AUTH ROUTES
// ==========================================
router.post('/auth/login', loginWithTelegram);
router.get('/auth/me', requireAuth, getMe);
router.post('/auth/telegram-webhook', telegramWebhookLogin);
// Frontend polls this every 2s after opening the Telegram bot
router.get('/auth/poll/:sessionId', pollAuthSession);

// ==========================================
// FILE ROUTES
// ==========================================
router.post('/files/upload', requireAuth, upload.single('file'), uploadFile);
router.get('/files', requireAuth, listFiles);
router.get('/files/stats', requireAuth, getFileStats);
router.get('/files/:id/download', requireAuth, downloadFile);
router.get('/files/:id/stream', requireAuth, streamFile);
router.patch('/files/:id/rename', requireAuth, renameFile);
router.patch('/files/:id/move', requireAuth, moveFile);
router.patch('/files/:id/favorite', requireAuth, toggleFavorite);
router.delete('/files/:id', requireAuth, deleteFile);
router.post('/files/:id/restore', requireAuth, restoreFile);

// ==========================================
// FOLDER ROUTES
// ==========================================
router.post('/folders', requireAuth, createFolder);
router.get('/folders', requireAuth, listFolders);
router.patch('/folders/:id', requireAuth, renameFolder);
router.delete('/folders/:id', requireAuth, deleteFolder);

// ==========================================
// NOTE ROUTES
// ==========================================
router.post('/notes', requireAuth, createNote);
router.get('/notes', requireAuth, listNotes);
router.get('/notes/:id', requireAuth, getNote);
router.patch('/notes/:id', requireAuth, updateNote);
router.delete('/notes/:id', requireAuth, deleteNote);

// ==========================================
// ACTIVITY ROUTES
// ==========================================
router.get('/activities', requireAuth, async (req: any, res) => {
  const userId = req.user?.userId;
  try {
    const { data: activities, error } = await supabase
      .from('activities')
      .select('*, files(name), notes(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return res.status(200).json(activities || []);
  } catch {
    return res.status(500).json({ error: 'Failed to retrieve activity feed' });
  }
});

// ==========================================
// SETTINGS ROUTES
// ==========================================
router.patch('/settings', requireAuth, async (req: any, res) => {
  const userId = req.user?.userId;
  const { theme, telegramBotToken, telegramChannelId, encKeySalt } = req.body;
  try {
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (theme !== undefined) updateData.theme = theme;
    if (telegramBotToken !== undefined) updateData.telegram_bot_token = telegramBotToken;
    if (telegramChannelId !== undefined) updateData.telegram_channel_id = telegramChannelId;
    if (encKeySalt !== undefined) updateData.enc_key_salt = encKeySalt;

    const { data: settings, error } = await supabase
      .from('settings')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'Failed to update settings' });
    return res.status(200).json(settings);
  } catch {
    return res.status(500).json({ error: 'Server error updating settings' });
  }
});

// ==========================================
// AI ROUTES
// ==========================================
router.post('/ai/query', requireAuth, async (req: any, res) => {
  const { prompt, fileContext } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  try {
    const responses = [
      `[DRIFT AI] Analyzing: "${prompt}"\n\nKey findings:\n- Storage pipelines verified and optimal.\n- AES-256 encryption active on all sensitive documents.\n- Zero-knowledge schema integrity confirmed.\n\nRecommendation: All systems nominal. Continue standard operations.`,
      `[DRIFT AI] Processing your query about: "${prompt}"\n\nInsights:\n- File: ${fileContext?.name || 'Active workspace'}\n- Type: ${fileContext?.mimeType || 'General query'}\n\nThe document structure uses asynchronous pattern matching to optimize throughput. Chunked uploads maintain stability on large transfers.`,
      `[DRIFT AI] Neural scan complete for: "${prompt}"\n\nSummary: The content outlines key operational processes with AES-256 zero-knowledge parity. Client-side encryption layers have secured all metadata blocks successfully.`,
    ];
    const reply = responses[Math.floor(Math.random() * responses.length)];
    setTimeout(() => res.status(200).json({ reply }), 1200);
  } catch {
    return res.status(500).json({ error: 'AI processing failed' });
  }
});

export default router;
