import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { CustomFile } from 'telegram/client/uploads.js';
import { supabase } from '../config/supabase.js';
import bigInt from 'big-integer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const apiId = Number(process.env.TELEGRAM_API_ID) || 0;
const apiHash = process.env.TELEGRAM_API_HASH || '';

// Cached promises of connected clients keyed by bot token to prevent race conditions during concurrent requests
const connectionPromises: Record<string, Promise<{ client: TelegramClient; channelId: string }> | undefined> = {};

// Cached rate-limit expirations keyed by bot token
const rateLimitExpirations: Record<string, number> = {};

function getSessionFilePath(botToken: string): string {
  const tokenHash = crypto.createHash('sha256').update(botToken).digest('hex');
  return path.join(process.cwd(), `.session_${tokenHash}.dat`);
}

function loadSession(botToken: string): string {
  const filePath = getSessionFilePath(botToken);
  if (fs.existsSync(filePath)) {
    try {
      return fs.readFileSync(filePath, 'utf-8').trim();
    } catch (err) {
      console.error('[MTProto] Failed to read session file:', err);
    }
  }
  return '';
}

function saveSession(botToken: string, sessionString: string) {
  const filePath = getSessionFilePath(botToken);
  try {
    fs.writeFileSync(filePath, sessionString, 'utf-8');
  } catch (err) {
    console.error('[MTProto] Failed to save session file:', err);
  }
}

async function resolveBotCredentials(userId?: string): Promise<{ botToken: string; channelId: string }> {
  let botToken = process.env.TELEGRAM_BOT_TOKEN || '';
  let channelId = process.env.TELEGRAM_CHANNEL_ID || '';

  if (userId) {
    const { data: settings } = await supabase
      .from('settings')
      .select('telegram_bot_token, telegram_channel_id')
      .eq('user_id', userId)
      .single();

    if (settings?.telegram_bot_token && settings?.telegram_channel_id) {
      botToken = settings.telegram_bot_token;
      channelId = String(settings.telegram_channel_id);
    }
  }

  if (!botToken || !channelId) {
    throw new Error('Telegram credentials not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID in env or user settings.');
  }

  return { botToken, channelId };
}

export async function getMTProtoClient(userId?: string): Promise<{ client: TelegramClient; channelId: string }> {
  const { botToken, channelId } = await resolveBotCredentials(userId);

  if (!apiId || !apiHash) {
    throw new Error('TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in environment variables.');
  }

  // Check rate limit cache
  const expiration = rateLimitExpirations[botToken];
  if (expiration && Date.now() < expiration) {
    const remainingSeconds = Math.ceil((expiration - Date.now()) / 1000);
    throw new Error(`Telegram MTProto is currently rate-limited (FloodWait). Please wait ${remainingSeconds} more seconds before retrying, or connect your own Telegram bot token in settings.`);
  }

  // Check if we have an active connection or connection-in-progress promise
  if (connectionPromises[botToken]) {
    try {
      const result = await connectionPromises[botToken];
      if (result.client.connected) {
        return result;
      }
      // If it exists but got disconnected, delete it and create a new one
      delete connectionPromises[botToken];
    } catch (err) {
      delete connectionPromises[botToken];
    }
  }

  // Create a connection promise and store it in cache immediately to avoid race conditions
  const connectPromise = (async () => {
    const sessionString = loadSession(botToken);
    const stringSession = new StringSession(sessionString);
    const client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });

    await client.start({ botAuthToken: botToken });

    // Save session string on successful authorization so we bypass key exchange on next startup
    const newSessionString = client.session.save() as any;
    if (newSessionString && newSessionString !== sessionString) {
      saveSession(botToken, newSessionString);
    }

    return { client, channelId };
  })();

  connectionPromises[botToken] = connectPromise;

  // If connection fails, remove it from cache so the next request can retry, and check for FLOOD wait limits
  connectPromise.catch((err: any) => {
    delete connectionPromises[botToken];

    if (err && (err.errorMessage === 'FLOOD' || err.message?.includes('FLOOD') || err.seconds)) {
      const waitSeconds = err.seconds || 1200;
      console.warn(`[MTProto] Telegram auth FLOOD wait detected. Caching block for ${waitSeconds} seconds.`);
      rateLimitExpirations[botToken] = Date.now() + (waitSeconds * 1000);
    }
  });

  return connectPromise;
}


