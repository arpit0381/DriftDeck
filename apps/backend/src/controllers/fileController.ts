import { Response } from 'express';
import { supabase } from '../config/supabase.js';
import { uploadToTelegramBot, getTelegramBotFileUrl } from '../services/telegramBotService.js';
import { uploadLargeFileMTProto, downloadFileMTProto } from '../services/telegramMTProtoService.js';
import { AuthRequest } from '../middleware/auth.js';

// Max file size for standard Bot API upload (20MB)
const BOT_API_LIMIT = 20 * 1024 * 1024;

export async function uploadFile(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const file = req.file;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!file) return res.status(400).json({ error: 'No file provided' });

  const { originalname, mimetype, size, buffer } = file;
  const folderId = req.body.folderId || null;
  const isEncrypted = req.body.isEncrypted === 'true';
  const encryptionSalt = req.body.encryptionSalt || null;

  try {
    let telegramRef;

    // Direct large vs small upload route
    if (size > BOT_API_LIMIT) {
      telegramRef = await uploadLargeFileMTProto(userId, buffer, originalname, mimetype);
    } else {
      telegramRef = await uploadToTelegramBot(userId, buffer, originalname, mimetype);
    }

    const { fileId, messageId, channelId } = telegramRef;

    // Create file record in database
    const { data: dbFile, error: insertError } = await supabase
      .from('files')
      .insert({
        user_id: userId,
        folder_id: folderId,
        name: originalname,
        telegram_message_id: messageId,
        telegram_channel_id: channelId,
        size,
        mime_type: mimetype,
        is_encrypted: isEncrypted,
        encryption_salt: encryptionSalt,
      })
      .select()
      .single();

    if (insertError || !dbFile) {
      console.error('DB Insert Error:', insertError);
      return res.status(500).json({ error: 'Failed to record file in metadata database' });
    }

    // Log Activity
    await supabase.from('activities').insert({
      user_id: userId,
      type: 'UPLOAD',
      file_id: dbFile.id,
      details: { fileName: originalname, size },
    });

    return res.status(201).json(dbFile);
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to upload file to Telegram Cloud' });
  }
}

export async function listFiles(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { folderId, inTrash, isFavorite, mimeTypeGroup, search, tagId } = req.query;

  try {
    let query = supabase
      .from('files')
      .select('*, file_tags!inner(tag_id)') // If filtering by tag, join file_tags
      .eq('user_id', userId);

    // Filter by Trash status
    if (inTrash === 'true') {
      query = query.eq('is_in_trash', true);
    } else {
      query = query.eq('is_in_trash', false);
    }

    // Filter by folder (root is null)
    if (folderId === 'root') {
      query = query.is('folder_id', null);
    } else if (folderId) {
      query = query.eq('folder_id', folderId);
    }

    // Filter by Favorite
    if (isFavorite === 'true') {
      query = query.eq('is_favorite', true);
    }

    // Search by keyword
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Tag filtering
    if (tagId) {
      query = query.eq('file_tags.tag_id', tagId);
    }

    let { data: files, error } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', userId)
      .eq('is_in_trash', inTrash === 'true');

    if (error) throw error;

    if (!files) files = [];

    // Fallback manual filtering for folder / searches if database triggers complex joins
    if (folderId === 'root') {
      files = files.filter(f => f.folder_id === null);
    } else if (folderId) {
      files = files.filter(f => f.folder_id === folderId);
    }

    if (isFavorite === 'true') {
      files = files.filter(f => f.is_favorite === true);
    }

    if (search) {
      const searchStr = String(search).toLowerCase();
      files = files.filter(f => f.name.toLowerCase().includes(searchStr));
    }

    // Filter by MimeType groups
    if (mimeTypeGroup) {
      const group = String(mimeTypeGroup).toLowerCase();
      files = files.filter(f => {
        if (group === 'image') return f.mime_type.startsWith('image/');
        if (group === 'video') return f.mime_type.startsWith('video/');
        if (group === 'audio') return f.mime_type.startsWith('audio/');
        if (group === 'document') return f.mime_type.includes('pdf') || f.mime_type.includes('word') || f.mime_type.includes('excel') || f.mime_type.includes('text/') || f.mime_type.includes('markdown');
        return true;
      });
    }

    return res.status(200).json(files);
  } catch (error) {
    console.error('List Files Error:', error);
    return res.status(500).json({ error: 'Failed to fetch files' });
  }
}

