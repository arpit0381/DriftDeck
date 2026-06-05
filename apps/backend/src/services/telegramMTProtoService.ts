import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { CustomFile } from 'telegram/client/uploads.js';
import { supabase } from '../config/supabase.js';
import bigInt from 'big-integer';

const apiId = Number(process.env.TELEGRAM_API_ID) || 0;
const apiHash = process.env.TELEGRAM_API_HASH || '';

// Cached authenticated clients keyed by bot token
const clientCache: Record<string, TelegramClient> = {};

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

  // Return cached connected client
  const cached = clientCache[botToken];
  if (cached?.connected) {
    return { client: cached, channelId };
  }

  const stringSession = new StringSession('');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({ botAuthToken: botToken });

  clientCache[botToken] = client;
  return { client, channelId };
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
