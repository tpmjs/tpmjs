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
  BridgeErrorResponse,
  BridgePollResponse,
  BridgePostRequest,
  BridgeSuccessResponse,
  BridgeToolCall,
  BridgeToolDefinition,
  BridgeToolError,
  BridgeToServerMessage,
  ServerToBridgeMessage,
} from './types.js';
