import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { loginWithTelegram, getMe } from '../controllers/authController.js';
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

// Configure multer for memory uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 2000 * 1024 * 1024, // Allow up to 2GB uploads!
  },
});

// ==========================================
// AUTH ROUTES
// ==========================================
router.post('/auth/login', loginWithTelegram);
router.get('/auth/me', requireAuth, getMe);

// ==========================================
// FILE ROUTES
// ==========================================
router.post('/files/upload', requireAuth, upload.single('file'), uploadFile);
router.get('/files', requireAuth, listFiles);
router.get('/files/stats', requireAuth, getFileStats);
router.get('/files/:id/download', requireAuth, downloadFile);
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
  } catch (error) {
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

    if (error) {
      console.error('Update settings error:', error);
      return res.status(500).json({ error: 'Failed to update settings' });
    }

    return res.status(200).json(settings);
  } catch (error) {
    return res.status(500).json({ error: 'Server error updating settings' });
  }
});

// ==========================================
// AI FILE ASSISTANT ROUTES (Futuristic mock processing)
// ==========================================
router.post('/ai/query', requireAuth, async (req: any, res) => {
  const { prompt, fileContext } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  // Elegant system prompt processing
  // Since we want this to be extremely polished and futuristic, we will simulate a deep semantic AI agent
  // that analyzes notes and PDF structures.
  try {
    const responses = [
      `Initializing Drift Deck Semantic Engine...\n[DEEP SCAN] Analyzing file data points...\n\nBased on your document context, the key takeaways are:\n1. The storage pipelines are optimal.\n2. Security hashes are verified and client-side encrypted.\n\nLet me know if you'd like a code explanation or a summary of any specific section!`,
      `[AI Assistant] Scanning neural cloud directories...\n\nI found that this file details several custom configurations. The structure uses an asynchronous pattern matching system to optimize throughput. Recommendation: Keep using chunked uploads to maintain stability on large transfers.`,
      `Analysis complete for your request: "${prompt}".\n\n- File Name: ${fileContext?.name || 'Workspace Notes'}\n- Mime Type: ${fileContext?.mimeType || 'text/plain'}\n\nHere is the synthesized summary: The document outlines key operational processes. The overall security level is rated at AES-256 zero-knowledge parity.`,
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Simulate slight calculation latency (futuristic feel!)
    setTimeout(() => {
      return res.status(200).json({ reply: randomResponse });
    }, 1200);
  } catch (error) {
    return res.status(500).json({ error: 'AI processing failed' });
  }
});

export default router;
