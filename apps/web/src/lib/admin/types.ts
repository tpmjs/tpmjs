/**
 * Response contracts for the admin monitoring API (`/api/admin/*`).
 *
 * Shared by the server-side metric queries and the admin dashboard pages so the
 * two cannot drift. Every count is a plain number (raw SQL counts are cast from
 * bigint server-side) and every timestamp is ISO-8601.
 */

export interface WindowStats {
  /** Human window label, e.g. "1h", "24h", "7d" */
  window: string;
  hours: number;
  total: number;
  success: number;
  error: number;
  p50Ms: number | null;
  p95Ms: number | null;
}

export interface SeriesPoint {
  /** Bucket start, ISO-8601 */
  at: string;
  value: number;
  secondaryValue?: number;
}

export interface NamedCount {
  key: string;
  count: number;
}

export interface SyncRunSummary {
  source: string;
  status: string;
  processed: number;
  skipped: number;
  errors: number;
  message: string | null;
  createdAt: string;
}

export interface ExecutorHealth {
  reachable: boolean;
  url: string | null;
  implementationVersion: string | null;
  protocolVersion: string | null;
  status: string | null;
  latencyMs: number | null;
  error: string | null;
}

export interface HealthDistributionRow {
  importHealth: string;
  executionHealth: string;
  count: number;
}

export interface AdminOverview {
  generatedAt: string;
  executions: WindowStats[];
  apiUsage: WindowStats[];
  registry: {
    toolsActive: number;
    toolsRetired: number;
    packages: number;
    officialPackages: number;
    toolsHealthy: number;
    toolsBroken: number;
    toolsUnknown: number;
  };
  users: { total: number; admins: number; new7d: number; activeSessions: number };
  keys: { total: number; active: number; used24h: number };
  collections: { total: number; public: number; customServers: number; bridgesConnected: number };
  agents: { total: number; conversations24h: number; messages24h: number };
  searches24h: number;
  healthChecks24h: NamedCount[];
  syncRuns: SyncRunSummary[];
  executor: ExecutorHealth;
  hourly: SeriesPoint[];
}

export interface ActivityItem {
  kind:
    | 'execution'
    | 'api'
    | 'search'
    | 'sync'
    | 'health'
    | 'collection'
    | 'agent'
    | 'user'
    | 'key';
  at: string;
  actor: string | null;
  title: string;
  detail: string | null;
  status: string | null;
  ref: string | null;
}

export interface ActivityFeed {
  items: ActivityItem[];
  nextCursor: string | null;
}

export interface ExecutionRow {
  id: string;
  at: string;
  source: string;
  eventType: string;
  status: string;
  toolName: string | null;
  packageName: string | null;
  durationMs: number | null;
  errorCategory: string | null;
  errorMessage: string | null;
  userId: string | null;
  username: string | null;
  apiKeyName: string | null;
  collectionId: string | null;
  agentId: string | null;
}

export interface ExecutionStats {
  hours: number;
  totals: WindowStats;
  byStatus: NamedCount[];
  byCategory: NamedCount[];
  bySource: NamedCount[];
  topTools: Array<{
    key: string;
    count: number;
    errors: number;
    avgMs: number | null;
    p95Ms: number | null;
  }>;
  hourly: SeriesPoint[];
  rows: ExecutionRow[];
  total: number;
  facets: { packages: string[]; sources: string[]; statuses: string[] };
}

export interface ApiKeyUsage {
  keyId: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  username: string | null;
  email: string | null;
  tier: string;
  limitPerHour: number;
  usedThisHour: number;
  total: number;
  errors: number;
  p50Ms: number | null;
  lastUsedAt: string | null;
}

export interface ApiUsageStats {
  hours: number;
  totals: WindowStats;
  byEndpoint: Array<{
    key: string;
    count: number;
    errors: number;
    p50Ms: number | null;
    p95Ms: number | null;
  }>;
  byStatusCode: NamedCount[];
  keys: ApiKeyUsage[];
  hourly: SeriesPoint[];
  recentErrors: Array<{
    at: string;
    endpoint: string;
    method: string;
    statusCode: number;
    keyName: string | null;
    errorCode: string | null;
    errorMessage: string | null;
  }>;
}

export interface BrokenTool {
  toolId: string;
  toolName: string;
  packageName: string;
  npmVersion: string;
  importHealth: string | null;
  executionHealth: string | null;
  consecutiveImportFailures: number;
  lastHealthCheck: string | null;
  nextCheckAt: string | null;
  error: string | null;
}

export interface HealthOverview {
  distribution: HealthDistributionRow[];
  checks24h: Array<{
    overall: string;
    importStatus: string;
    executionStatus: string;
    count: number;
  }>;
  checksHourly: SeriesPoint[];
  brokenTools: BrokenTool[];
  topImportErrors: Array<{ key: string; count: number; tools: number }>;
  syncRuns: SyncRunSummary[];
  recentSyncLogs: SyncRunSummary[];
  endpointReports: Array<{
    at: string;
    source: string;
    passCount: number;
    failCount: number;
    totalChecks: number;
    overallStatus: string;
  }>;
  executor: ExecutorHealth;
}

export interface AdminCollection {
  id: string;
  name: string;
  slug: string | null;
  isPublic: boolean;
  owner: { username: string | null; email: string };
  executorType: string | null;
  envVarNames: string[];
  registryTools: number;
  customTools: number;
  bridgeTools: number;
  executionCount: number;
  viewCount: number;
  likeCount: number;
  forkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCustomServer {
  id: string;
  name: string;
  host: string;
  status: string;
  toolCount: number;
  owner: { username: string | null; email: string };
  lastSyncAt: string | null;
  lastSyncError: string | null;
  collectionsUsing: number;
}

export interface CollectionsAdmin {
  collections: AdminCollection[];
  customServers: AdminCustomServer[];
}

export interface AdminAgent {
  id: string;
  uid: string;
  name: string;
  owner: { username: string | null; email: string };
  provider: string;
  modelId: string;
  isPublic: boolean;
  sandboxEnabled: boolean;
  dynamicToolDiscovery: boolean;
  conversationCount: number;
  messageCount: number;
  executionCount: number;
  tools: number;
  createdAt: string;
  lastConversationAt: string | null;
}

export interface AdminConversation {
  id: string;
  agentName: string;
  agentUid: string;
  owner: string | null;
  status: string;
  messages: number;
  toolCalls: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentsAdmin {
  agents: AdminAgent[];
  recentConversations: AdminConversation[];
  totals: { agents: number; conversations: number; messages: number; conversations24h: number };
}

export interface AdminSearchLog {
  at: string;
  query: string;
  resultCount: number;
  latencyMs: number;
  username: string | null;
}

export interface SearchAdmin {
  hours: number;
  total: number;
  zeroResult: number;
  p50Ms: number | null;
  topQueries: NamedCount[];
  zeroResultQueries: NamedCount[];
  hourly: SeriesPoint[];
  recent: AdminSearchLog[];
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  username: string | null;
  image: string | null;
  tier: string;
  role: string;
  signupSource: string | null;
  emailVerified: boolean;
  createdAt: string;
  _count: {
    collections: number;
    agents: number;
    activities: number;
    toolLikes: number;
    apiKeys: number;
    tpmjsApiKeys: number;
  };
}

export type ApiEnvelope<T> = { success: true; data: T } | { success: false; error: string };
