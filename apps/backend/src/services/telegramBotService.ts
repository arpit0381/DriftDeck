import TelegramBot from 'node-telegram-bot-api';
import { supabase } from '../config/supabase.js';

// Get bot instance dynamically based on default or user's custom settings
export async function getTelegramBotInstance(userId?: string): Promise<{ bot: TelegramBot; channelId: string }> {
  let token = process.env.TELEGRAM_BOT_TOKEN || '';
  let channelId = process.env.TELEGRAM_CHANNEL_ID || '';

  if (userId) {
    // Check if user has connected their own bot & channel
    const { data: settings } = await supabase
      .from('settings')
      .select('telegram_bot_token, telegram_channel_id')
      .eq('user_id', userId)
      .single();

    if (settings?.telegram_bot_token && settings?.telegram_channel_id) {
      token = settings.telegram_bot_token;
      channelId = String(settings.telegram_channel_id);
    }
  }

  if (!token || !channelId) {
    throw new Error('Telegram Bot Credentials not configured');
  }

  // Create bot without polling (webhook mode or just API client)
  const bot = new TelegramBot(token, { polling: false });
  return { bot, channelId };
}

// Upload file to Telegram channel via Bot API
export async function uploadToTelegramBot(
  userId: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ fileId: string; messageId: number; channelId: number }> {
  const { bot, channelId } = await getTelegramBotInstance(userId);

  // Send document to channel
  const message = await bot.sendDocument(
    channelId,
    fileBuffer,
    {
      caption: `Drift Deck Upload: ${fileName}`,
    },
    {
      filename: fileName,
      contentType: mimeType,
    }
  );

  let fileId = '';

  if (message.document) {
    fileId = message.document.file_id;
  } else if (message.photo && message.photo.length > 0) {
    // Grab highest res photo
    fileId = message.photo[message.photo.length - 1].file_id;
  } else if (message.video) {
    fileId = message.video.file_id;
  } else if (message.audio) {
    fileId = message.audio.file_id;
  } else {
    throw new Error('Telegram did not return a valid file reference');
  }

  return {
    fileId,
    messageId: message.message_id,
    channelId: Number(channelId),
  };
}

// Retrieve direct download URL from Telegram Bot API
export async function getTelegramBotFileUrl(userId: string, fileId: string): Promise<string> {
  let token = process.env.TELEGRAM_BOT_TOKEN || '';

  if (userId) {
    const { data: settings } = await supabase
      .from('settings')
      .select('telegram_bot_token')
      .eq('user_id', userId)
      .single();

    if (settings?.telegram_bot_token) {
      token = settings.telegram_bot_token;
    }
  }

  const { bot } = await getTelegramBotInstance(userId);
  const file = await bot.getFile(fileId);
  
  if (!file.file_path) {
    throw new Error('Failed to resolve file path on Telegram servers');
  }

  return `https://api.telegram.org/file/bot${token}/${file.file_path}`;
}
