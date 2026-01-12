import { createHash, randomBytes } from 'node:crypto';

/**
 * API Key Utilities for TPMJS
 *
 * Keys are prefixed with 'tpmjs_sk_' for easy identification in logs/configs.
 * We only store SHA-256 hashes - the raw key is shown once at creation.
 */

const API_KEY_PREFIX = 'tpmjs_sk_';
const RANDOM_BYTES_LENGTH = 32;

export interface GeneratedApiKey {
  /** The raw API key (only shown once at creation) */
  rawKey: string;
  /** SHA-256 hash for storage and lookup */
  keyHash: string;
  /** First 16 characters for display (e.g., "tpmjs_sk_abc123...") */
  keyPrefix: string;
}

/**
 * Generates a new TPMJS API key
 *
 * @returns Object containing rawKey (show once), keyHash (for storage), keyPrefix (for display)
 *
 * @example
 * const { rawKey, keyHash, keyPrefix } = generateApiKey();
 * // rawKey: "tpmjs_sk_abc123..." (show to user once)
 * // keyHash: "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae"
 * // keyPrefix: "tpmjs_sk_abc123..."
 */
export function generateApiKey(): GeneratedApiKey {
  const randomPart = randomBytes(RANDOM_BYTES_LENGTH).toString('base64url');
  const rawKey = `${API_KEY_PREFIX}${randomPart}`;
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = rawKey.substring(0, 16);

  return { rawKey, keyHash, keyPrefix };
}

/**
 * Hashes an API key using SHA-256 for storage and lookup
 *
 * We use hashing instead of encryption because:
 * 1. We never need to recover the original key
 * 2. Users can generate new keys if lost
 * 3. Simpler and more secure (no encryption key to manage)
 *
 * @param rawKey - The raw API key to hash
 * @returns SHA-256 hash as hex string (64 characters)
 */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Validates API key format
 *
 * @param key - The key to validate
 * @returns True if the key has valid format
 */
export function isValidApiKeyFormat(key: string): boolean {
  // Must start with prefix and be at least 40 chars (prefix + some random bytes)
  return key.startsWith(API_KEY_PREFIX) && key.length >= 40;
}

/**
 * Masks an API key for safe display
 *
 * @param keyPrefix - The key prefix (first 16 chars)
 * @returns Masked string like "tpmjs_sk_abc1..."
 */
export function maskApiKey(keyPrefix: string): string {
  return `${keyPrefix}...`;
}

/**
 * API key scopes for granular permissions
 */
export const API_KEY_SCOPES = {
  /** Execute MCP tools */
  MCP_EXECUTE: 'mcp:execute',
  /** Chat with agents */
  AGENT_CHAT: 'agent:chat',
  /** Connect via bridge */
  BRIDGE_CONNECT: 'bridge:connect',
  /** Read usage data */
  USAGE_READ: 'usage:read',
  /** Read collection data */
  COLLECTION_READ: 'collection:read',
} as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[keyof typeof API_KEY_SCOPES];

/**
 * Default scopes for new API keys
 */
export const DEFAULT_API_KEY_SCOPES: ApiKeyScope[] = [
  API_KEY_SCOPES.MCP_EXECUTE,
  API_KEY_SCOPES.AGENT_CHAT,
  API_KEY_SCOPES.BRIDGE_CONNECT,
  API_KEY_SCOPES.USAGE_READ,
  API_KEY_SCOPES.COLLECTION_READ,
];

/**
 * Rate limits by user tier (requests per hour)
 */
export const RATE_LIMITS_BY_TIER = {
  FREE: 100,
  PRO: 1000,
  ENTERPRISE: 10000,
} as const;

/**
 * Gets the rate limit for a user tier
 */
export function getRateLimitForTier(tier: keyof typeof RATE_LIMITS_BY_TIER): number {
  return RATE_LIMITS_BY_TIER[tier];
}
