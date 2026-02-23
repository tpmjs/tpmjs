import { jsonSchema, tool } from 'ai';

// =============================================================================
// Types
// =============================================================================

interface CloudflareApiResponse<T = unknown> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: T;
}

// Zone types
interface ListZonesInput {
  name?: string;
  status?: string;
  per_page?: number;
}

interface GetZoneInput {
  zone_id: string;
}

interface PurgeCacheInput {
  zone_id: string;
  purge_everything?: boolean;
  files?: string[];
}

// DNS Record types
interface ListDnsRecordsInput {
  zone_id: string;
  type?: string;
  name?: string;
  per_page?: number;
}

interface CreateDnsRecordInput {
  zone_id: string;
  type: string;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
}

interface UpdateDnsRecordInput {
  zone_id: string;
  record_id: string;
  type: string;
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
}

interface DeleteDnsRecordInput {
  zone_id: string;
  record_id: string;
}

// Workers types
interface ListWorkersInput {
  per_page?: number;
}

interface GetWorkerInput {
  script_name: string;
}

interface DeleteWorkerInput {
  script_name: string;
}

// KV types
interface ListKvNamespacesInput {
  per_page?: number;
}

interface ListKvKeysInput {
  namespace_id: string;
  prefix?: string;
  limit?: number;
}

interface GetKvValueInput {
  namespace_id: string;
  key_name: string;
}

interface PutKvValueInput {
  namespace_id: string;
  key_name: string;
  value: string;
}

interface DeleteKvKeyInput {
  namespace_id: string;
  key_name: string;
}

// =============================================================================
// Constants and Helpers
// =============================================================================

const BASE_URL = 'https://api.cloudflare.com/client/v4';

function getApiToken(): string {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    throw new Error(
      'CLOUDFLARE_API_TOKEN environment variable is required. Get your token at https://dash.cloudflare.com/profile/api-tokens'
    );
  }
  return token;
}

function getAccountId(): string {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!accountId) {
    throw new Error(
      'CLOUDFLARE_ACCOUNT_ID environment variable is required. Find it at https://dash.cloudflare.com/'
    );
  }
  return accountId;
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getApiToken();
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = (await response.json()) as CloudflareApiResponse<T>;

  if (!data.success) {
    const errorMessages = data.errors.map((err) => `[${err.code}] ${err.message}`).join('; ');
    throw new Error(`Cloudflare API error: ${errorMessages}`);
  }

  return data.result;
}

async function apiRequestRaw(endpoint: string, options: RequestInit = {}): Promise<string> {
  const token = getApiToken();
  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Cloudflare API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  return response.text();
}

function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
}

// =============================================================================
// Zone Tools
// =============================================================================

