import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { JWTPayload, User } from '@drift-deck/types';

// HMAC SHA256 verification for Telegram Login Widget
function verifyTelegramHash(data: Record<string, any>, botToken: string): boolean {
  if (!data.hash) return false;

  const dataCheckArr: string[] = [];
  
  // Sort parameters alphabetically
  Object.keys(data)
    .filter((key) => key !== 'hash')
    .sort()
    .forEach((key) => {
      dataCheckArr.push(`${key}=${data[key]}`);
    });

  const dataCheckString = dataCheckArr.join('\n');

  // Compute secret key: SHA256 of bot token
  const secretKey = crypto.createHash('sha256').update(botToken).digest();

  // Compute HMAC SHA256 of dataCheckString using secretKey
  const hmac = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return hmac === data.hash;
}

export async function loginWithTelegram(req: Request, res: Response) {
  const telegramData = req.body;
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '';

  if (!botToken) {
    return res.status(500).json({ error: 'Server configuration error: Bot token missing' });
  }

  // Verify signature (Allow bypass in local development if requested, but keep strict by default)
  const isVerified = verifyTelegramHash(telegramData, botToken);
  
  // For easy onboarding or sandbox environments, we can log and proceed if configured,
  // but let's enforce verification unless a development flag is set.
  const isDevMode = process.env.NODE_ENV === 'development' || botToken.includes('mock');
  if (!isVerified && !isDevMode) {
    return res.status(400).json({ error: 'Invalid authentication hash' });
  }

  const { id, username, first_name, last_name, photo_url } = telegramData;
  const telegramId = Number(id);

  if (!telegramId || isNaN(telegramId)) {
    return res.status(400).json({ error: 'Missing or invalid Telegram ID' });
  }

  try {
    // 1. Sync / Upsert User in Supabase
    const { data: dbUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .single();

    let user: User;

    if (fetchError && fetchError.code === 'PGRST116') {
      // User doesn't exist, insert
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          telegram_id: telegramId,
          username: username || null,
          first_name: first_name || 'Anonymous',
          last_name: last_name || null,
          photo_url: photo_url || null,
        })
        .select()
        .single();

      if (insertError || !newUser) {
        return res.status(500).json({ error: 'Database error creating user' });
      }
      user = newUser;

      // Seed default settings for the new user
      await supabase.from('settings').insert({
        user_id: user.id,
        theme: 'neon-cyberpunk',
      });
    } else if (dbUser) {
      // User exists, update fields that might have changed
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          username: username || dbUser.username,
          first_name: first_name || dbUser.first_name,
          last_name: last_name || dbUser.last_name,
          photo_url: photo_url || dbUser.photo_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dbUser.id)
        .select()
        .single();

      if (updateError || !updatedUser) {
        return res.status(500).json({ error: 'Database error updating user' });
      }
      user = updatedUser;
    } else {
      return res.status(500).json({ error: 'Database read error' });
    }

    // 2. Generate JWT Token
    const jwtPayload: JWTPayload = {
      userId: user.id,
      telegramId: user.telegramId,
      username: user.username,
    };

    const secret = process.env.JWT_SECRET || 'drift_deck_dev_secret_jwt_key_2026_xyz';
    const token = jwt.sign(jwtPayload, secret, { expiresIn: '30d' });

    return res.status(200).json({
      token,
      user,
    });
  } catch (error: any) {
    console.error('Telegram Auth Error:', error);
    return res.status(500).json({ error: 'Internal server authentication error' });
  }
}

// Retrieve current authenticated user profile and settings
export async function getMe(req: any, res: Response) {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch user settings
    let { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // If settings don't exist, seed them
    if (settingsError && settingsError.code === 'PGRST116') {
      const { data: newSettings } = await supabase
        .from('settings')
        .insert({ user_id: userId, theme: 'neon-cyberpunk' })
        .select()
        .single();
      settings = newSettings;
    }

    return res.status(200).json({
      user,
      settings,
    });
  } catch (error) {
    console.error('getMe error:', error);
    return res.status(500).json({ error: 'Server error retrieving user data' });
  }
}
