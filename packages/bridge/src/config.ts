import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { BridgeConfig, BridgeCredentials } from './types.js';

const CONFIG_DIR = path.join(os.homedir(), '.tpmjs');
const CONFIG_FILE = path.join(CONFIG_DIR, 'bridge.json');
const CREDENTIALS_FILE = path.join(CONFIG_DIR, 'credentials.json');

/**
 * Ensure the config directory exists
 */
export function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load bridge configuration
 */
export function loadConfig(): BridgeConfig {
  ensureConfigDir();

  if (!fs.existsSync(CONFIG_FILE)) {
    return { servers: [] };
  }

  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as BridgeConfig;
  } catch {
    return { servers: [] };
  }
}

/**
 * Save bridge configuration
 */
export function saveConfig(config: BridgeConfig): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Load credentials
 */
export function loadCredentials(): BridgeCredentials | null {
  ensureConfigDir();

  if (!fs.existsSync(CREDENTIALS_FILE)) {
    return null;
  }

  try {
    const content = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
    return JSON.parse(content) as BridgeCredentials;
  } catch {
    return null;
  }
}

/**
 * Save credentials
 */
export function saveCredentials(credentials: BridgeCredentials): void {
  ensureConfigDir();
  fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), {
    mode: 0o600, // Only owner can read/write
  });
}

/**
 * Delete credentials
 */
export function deleteCredentials(): void {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    fs.unlinkSync(CREDENTIALS_FILE);
  }
}

/**
 * Get config file path
 */
export function getConfigPath(): string {
  return CONFIG_FILE;
}

/**
 * Get credentials file path
 */
export function getCredentialsPath(): string {
  return CREDENTIALS_FILE;
}

/**
 * Create default config file
 */
export function createDefaultConfig(): void {
  const defaultConfig: BridgeConfig = {
    servers: [
      {
        id: 'example',
        name: 'Example MCP Server',
        transport: 'stdio',
        command: 'npx',
        args: ['-y', '@example/mcp-server'],
      },
    ],
  };

  saveConfig(defaultConfig);
}
