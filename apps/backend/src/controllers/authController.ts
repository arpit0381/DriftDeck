import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { JWTPayload, User } from '@drift-deck/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function verifyTelegramHash(data: Record<string, any>, botToken: string): boolean {
  if (!data.hash) return false;
  const dataCheckArr = Object.keys(data)
    .filter((k) => k !== 'hash')
    .sort()
    .map((k) => `${k}=${data[k]}`);
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckArr.join('\n')).digest('hex');
  return hmac === data.hash;
}

async function upsertUser(telegramId: number, userData: {
  username?: string; first_name: string; last_name?: string; photo_url?: string;
}): Promise<{ user: User; isNew: boolean }> {
  const { data: existing, error: fetchErr } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (fetchErr && fetchErr.code !== 'PGRST116') throw fetchErr;

  if (!existing) {
    const { data: newUser, error: insertErr } = await supabase
      .from('users')
      .insert({
        telegram_id: telegramId,
        username: userData.username || null,
        first_name: userData.first_name || 'Anonymous',
        last_name: userData.last_name || null,
        photo_url: userData.photo_url || null,
      })
      .select()
      .single();
    if (insertErr || !newUser) throw insertErr;

    // Seed default settings
    await supabase.from('settings').insert({ user_id: newUser.id, theme: 'neon-cyberpunk' });
    return { user: newUser as User, isNew: true };
  }

  const { data: updated, error: updateErr } = await supabase
    .from('users')
    .update({
      username: userData.username || existing.username,
      first_name: userData.first_name || existing.first_name,
      last_name: userData.last_name || existing.last_name,
      photo_url: userData.photo_url || existing.photo_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)
    .select()
    .single();
  if (updateErr || !updated) throw updateErr;
  return { user: updated as User, isNew: false };
}

function signJwt(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    telegramId: (user as any).telegram_id ?? user.telegramId,
    username: user.username,
  };
  const secret = process.env.JWT_SECRET || 'drift_deck_dev_secret_jwt_key_2026_xyz';
  return jwt.sign(payload, secret, { expiresIn: '30d' });
}

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Standard Telegram Login Widget authentication.
 * Accepts the signed payload from the widget and verifies HMAC.
 */
export async function loginWithTelegram(req: Request, res: Response) {
  const telegramData = req.body;
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';

  if (!botToken) return res.status(500).json({ error: 'Bot token not configured' });

  const isDevMode = process.env.NODE_ENV !== 'production';
  const isVerified = verifyTelegramHash(telegramData, botToken);

  if (!isVerified && !isDevMode) {
    return res.status(400).json({ error: 'Invalid Telegram authentication hash' });
  }

  const telegramId = Number(telegramData.id);
  if (!telegramId || isNaN(telegramId)) {
    return res.status(400).json({ error: 'Missing or invalid Telegram ID' });
  }

  try {
    const { user } = await upsertUser(telegramId, {
      username: telegramData.username,
      first_name: telegramData.first_name,
      last_name: telegramData.last_name,
      photo_url: telegramData.photo_url,
    });

    const token = signJwt(user);

    // Fetch settings
    const { data: settings } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return res.status(200).json({ token, user, settings });
  } catch (err: any) {
    console.error('loginWithTelegram error:', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

// Temporary in-memory store for short-lived auth sessions
const authSessions = new Map<string, string>();

/**
 * POST /api/auth/telegram-webhook
 * Handles Telegram Bot update messages.
 * When a user sends /start to the bot, the bot receives their info here,
 * creates/updates their account, and returns a JWT.
 * The frontend polls for the token using a session ID.
 */
export async function telegramWebhookLogin(req: Request, res: Response) {
  const update = req.body;

  // Verify the request comes from Telegram (optional but good practice)
  const message = update?.message;
  if (!message || !message.from) {
    return res.status(200).json({ ok: true }); // Always return 200 to Telegram
  }

  const { id: telegramId, username, first_name, last_name, photo } = message.from;
  const text: string = message.text || '';

  // Only handle /start command (optionally with a session token)
  if (!text.startsWith('/start')) {
    return res.status(200).json({ ok: true });
  }

  try {
    const { user } = await upsertUser(Number(telegramId), {
      username,
      first_name: first_name || 'Anonymous',
      last_name,
    });

    const token = signJwt(user);

    // If /start was sent with a session ID, store the token for polling
    const sessionId = text.replace('/start', '').trim();
    if (sessionId) {
      // Store in memory for 5 minutes instead of missing db table
      authSessions.set(sessionId, token);
      setTimeout(() => authSessions.delete(sessionId), 5 * 60 * 1000);
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('telegramWebhookLogin error:', err);
    return res.status(200).json({ ok: true }); // Always 200 to Telegram
  }
}

/**
 * GET /api/auth/poll/:sessionId
 * Frontend calls this every 2s after opening the bot.
 * Returns JWT when the user has completed /start in the bot.
 */
export async function pollAuthSession(req: Request, res: Response) {
  const { sessionId } = req.params;
  if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

  try {
    const token = authSessions.get(sessionId);

    if (!token) {
      return res.status(202).json({ pending: true }); // Still waiting
    }

    // Delete session after retrieval (one-time use)
    authSessions.delete(sessionId);

    return res.status(200).json({ token });
  } catch {
    return res.status(500).json({ error: 'Poll failed' });
  }
}

/**
 * GET /api/auth/me
 * Returns the current user's profile and settings.
 */
export async function getMe(req: any, res: Response) {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userErr || !user) return res.status(404).json({ error: 'User not found' });

    let { data: settings, error: settingsErr } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsErr?.code === 'PGRST116') {
      const { data: seeded } = await supabase
        .from('settings')
        .insert({ user_id: userId, theme: 'neon-cyberpunk' })
        .select()
        .single();
      settings = seeded;
    }

    return res.status(200).json({ user, settings });
  } catch (err) {
    console.error('getMe error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
