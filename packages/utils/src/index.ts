import CryptoJS from 'crypto-js';

// Format sizes
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Generate random salt (hex string)
export function generateRandomSalt(length = 32): string {
  return CryptoJS.lib.WordArray.random(length / 2).toString(CryptoJS.enc.Hex);
}

// Derive a cryptographic key from password and salt
export function deriveKey(password: string, salt: string): string {
  // Use PBKDF2 to derive key
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 1000,
  });
  return key.toString(CryptoJS.enc.Hex);
}

// Encrypt plain text using an derived key
export function encryptText(text: string, keyHex: string): string {
  const key = CryptoJS.enc.Hex.parse(keyHex);
  // Generate random IV
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  // Return IV concatenated with ciphertext in hex format
  return iv.toString(CryptoJS.enc.Hex) + encrypted.ciphertext.toString(CryptoJS.enc.Hex);
}

// Decrypt plain text using an derived key
export function decryptText(encryptedHex: string, keyHex: string): string {
  const key = CryptoJS.enc.Hex.parse(keyHex);
  // Extract IV (first 32 hex chars = 16 bytes)
  const ivHex = encryptedHex.substring(0, 32);
  const ciphertextHex = encryptedHex.substring(32);

  const iv = CryptoJS.enc.Hex.parse(ivHex);
  const ciphertext = CryptoJS.enc.Hex.parse(ciphertextHex);

  const decrypted = CryptoJS.AES.decrypt(
    // Reconstruct cipherparams
    CryptoJS.lib.CipherParams.create({
      ciphertext: ciphertext,
    }) as any,
    key,
    {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }
  );

  return decrypted.toString(CryptoJS.enc.Utf8);
}
