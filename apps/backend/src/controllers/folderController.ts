import { Response } from 'express';
import { supabase } from '../config/supabase.js';
import { AuthRequest } from '../middleware/auth.js';

export async function createFolder(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const { name, parentFolderId, color } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!name) return res.status(400).json({ error: 'Folder name is required' });

  try {
    const { data: folder, error } = await supabase
      .from('folders')
      .insert({
        user_id: userId,
        name,
        parent_folder_id: parentFolderId || null,
        color: color || '#3b82f6',
      })
      .select()
      .single();

    if (error || !folder) {
      console.error('Create Folder Error:', error);
      return res.status(500).json({ error: 'Failed to create folder' });
    }

    return res.status(201).json(folder);
  } catch (error) {
    return res.status(500).json({ error: 'Server error creating folder' });
  }
}

export async function listFolders(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const { parentFolderId } = req.query;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    let query = supabase.from('folders').select('*').eq('user_id', userId);

    if (parentFolderId === 'root') {
      query = query.is('parent_folder_id', null);
    } else if (parentFolderId) {
      query = query.eq('parent_folder_id', parentFolderId);
    }

    const { data: folders, error } = await query;
    if (error) throw error;

    return res.status(200).json(folders || []);
  } catch (error) {
    console.error('List Folders Error:', error);
    return res.status(500).json({ error: 'Failed to fetch folders' });
  }
}

export async function renameFolder(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const { id } = req.params;
  const { name, color } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (name) updateData.name = name;
    if (color) updateData.color = color;

    const { data: folder, error } = await supabase
      .from('folders')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !folder) {
      return res.status(404).json({ error: 'Folder not found or permission denied' });
    }

    return res.status(200).json(folder);
  } catch (error) {
    return res.status(500).json({ error: 'Server error updating folder' });
  }
}

export async function deleteFolder(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Delete folders recursive (Postgres ON DELETE CASCADE will handle child folders)
    const { error } = await supabase
      .from('folders')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete Folder Error:', error);
      return res.status(500).json({ error: 'Failed to delete folder' });
    }

    return res.status(200).json({ message: 'Folder deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error deleting folder' });
  }
}
