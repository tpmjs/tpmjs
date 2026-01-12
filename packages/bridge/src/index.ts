export { Bridge, type BridgeOptions } from './bridge.js';
export {
  createDefaultConfig,
  deleteCredentials,
  ensureConfigDir,
  getConfigPath,
  getCredentialsPath,
  loadConfig,
  loadCredentials,
  saveConfig,
  saveCredentials,
} from './config.js';
export type {
  BridgeConfig,
  BridgeCredentials,
  BridgeToServerMessage,
  ServerToBridgeMessage,
} from './types.js';