export async function downloadFile(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: file, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !file) {
      return res.status(404).json({ error: 'File metadata not found' });
    }

    // Verify ownership
    if (file.user_id !== userId) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Log Activity
    await supabase.from('activities').insert({
      user_id: userId,
      type: 'DOWNLOAD',
      file_id: file.id,
      details: { fileName: file.name },
    });

    // Check size to decide path
    if (file.size > BOT_API_LIMIT) {
      // MTProto Download
      const buffer = await downloadFileMTProto(userId, file.telegram_message_id, String(file.telegram_channel_id));
      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      return res.send(buffer);
    } else {
      // MTProto download is extremely fast and has absolutely no size restrictions! Let's just download via MTProto!
      const buffer = await downloadFileMTProto(userId, Number(file.telegram_message_id), String(file.telegram_channel_id));
      res.setHeader('Content-Type', file.mime_type);
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
      return res.send(buffer);
    }
  } catch (error: any) {
    console.error('Download error:', error);
    return res.status(500).json({ error: error.message || 'Failed to download file from Telegram Cloud' });
  }
}

// Rename file
export async function renameFile(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const { id } = req.params;
  const { name } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const { data: file, error } = await supabase
      .from('files')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !file) return res.status(404).json({ error: 'File not found or permission denied' });
    return res.status(200).json(file);
  } catch (error) {
    return res.status(500).json({ error: 'Server error renaming file' });
  }
}

// Move file to a different folder
export async function moveFile(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const { id } = req.params;
  const { folderId } = req.body; // can be null for root

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: file, error } = await supabase
      .from('files')
      .update({ folder_id: folderId || null, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !file) return res.status(404).json({ error: 'File not found or permission denied' });
    return res.status(200).json(file);
  } catch (error) {
    return res.status(500).json({ error: 'Server error moving file' });
  }
}

// Soft delete to Trash
export async function deleteFile(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: file, error } = await supabase
      .from('files')
      .update({
        is_in_trash: true,
        trashed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !file) return res.status(404).json({ error: 'File not found or permission denied' });

    // Log Activity
    await supabase.from('activities').insert({
      user_id: userId,
      type: 'DELETE',
      file_id: file.id,
      details: { fileName: file.name },
    });

    return res.status(200).json(file);
  } catch (error) {
    return res.status(500).json({ error: 'Server error deleting file' });
  }
}

// Restore from Trash
export async function restoreFile(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: file, error } = await supabase
      .from('files')
      .update({
        is_in_trash: false,
        trashed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !file) return res.status(404).json({ error: 'File not found or permission denied' });

    // Log Activity
    await supabase.from('activities').insert({
      user_id: userId,
      type: 'RESTORE',
      file_id: file.id,
      details: { fileName: file.name },
    });

    return res.status(200).json(file);
  } catch (error) {
    return res.status(500).json({ error: 'Server error restoring file' });
  }
}

// Toggle Favorite
export async function toggleFavorite(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const { id } = req.params;
  const { isFavorite } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: file, error } = await supabase
      .from('files')
      .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !file) return res.status(404).json({ error: 'File not found or permission denied' });
    return res.status(200).json(file);
  } catch (error) {
    return res.status(500).json({ error: 'Server error modifying favorite status' });
  }
}

// Retrieve general statistics
export async function getFileStats(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: files, error } = await supabase
      .from('files')
      .select('size, mime_type')
      .eq('user_id', userId)
      .eq('is_in_trash', false);

    if (error) throw error;

    let totalSize = 0;
    let imageSize = 0;
    let videoSize = 0;
    let audioSize = 0;
    let documentSize = 0;
    let otherSize = 0;

    files.forEach((file) => {
      totalSize += Number(file.size);
      const mime = file.mime_type.toLowerCase();

      if (mime.startsWith('image/')) {
        imageSize += Number(file.size);
      } else if (mime.startsWith('video/')) {
        videoSize += Number(file.size);
      } else if (mime.startsWith('audio/')) {
        audioSize += Number(file.size);
      } else if (
        mime.includes('pdf') ||
        mime.includes('word') ||
        mime.includes('excel') ||
        mime.includes('text/') ||
        mime.includes('markdown')
      ) {
        documentSize += Number(file.size);
      } else {
        otherSize += Number(file.size);
      }
    });

    return res.status(200).json({
      totalFiles: files.length,
      totalSize,
      categories: {
        images: imageSize,
        videos: videoSize,
        audio: audioSize,
        documents: documentSize,
        others: otherSize,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to aggregate statistics' });
  }
}