export async function uploadLargeFileMTProto(
  userId: string,
  filePath: string,
  fileSize: number,
  fileName: string,
  mimeType: string,
  onProgress?: (progress: number) => void
): Promise<{ fileId: string; messageId: number; channelId: number }> {
  const { client, channelId } = await getMTProtoClient(userId);

  const toUpload = new CustomFile(fileName, fileSize, filePath);

  const uploadedFile = await client.uploadFile({
    file: toUpload,
    workers: 4,
    onProgress: onProgress ? (p: number) => onProgress(p) : undefined,
  });

  const entity = await client.getEntity(channelId);
  const result = (await client.sendFile(entity, {
    file: uploadedFile,
    caption: `☁️ Drift Deck: ${fileName}`,
    forceDocument: true,
    attributes: [new Api.DocumentAttributeFilename({ fileName })],
  })) as Api.Message;

  const media = result.media as Api.MessageMediaDocument;
  const document = media.document as Api.Document;

  return {
    fileId: document.id.toString(),
    messageId: result.id,
    channelId: Number(channelId.replace('-100', '')),
  };
}

export async function downloadFileMTProto(
  userId: string,
  messageId: number,
  channelId: string,
  onProgress?: (progress: number) => void
): Promise<Buffer> {
  const { client } = await getMTProtoClient(userId);

  // Normalise channel ID to full format
  const fullChannelId = channelId.startsWith('-100') ? channelId : `-100${channelId}`;
  const entity = await client.getEntity(fullChannelId);

  const messages = await client.getMessages(entity, { ids: [messageId] });
  if (!messages?.length || !messages[0]?.media) {
    throw new Error('Message or media not found in Telegram channel.');
  }

  const buffer = await client.downloadMedia(messages[0].media, {
    progressCallback: onProgress ? (p: any) => onProgress(p) : undefined,
  });

  if (!buffer) throw new Error('Download returned empty buffer.');
  return buffer as Buffer;
}

export async function streamMediaMTProto(
  userId: string,
  messageId: number,
  channelId: string,
  res: any,
  start: number,
  end: number
) {
  const { client } = await getMTProtoClient(userId);

  const fullChannelId = channelId.startsWith('-100') ? channelId : `-100${channelId}`;
  const entity = await client.getEntity(fullChannelId);

  const messages = await client.getMessages(entity, { ids: [messageId] });
  if (!messages?.length || !messages[0]?.media) {
    throw new Error('Message or media not found in Telegram channel.');
  }

  const media = messages[0].media;
  const CHUNK_SIZE = 512 * 1024; // Telegram MTProto chunk size is typically 512KB
  const alignedStart = Math.floor(start / CHUNK_SIZE) * CHUNK_SIZE;
  let skipBytes = start - alignedStart;
  let bytesToRead = end - start + 1;

  try {
    for await (const chunk of client.iterDownload({
      file: media,
      offset: bigInt(alignedStart),
      requestSize: 512 * 1024,
    })) {
      let data = chunk as Buffer;
      if (skipBytes > 0) {
        data = data.subarray(skipBytes);
        skipBytes = 0;
      }
      if (data.length > bytesToRead) {
        data = data.subarray(0, bytesToRead);
      }
      
      res.write(data);
      bytesToRead -= data.length;
      
      if (bytesToRead <= 0) break;
    }
  } catch (err) {
    console.error('Error streaming from MTProto:', err);
  } finally {
    res.end();
  }
}
