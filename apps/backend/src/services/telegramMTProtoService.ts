import { TelegramClient, Api } from 'gramjs';
import { StringSession } from 'gramjs/sessions/index.js';
import { CustomFile } from 'gramjs/client/uploads.js';
import { getTelegramBotInstance } from './telegramBotService.js';

const apiId = Number(process.env.TELEGRAM_API_ID) || 0;
const apiHash = process.env.TELEGRAM_API_HASH || '';

// Centralized cache of authenticated GramJS client instances
const clientCache: Record<string, TelegramClient> = {};

export async function getMTProtoClient(userId?: string): Promise<{ client: TelegramClient; channelId: string }> {
  // 1. Resolve credentials
  let botToken = process.env.TELEGRAM_BOT_TOKEN || '';
  let channelId = process.env.TELEGRAM_CHANNEL_ID || '';

  // Get bot token and channel ID from environment or user settings
  const botInfo = await getTelegramBotInstance(userId);
  botToken = botInfo.bot.token;
  channelId = botInfo.channelId;

  const cacheKey = botToken;

  if (clientCache[cacheKey]) {
    const cachedClient = clientCache[cacheKey];
    if (cachedClient.connected) {
      return { client: cachedClient, channelId };
    }
  }

  if (!apiId || !apiHash) {
    throw new Error('TELEGRAM_API_ID and TELEGRAM_API_HASH must be configured in environment');
  }

  // Create an MTProto client using a StringSession
  const stringSession = new StringSession('');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });

  // Start client using botAuthToken
  await client.start({
    botAuthToken: botToken,
  });

  clientCache[cacheKey] = client;
  return { client, channelId };
}

// Upload large file in chunks using GramJS MTProto
export async function uploadLargeFileMTProto(
  userId: string,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  onProgress?: (progress: number) => void
): Promise<{ fileId: string; messageId: number; channelId: number }> {
  const { client, channelId } = await getMTProtoClient(userId);

  // Wrap buffer into custom file format GramJS expects
  const toUpload = new CustomFile(fileName, fileBuffer.length, fileName, fileBuffer);

  // Upload file to Telegram servers
  const uploadedFile = await client.uploadFile({
    file: toUpload,
    workers: 4,
    onProgress: onProgress ? (progress: number) => onProgress(progress) : undefined,
  });

  // Post document message to channel
  const entity = await client.getEntity(channelId);
  const result = await client.sendFile(entity, {
    file: uploadedFile,
    caption: `Drift Deck Upload (Large): ${fileName}`,
    attributes: [
      new Api.DocumentAttributeFilename({
        fileName: fileName,
      }),
    ],
  }) as Api.Message;

  // Extract file ID from resulting message
  const media = result.media as Api.MessageMediaDocument;
  const document = media.document as Api.Document;
  
  // Format standard Bot API compatible file_id or MTProto file location variables
  // Since we'll store and fetch via MTProto in backend, we can store the Document ID
  const documentId = document.id.toString();

  return {
    fileId: documentId, // Save the GramJS document ID
    messageId: result.id,
    channelId: Number(channelId.replace('-100', '')),
  };
}

// Download or Stream files directly from MTProto
export async function downloadFileMTProto(
  userId: string,
  messageId: number,
  channelId: string,
  onProgress?: (progress: number) => void
): Promise<Buffer> {
  const { client } = await getMTProtoClient(userId);

  // Parse target channel entity
  const fullChannelId = channelId.startsWith('-100') ? channelId : `-100${channelId}`;
  const entity = await client.getEntity(fullChannelId);

  // Fetch target message
  const messages = await client.getMessages(entity, { ids: [messageId] });
  if (!messages || messages.length === 0 || !messages[0].media) {
    throw new Error('Message or media not found');
  }

  const media = messages[0].media;

  // Download media buffer
  const buffer = await client.downloadMedia(media, {
    workers: 4,
    progressCallback: onProgress ? (progress: any) => onProgress(progress) : undefined,
  });

  if (!buffer) {
    throw new Error('Failed to download file from MTProto stream');
  }

  return buffer as Buffer;
}
