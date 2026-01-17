// Library exports for programmatic use
export { TpmClient, getClient, ApiError } from './lib/api-client.js';
export type {
  TpmClientOptions,
  ApiResponse,
  PaginationOptions,
  PaginatedResponse,
  Tool,
  ToolSearchOptions,
  Agent,
  CreateAgentInput,
  UpdateAgentInput,
  Collection,
  CreateCollectionInput,
  UpdateCollectionInput,
  User,
  ApiKey,
  Stats,
} from './lib/api-client.js';

export {
  getConfig,
  setConfig,
  getConfigValue,
  setConfigValue,
  loadCredentials,
  saveCredentials,
  deleteCredentials,
  hasCredentials,
  getApiKey,
  getApiUrl,
} from './lib/config.js';
export type { TpmConfig, TpmCredentials } from './lib/config.js';

export { OutputFormatter, createOutput } from './lib/output.js';
export type { OutputOptions } from './lib/output.js';
