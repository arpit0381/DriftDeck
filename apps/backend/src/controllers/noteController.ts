import { Response } from 'express';
import { supabase } from '../config/supabase.js';
import { AuthRequest } from '../middleware/auth.js';

export async function createNote(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const { title, content } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  if (!title) return res.status(400).json({ error: 'Note title is required' });

  try {
    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        user_id: userId,
        title,
        content: content || '',
      })
      .select()
      .single();

    if (error || !note) {
      console.error('Create Note Error:', error);
      return res.status(500).json({ error: 'Failed to create note' });
    }

    // Log Activity
    await supabase.from('activities').insert({
      user_id: userId,
      type: 'EDIT_NOTE',
      note_id: note.id,
      details: { title: note.title },
    });

    return res.status(201).json(note);
  } catch (error) {
    return res.status(500).json({ error: 'Server error creating note' });
  }
}

export async function listNotes(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return res.status(200).json(notes || []);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve notes' });
  }
}

export async function getNote(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: note, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !note) {
      return res.status(404).json({ error: 'Note not found or permission denied' });
    }

    return res.status(200).json(note);
  } catch (error) {
    return res.status(500).json({ error: 'Server error fetching note' });
  }
}

export async function updateNote(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const { id } = req.params;
  const { title, content, isFavorite } = req.body;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (isFavorite !== undefined) updateData.is_favorite = isFavorite;

    const { data: note, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !note) {
      return res.status(404).json({ error: 'Note not found or permission denied' });
    }

    // Log Activity for content edits
    if (content !== undefined || title !== undefined) {
      await supabase.from('activities').insert({
        user_id: userId,
        type: 'EDIT_NOTE',
        note_id: note.id,
        details: { title: note.title },
      });
    }

    return res.status(200).json(note);
  } catch (error) {
    return res.status(500).json({ error: 'Server error updating note' });
  }
}

export async function deleteNote(req: AuthRequest, res: Response) {
  const userId = req.user?.userId;
  const { id } = req.params;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete Note Error:', error);
      return res.status(500).json({ error: 'Failed to delete note' });
    }

    return res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error deleting note' });
  }
}