export const listZones = tool({
  description: 'List all zones (domains) in your Cloudflare account with optional filtering',
  inputSchema: jsonSchema<ListZonesInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Filter zones by name (domain)',
      },
      status: {
        type: 'string',
        description: 'Filter by zone status (e.g., "active", "pending")',
      },
      per_page: {
        type: 'number',
        description: 'Number of results per page (default: 20, max: 50)',
      },
    },
    additionalProperties: false,
  }),
  execute: async ({ name, status, per_page }) => {
    try {
      const queryParams: Record<string, unknown> = {};
      if (name) queryParams.name = name;
      if (status) queryParams.status = status;
      if (per_page) queryParams.per_page = per_page;

      const query = buildQueryString(queryParams);
      const result = await apiRequest<unknown>(`/zones${query}`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
});

export const getZone = tool({
  description: 'Get detailed information about a specific zone',
  inputSchema: jsonSchema<GetZoneInput>({
    type: 'object',
    properties: {
      zone_id: {
        type: 'string',
        description: 'The zone ID to retrieve',
      },
    },
    required: ['zone_id'],
    additionalProperties: false,
  }),
  execute: async ({ zone_id }) => {
    try {
      if (!zone_id) {
        throw new Error('zone_id is required');
      }

      const result = await apiRequest<unknown>(`/zones/${zone_id}`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
});

export const purgeCache = tool({
  description: 'Purge cached content from Cloudflare CDN for a zone (all files or specific URLs)',
  inputSchema: jsonSchema<PurgeCacheInput>({
    type: 'object',
    properties: {
      zone_id: {
        type: 'string',
        description: 'The zone ID to purge cache for',
      },
      purge_everything: {
        type: 'boolean',
        description: 'Purge all cached content (default: false)',
      },
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of URLs to purge (use if purge_everything is false)',
      },
    },
    required: ['zone_id'],
    additionalProperties: false,
  }),
  execute: async ({ zone_id, purge_everything, files }) => {
    try {
      if (!zone_id) {
        throw new Error('zone_id is required');
      }

      const body: Record<string, unknown> = {};
      if (purge_everything) {
        body.purge_everything = true;
      } else if (files && files.length > 0) {
        body.files = files;
      } else {
        throw new Error('Either purge_everything must be true or files must be provided');
      }

      const result = await apiRequest<unknown>(`/zones/${zone_id}/purge_cache`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
});

// =============================================================================
// DNS Record Tools
// =============================================================================

export const listDnsRecords = tool({
  description: 'List DNS records for a specific zone with optional filtering',
  inputSchema: jsonSchema<ListDnsRecordsInput>({
    type: 'object',
    properties: {
      zone_id: {
        type: 'string',
        description: 'The zone ID to list DNS records for',
      },
      type: {
        type: 'string',
        description: 'Filter by record type (A, AAAA, CNAME, MX, TXT, etc.)',
      },
      name: {
        type: 'string',
        description: 'Filter by record name (e.g., "example.com")',
      },
      per_page: {
        type: 'number',
        description: 'Number of results per page (default: 20, max: 100)',
      },
    },
    required: ['zone_id'],
    additionalProperties: false,
  }),
  execute: async ({ zone_id, type, name, per_page }) => {
    try {
      if (!zone_id) {
        throw new Error('zone_id is required');
      }

      const queryParams: Record<string, unknown> = {};
      if (type) queryParams.type = type;
      if (name) queryParams.name = name;
      if (per_page) queryParams.per_page = per_page;

      const query = buildQueryString(queryParams);
      const result = await apiRequest<unknown>(`/zones/${zone_id}/dns_records${query}`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
});

export const createDnsRecord = tool({
  description: 'Create a new DNS record in a zone',
  inputSchema: jsonSchema<CreateDnsRecordInput>({
    type: 'object',
    properties: {
      zone_id: {
        type: 'string',
        description: 'The zone ID to create the DNS record in',
      },
      type: {
        type: 'string',
        description: 'DNS record type (A, AAAA, CNAME, MX, TXT, etc.)',
      },
      name: {
        type: 'string',
        description: 'DNS record name (e.g., "example.com" or "subdomain.example.com")',
      },
      content: {
        type: 'string',
        description: 'DNS record content (e.g., IP address for A record, domain for CNAME)',
      },
      ttl: {
        type: 'number',
        description: 'Time to live in seconds (1 = automatic, default: 1)',
      },
      proxied: {
        type: 'boolean',
        description: 'Whether the record is proxied through Cloudflare (default: false)',
      },
    },
    required: ['zone_id', 'type', 'name', 'content'],
    additionalProperties: false,
  }),
  execute: async ({ zone_id, type, name, content, ttl, proxied }) => {
    try {
      if (!zone_id || !type || !name || !content) {
        throw new Error('zone_id, type, name, and content are required');
      }

      const body: Record<string, unknown> = {
        type,
        name,
        content,
      };
      if (ttl !== undefined) body.ttl = ttl;
      if (proxied !== undefined) body.proxied = proxied;

      const result = await apiRequest<unknown>(`/zones/${zone_id}/dns_records`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
});

export const updateDnsRecord = tool({
  description: 'Update an existing DNS record',
  inputSchema: jsonSchema<UpdateDnsRecordInput>({
    type: 'object',
    properties: {
      zone_id: {
        type: 'string',
        description: 'The zone ID containing the DNS record',
      },
      record_id: {
        type: 'string',
        description: 'The DNS record ID to update',
      },
      type: {
        type: 'string',
        description: 'DNS record type (A, AAAA, CNAME, MX, TXT, etc.)',
      },
      name: {
        type: 'string',
        description: 'DNS record name (e.g., "example.com" or "subdomain.example.com")',
      },
      content: {
        type: 'string',
        description: 'DNS record content (e.g., IP address for A record, domain for CNAME)',
      },
      ttl: {
        type: 'number',
        description: 'Time to live in seconds (1 = automatic)',
      },
      proxied: {
        type: 'boolean',
        description: 'Whether the record is proxied through Cloudflare',
      },
    },
    required: ['zone_id', 'record_id', 'type', 'name', 'content'],
    additionalProperties: false,
  }),
  execute: async ({ zone_id, record_id, type, name, content, ttl, proxied }) => {
    try {
      if (!zone_id || !record_id || !type || !name || !content) {
        throw new Error('zone_id, record_id, type, name, and content are required');
      }

      const body: Record<string, unknown> = {
        type,
        name,
        content,
      };
      if (ttl !== undefined) body.ttl = ttl;
      if (proxied !== undefined) body.proxied = proxied;

      const result = await apiRequest<unknown>(`/zones/${zone_id}/dns_records/${record_id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
});

export const deleteDnsRecord = tool({
  description: 'Delete a DNS record from a zone',
  inputSchema: jsonSchema<DeleteDnsRecordInput>({
    type: 'object',
    properties: {
      zone_id: {
        type: 'string',
        description: 'The zone ID containing the DNS record',
      },
      record_id: {
        type: 'string',
        description: 'The DNS record ID to delete',
      },
    },
    required: ['zone_id', 'record_id'],
    additionalProperties: false,
  }),
  execute: async ({ zone_id, record_id }) => {
    try {
      if (!zone_id || !record_id) {
        throw new Error('zone_id and record_id are required');
      }

      const result = await apiRequest<unknown>(`/zones/${zone_id}/dns_records/${record_id}`, {
        method: 'DELETE',
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
});

// =============================================================================
// Workers Tools
// =============================================================================

export const listWorkers = tool({
  description: 'List all Cloudflare Workers scripts in your account',
  inputSchema: jsonSchema<ListWorkersInput>({
    type: 'object',
    properties: {
      per_page: {
        type: 'number',
        description: 'Number of results per page (default: 20)',
      },
    },
    additionalProperties: false,
  }),
  execute: async ({ per_page }) => {
    try {
      const accountId = getAccountId();

      const queryParams: Record<string, unknown> = {};
      if (per_page) queryParams.per_page = per_page;

      const query = buildQueryString(queryParams);
      const result = await apiRequest<unknown>(`/accounts/${accountId}/workers/scripts${query}`);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
});

export const getWorker = tool({
  description: 'Get settings and metadata for a specific Cloudflare Worker',
  inputSchema: jsonSchema<GetWorkerInput>({
    type: 'object',
    properties: {
      script_name: {
        type: 'string',
        description: 'The name of the Worker script',
      },
    },
    required: ['script_name'],
    additionalProperties: false,
  }),
  execute: async ({ script_name }) => {
    try {
      if (!script_name) {
        throw new Error('script_name is required');
      }

      const accountId = getAccountId();
      const result = await apiRequest<unknown>(
        `/accounts/${accountId}/workers/scripts/${script_name}/settings`
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
});

export const deleteWorker = tool({
  description: 'Delete a Cloudflare Worker script',
  inputSchema: jsonSchema<DeleteWorkerInput>({
    type: 'object',
    properties: {
      script_name: {
        type: 'string',
        description: 'The name of the Worker script to delete',
      },
    },
    required: ['script_name'],
    additionalProperties: false,
  }),
  execute: async ({ script_name }) => {
    try {
      if (!script_name) {
        throw new Error('script_name is required');
      }

      const accountId = getAccountId();
      const result = await apiRequest<unknown>(
        `/accounts/${accountId}/workers/scripts/${script_name}`,
        {
          method: 'DELETE',
        }
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
});

// =============================================================================
// KV Tools
// =============================================================================

export const listKvNamespaces = tool({
  description: 'List all KV namespaces in your Cloudflare account',
  inputSchema: jsonSchema<ListKvNamespacesInput>({
    type: 'object',
    properties: {
      per_page: {
        type: 'number',
        description: 'Number of results per page (default: 20)',
      },
    },
    additionalProperties: false,
  }),
  execute: async ({ per_page }) => {
    try {
      const accountId = getAccountId();

      const queryParams: Record<string, unknown> = {};
      if (per_page) queryParams.per_page = per_page;

      const query = buildQueryString(queryParams);
      const result = await apiRequest<unknown>(
        `/accounts/${accountId}/storage/kv/namespaces${query}`
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
});

export const listKvKeys = tool({
  description: 'List all keys in a KV namespace with optional filtering',
  inputSchema: jsonSchema<ListKvKeysInput>({
    type: 'object',
    properties: {
      namespace_id: {
        type: 'string',
        description: 'The KV namespace ID',
      },
      prefix: {
        type: 'string',
        description: 'Filter keys by prefix',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of keys to return (default: 1000)',
      },
    },
    required: ['namespace_id'],
    additionalProperties: false,
  }),
  execute: async ({ namespace_id, prefix, limit }) => {
    try {
      if (!namespace_id) {
        throw new Error('namespace_id is required');
      }

      const accountId = getAccountId();

      const queryParams: Record<string, unknown> = {};
      if (prefix) queryParams.prefix = prefix;
      if (limit) queryParams.limit = limit;

      const query = buildQueryString(queryParams);
      const result = await apiRequest<unknown>(
        `/accounts/${accountId}/storage/kv/namespaces/${namespace_id}/keys${query}`
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
});

export const getKvValue = tool({
  description: 'Get the value of a key from a KV namespace',
  inputSchema: jsonSchema<GetKvValueInput>({
    type: 'object',
    properties: {
      namespace_id: {
        type: 'string',
        description: 'The KV namespace ID',
      },
      key_name: {
        type: 'string',
        description: 'The key name to retrieve',
      },
    },
    required: ['namespace_id', 'key_name'],
    additionalProperties: false,
  }),
  execute: async ({ namespace_id, key_name }) => {
    try {
      if (!namespace_id || !key_name) {
        throw new Error('namespace_id and key_name are required');
      }

      const accountId = getAccountId();
      const value = await apiRequestRaw(
        `/accounts/${accountId}/storage/kv/namespaces/${namespace_id}/values/${key_name}`
      );

      return {
        success: true,
        data: { value },
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
});

export const putKvValue = tool({
  description: 'Set the value of a key in a KV namespace',
  inputSchema: jsonSchema<PutKvValueInput>({
    type: 'object',
    properties: {
      namespace_id: {
        type: 'string',
        description: 'The KV namespace ID',
      },
      key_name: {
        type: 'string',
        description: 'The key name to set',
      },
      value: {
        type: 'string',
        description: 'The value to store (will be stored as text)',
      },
    },
    required: ['namespace_id', 'key_name', 'value'],
    additionalProperties: false,
  }),
  execute: async ({ namespace_id, key_name, value }) => {
    try {
      if (!namespace_id || !key_name || value === undefined) {
        throw new Error('namespace_id, key_name, and value are required');
      }

      const accountId = getAccountId();
      const token = getApiToken();
      const url = `${BASE_URL}/accounts/${accountId}/storage/kv/namespaces/${namespace_id}/values/${key_name}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'text/plain',
        },
        body: value,
      });

      const data = (await response.json()) as CloudflareApiResponse<unknown>;

      if (!data.success) {
        const errorMessages = data.errors.map((err) => `[${err.code}] ${err.message}`).join('; ');
        throw new Error(`Cloudflare API error: ${errorMessages}`);
      }

      return {
        success: true,
        data: data.result,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
});

export const deleteKvKey = tool({
  description: 'Delete a key from a KV namespace',
  inputSchema: jsonSchema<DeleteKvKeyInput>({
    type: 'object',
    properties: {
      namespace_id: {
        type: 'string',
        description: 'The KV namespace ID',
      },
      key_name: {
        type: 'string',
        description: 'The key name to delete',
      },
    },
    required: ['namespace_id', 'key_name'],
    additionalProperties: false,
  }),
  execute: async ({ namespace_id, key_name }) => {
    try {
      if (!namespace_id || !key_name) {
        throw new Error('namespace_id and key_name are required');
      }

      const accountId = getAccountId();
      const result = await apiRequest<unknown>(
        `/accounts/${accountId}/storage/kv/namespaces/${namespace_id}/values/${key_name}`,
        {
          method: 'DELETE',
        }
      );

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
});

// =============================================================================
// Default Export
// =============================================================================

export default {
  // Zones
  listZones,
  getZone,
  purgeCache,

  // DNS Records
  listDnsRecords,
  createDnsRecord,
  updateDnsRecord,
  deleteDnsRecord,

  // Workers
  listWorkers,
  getWorker,
  deleteWorker,

  // KV
  listKvNamespaces,
  listKvKeys,
  getKvValue,
  putKvValue,
  deleteKvKey,
};
