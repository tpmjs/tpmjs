import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('API_KEY_ENCRYPTION_SECRET environment variable is not set');
  }
  return createHash('sha256').update(secret).digest();
}

/**
 * Encrypts an API key using AES-256-GCM
 */
export function encryptApiKey(apiKey: string): { encrypted: string; iv: string } {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Append the auth tag to the encrypted data
  const authTag = cipher.getAuthTag().toString('hex');
  encrypted += authTag;

  return {
    encrypted,
    iv: iv.toString('hex'),
  };
}

/**
 * Decrypts an API key using AES-256-GCM
 */
export function decryptApiKey(encrypted: string, iv: string): string {
  try {
    const key = getEncryptionKey();

    // Extract the auth tag (last 32 hex chars = 16 bytes)
    const authTag = Buffer.from(encrypted.slice(-32), 'hex');
    const encryptedData = encrypted.slice(0, -32);

    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    // Provide a more helpful error message
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Unsupported state') || message.includes('unable to authenticate')) {
      throw new Error(
        'API key decryption failed. The encryption secret may have changed. ' +
          'Please re-save your API key in Settings > API Keys.'
      );
    }
    throw error;
  }
}

/**
 * Creates a masked version of an API key for display (e.g., "sk-...XXXX")
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return '****';

  const prefix = apiKey.slice(0, 4);
  const suffix = apiKey.slice(-4);
  return `${prefix}...${suffix}`;
}

/**
 * Gets the last 4 characters of an API key for identification
 */
export function getKeyHint(apiKey: string): string {
  if (apiKey.length < 4) return apiKey;
  return apiKey.slice(-4);
}
