import Conf from 'conf';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

export interface TpmConfig {
  apiUrl?: string;
  defaultOutput?: 'human' | 'json';
  verbose?: boolean;
  analytics?: boolean;
  env?: Record<string, string>;
}

export interface TpmCredentials {
  apiKey?: string;
  refreshToken?: string;
  expiresAt?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.tpmjs');
const CREDENTIALS_FILE = path.join(CONFIG_DIR, 'credentials.json');
const HISTORY_DIR = path.join(CONFIG_DIR, 'history');

// Ensure config directory exists
function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
}

// Config store using Conf
const configStore = new Conf<TpmConfig>({
  projectName: 'tpmjs',
  cwd: CONFIG_DIR,
  configName: 'config',
  defaults: {
    apiUrl: 'https://tpmjs.com/api',
    defaultOutput: 'human',
    verbose: false,
    analytics: false,
  },
});

export function getConfig(): TpmConfig {
  return configStore.store;
}

export function setConfig(config: Partial<TpmConfig>): void {
  for (const [key, value] of Object.entries(config)) {
    if (value !== undefined) {
      configStore.set(key, value);
    }
  }
}

export function getConfigValue<K extends keyof TpmConfig>(key: K): TpmConfig[K] {
  return configStore.get(key);
}

export function setConfigValue<K extends keyof TpmConfig>(
  key: K,
  value: TpmConfig[K]
): void {
  configStore.set(key, value);
}

export function resetConfig(): void {
  configStore.clear();
}

// Credentials management with secure file permissions
export function loadCredentials(): TpmCredentials | null {
  ensureConfigDir();

  if (!fs.existsSync(CREDENTIALS_FILE)) {
    return null;
  }

  try {
    const content = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
    return JSON.parse(content) as TpmCredentials;
  } catch {
    return null;
  }
}

export function saveCredentials(credentials: TpmCredentials): void {
  ensureConfigDir();

  const content = JSON.stringify(credentials, null, 2);
  fs.writeFileSync(CREDENTIALS_FILE, content, { mode: 0o600 });
}

export function deleteCredentials(): void {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    fs.unlinkSync(CREDENTIALS_FILE);
  }
}

export function hasCredentials(): boolean {
  const creds = loadCredentials();
  return creds !== null && !!creds.apiKey;
}

// Get API key from multiple sources (priority order)
export function getApiKey(): string | undefined {
  // 1. Environment variable
  if (process.env.TPMJS_API_KEY) {
    return process.env.TPMJS_API_KEY;
  }

  // 2. Credentials file
  const creds = loadCredentials();
  if (creds?.apiKey) {
    return creds.apiKey;
  }

  return undefined;
}

// Get API URL
export function getApiUrl(): string {
  return process.env.TPMJS_API_URL ?? getConfigValue('apiUrl') ?? 'https://tpmjs.com/api';
}

// History directory for conversation caching
export function getHistoryDir(): string {
  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true, mode: 0o700 });
  }
  return HISTORY_DIR;
}

// Config directory path
export function getConfigDir(): string {
  ensureConfigDir();
  return CONFIG_DIR;
}
