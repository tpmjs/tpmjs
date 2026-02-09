/**
 * @tpmjs/tools-agentmail — AgentMail API Tools for AI Agents
 *
 * Complete email management for AI agents: create inboxes, send/receive emails,
 * manage threads, drafts, and more.
 *
 * @requires AGENTMAIL_API_KEY environment variable
 */

import { jsonSchema, tool } from 'ai';

const BASE_URL = 'https://api.agentmail.to/v0';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.AGENTMAIL_API_KEY;
  if (!key) {
    throw new Error(
      'AGENTMAIL_API_KEY environment variable is required. Get your token from https://app.agentmail.to'
    );
  }
  return key;
}

async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const token = getApiKey();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${path}`, options);

  // Handle 204 No Content for DELETE operations
  if (response.status === 204) {
    return { success: true } as T;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `AgentMail HTTP error ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`
    );
  }

  return (await response.json()) as T;
}

// ─── Output Types ────────────────────────────────────────────────────────────

export interface InboxResult {
  inbox_id: string;
  pod_id: string;
  display_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ListInboxesResult {
  count: number;
  inboxes: InboxResult[];
  next_page_token?: string;
}

export interface SuccessResult {
  success: boolean;
  inbox_id?: string;
}

export interface MessageResult {
  message_id: string;
  thread_id: string;
  inbox_id: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  labels: string[];
  created_at: string;
}

export interface ListMessagesResult {
  count: number;
  messages: MessageResult[];
  next_page_token?: string;
}

export interface ThreadResult {
  thread_id: string;
  inbox_id: string;
  subject: string;
  labels: string[];
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ListThreadsResult {
  count: number;
  threads: ThreadResult[];
  next_page_token?: string;
}

export interface ThreadDetailResult {
  thread_id: string;
  inbox_id: string;
  subject: string;
  labels: string[];
  messages: MessageResult[];
  created_at: string;
  updated_at: string;
}

export interface DraftResult {
  draft_id: string;
  inbox_id: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  created_at: string;
}

// ─── Inboxes ────────────────────────────────────────────────────────────────

export interface CreateInboxInput {
  username?: string;
  domain?: string;
  display_name?: string;
}

export const createInbox = tool({
  description: 'Create a new email inbox for an AI agent with optional custom username and domain.',
  inputSchema: jsonSchema<CreateInboxInput>({
    type: 'object',
    properties: {
      username: {
        type: 'string',
        description: 'Optional username for the inbox. If not provided, a random one is generated.',
      },
      domain: {
        type: 'string',
        description: 'Optional domain (defaults to agentmail.to).',
      },
      display_name: {
        type: 'string',
        description: 'Optional display name for the inbox.',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: CreateInboxInput): Promise<InboxResult> {
    try {
      return await apiRequest<InboxResult>('POST', '/inboxes', {
        username: input.username,
        domain: input.domain,
        display_name: input.display_name,
      });
    } catch (error) {
      throw new Error(`Failed to create inbox: ${(error as Error).message}`);
    }
  },
});

export interface ListInboxesInput {
  limit?: number;
  page_token?: string;
}

export const listInboxes = tool({
  description: 'List all email inboxes in the AgentMail account with pagination support.',
  inputSchema: jsonSchema<ListInboxesInput>({
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Number of inboxes to return (1-100, default: 50).',
      },
      page_token: {
        type: 'string',
        description: 'Pagination token from previous response.',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: ListInboxesInput): Promise<ListInboxesResult> {
    try {
      if (input.limit !== undefined && (input.limit < 1 || input.limit > 100)) {
        throw new Error('Limit must be between 1 and 100');
      }

      const params = new URLSearchParams();
      if (input.limit !== undefined) params.append('limit', String(input.limit));
      if (input.page_token) params.append('page_token', input.page_token);

      const queryString = params.toString();
      const path = queryString ? `/inboxes?${queryString}` : '/inboxes';

      return await apiRequest<ListInboxesResult>('GET', path);
    } catch (error) {
      throw new Error(`Failed to list inboxes: ${(error as Error).message}`);
    }
  },
});

export interface GetInboxInput {
  inbox_id: string;
}

export const getInbox = tool({
  description: 'Get details of a specific email inbox by its inbox ID.',
  inputSchema: jsonSchema<GetInboxInput>({
    type: 'object',
    properties: {
      inbox_id: {
        type: 'string',
        description: 'The inbox ID to retrieve.',
      },
    },
    required: ['inbox_id'],
    additionalProperties: false,
  }),
  async execute(input: GetInboxInput): Promise<InboxResult> {
    try {
      if (!input.inbox_id) {
        throw new Error('inbox_id is required and must be non-empty');
      }
      return await apiRequest<InboxResult>('GET', `/inboxes/${input.inbox_id}`);
    } catch (error) {
      throw new Error(`Failed to get inbox: ${(error as Error).message}`);
    }
  },
});

export interface DeleteInboxInput {
  inbox_id: string;
}

export const deleteInbox = tool({
  description: 'Delete an email inbox and all its messages permanently.',
  inputSchema: jsonSchema<DeleteInboxInput>({
    type: 'object',
    properties: {
      inbox_id: {
        type: 'string',
        description: 'The inbox ID to delete.',
      },
    },
    required: ['inbox_id'],
    additionalProperties: false,
  }),
  async execute(input: DeleteInboxInput): Promise<SuccessResult> {
    try {
      if (!input.inbox_id) {
        throw new Error('inbox_id is required and must be non-empty');
      }
      await apiRequest<SuccessResult>('DELETE', `/inboxes/${input.inbox_id}`);
      return { success: true, inbox_id: input.inbox_id };
    } catch (error) {
      throw new Error(`Failed to delete inbox: ${(error as Error).message}`);
    }
  },
});

// ─── Messages ───────────────────────────────────────────────────────────────

export interface SendMessageInput {
  inbox_id: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  cc?: string;
  bcc?: string;
  labels?: string[];
}

export const sendMessage = tool({
  description: 'Send an email message from an inbox to a recipient with subject and body.',
  inputSchema: jsonSchema<SendMessageInput>({
    type: 'object',
    properties: {
      inbox_id: {
        type: 'string',
        description: 'The inbox ID to send from.',
      },
      to: {
        type: 'string',
        description: 'Recipient email address.',
      },
      subject: {
        type: 'string',
        description: 'Email subject line.',
      },
      text: {
        type: 'string',
        description: 'Plain text email body.',
      },
      html: {
        type: 'string',
        description: 'Optional HTML email body.',
      },
      cc: {
        type: 'string',
        description: 'Optional CC recipients (comma-separated).',
      },
      bcc: {
        type: 'string',
        description: 'Optional BCC recipients (comma-separated).',
      },
      labels: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional labels to apply to the message.',
      },
    },
    required: ['inbox_id', 'to', 'subject', 'text'],
    additionalProperties: false,
  }),
  async execute(input: SendMessageInput): Promise<MessageResult> {
    try {
      if (!input.inbox_id || !input.to || !input.subject || !input.text) {
        throw new Error('inbox_id, to, subject, and text are required and must be non-empty');
      }
      return await apiRequest<MessageResult>('POST', `/inboxes/${input.inbox_id}/messages`, {
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
        cc: input.cc,
        bcc: input.bcc,
        labels: input.labels,
      });
    } catch (error) {
      throw new Error(`Failed to send message: ${(error as Error).message}`);
    }
  },
});

export interface ReplyToMessageInput {
  inbox_id: string;
  message_id: string;
  text: string;
  html?: string;
  labels?: string[];
}

export const replyToMessage = tool({
  description: 'Reply to an existing email message in a thread conversation.',
  inputSchema: jsonSchema<ReplyToMessageInput>({
    type: 'object',
    properties: {
      inbox_id: {
        type: 'string',
        description: 'The inbox ID.',
      },
      message_id: {
        type: 'string',
        description: 'The message ID to reply to.',
      },
      text: {
        type: 'string',
        description: 'Plain text reply body.',
      },
      html: {
        type: 'string',
        description: 'Optional HTML reply body.',
      },
      labels: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional labels to apply to the reply.',
      },
    },
    required: ['inbox_id', 'message_id', 'text'],
    additionalProperties: false,
  }),
  async execute(input: ReplyToMessageInput): Promise<MessageResult> {
    try {
      if (!input.inbox_id || !input.message_id || !input.text) {
        throw new Error('inbox_id, message_id, and text are required and must be non-empty');
      }
      return await apiRequest<MessageResult>(
        'POST',
        `/inboxes/${input.inbox_id}/messages/${input.message_id}/reply`,
        {
          text: input.text,
          html: input.html,
          labels: input.labels,
        }
      );
    } catch (error) {
      throw new Error(`Failed to reply to message: ${(error as Error).message}`);
    }
  },
});

export interface ListMessagesInput {
  inbox_id: string;
  limit?: number;
  page_token?: string;
}

export const listMessages = tool({
  description: 'List email messages in an inbox with pagination support.',
  inputSchema: jsonSchema<ListMessagesInput>({
    type: 'object',
    properties: {
      inbox_id: {
        type: 'string',
        description: 'The inbox ID to list messages from.',
      },
      limit: {
        type: 'number',
        description: 'Number of messages to return (1-100, default: 50).',
      },
      page_token: {
        type: 'string',
        description: 'Pagination token from previous response.',
      },
    },
    required: ['inbox_id'],
    additionalProperties: false,
  }),
  async execute(input: ListMessagesInput): Promise<ListMessagesResult> {
    try {
      if (!input.inbox_id) {
        throw new Error('inbox_id is required and must be non-empty');
      }
      if (input.limit !== undefined && (input.limit < 1 || input.limit > 100)) {
        throw new Error('Limit must be between 1 and 100');
      }

      const params = new URLSearchParams();
      if (input.limit !== undefined) params.append('limit', String(input.limit));
      if (input.page_token) params.append('page_token', input.page_token);

      const queryString = params.toString();
      const path = queryString
        ? `/inboxes/${input.inbox_id}/messages?${queryString}`
        : `/inboxes/${input.inbox_id}/messages`;

      return await apiRequest<ListMessagesResult>('GET', path);
    } catch (error) {
      throw new Error(`Failed to list messages: ${(error as Error).message}`);
    }
  },
});

export interface GetMessageInput {
  inbox_id: string;
  message_id: string;
}

export const getMessage = tool({
  description: 'Get the full details of a specific email message by its message ID.',
  inputSchema: jsonSchema<GetMessageInput>({
    type: 'object',
    properties: {
      inbox_id: {
        type: 'string',
        description: 'The inbox ID.',
      },
      message_id: {
        type: 'string',
        description: 'The message ID to retrieve.',
      },
    },
    required: ['inbox_id', 'message_id'],
    additionalProperties: false,
  }),
  async execute(input: GetMessageInput): Promise<MessageResult> {
    if (!input.inbox_id) {
      throw new Error('inbox_id is required and must be non-empty');
    }
    if (!input.message_id) {
      throw new Error('message_id is required and must be non-empty');
    }

    try {
      return await apiRequest<MessageResult>(
        'GET',
        `/inboxes/${encodeURIComponent(input.inbox_id)}/messages/${encodeURIComponent(input.message_id)}`
      );
    } catch (error) {
      throw new Error(
        `Failed to get message "${input.message_id}" from inbox "${input.inbox_id}": ${(error as Error).message}`
      );
    }
  },
});

// ─── Threads ────────────────────────────────────────────────────────────────

export interface ListThreadsInput {
  inbox_id: string;
  limit?: number;
  page_token?: string;
  labels?: string[];
}

export const listThreads = tool({
  description: 'List email threads in an inbox, optionally filtered by labels.',
  inputSchema: jsonSchema<ListThreadsInput>({
    type: 'object',
    properties: {
      inbox_id: {
        type: 'string',
        description: 'The inbox ID to list threads from.',
      },
      limit: {
        type: 'number',
        description: 'Number of threads to return (1-100, default: 50).',
      },
      page_token: {
        type: 'string',
        description: 'Pagination token from previous response.',
      },
      labels: {
        type: 'array',
        items: { type: 'string' },
        description: 'Optional labels to filter threads by.',
      },
    },
    required: ['inbox_id'],
    additionalProperties: false,
  }),
  async execute(input: ListThreadsInput): Promise<ListThreadsResult> {
    if (!input.inbox_id) {
      throw new Error('inbox_id is required and must be non-empty');
    }
    if (input.limit !== undefined && (input.limit < 1 || input.limit > 100)) {
      throw new Error('Limit must be between 1 and 100');
    }

    try {
      const params = new URLSearchParams();
      if (input.limit !== undefined) params.append('limit', String(input.limit));
      if (input.page_token) params.append('page_token', input.page_token);
      if (Array.isArray(input.labels)) {
        const validLabels = input.labels.filter(
          (label) => typeof label === 'string' && label.trim().length > 0
        );
        for (const label of validLabels) {
          params.append('labels', label);
        }
      }

      const queryString = params.toString();
      const path = queryString
        ? `/inboxes/${encodeURIComponent(input.inbox_id)}/threads?${queryString}`
        : `/inboxes/${encodeURIComponent(input.inbox_id)}/threads`;

      return await apiRequest<ListThreadsResult>('GET', path);
    } catch (error) {
      throw new Error(
        `Failed to list threads for inbox "${input.inbox_id}": ${(error as Error).message}`
      );
    }
  },
});

export interface GetThreadInput {
  inbox_id: string;
  thread_id: string;
}

export const getThread = tool({
  description: 'Get a thread with all its messages for viewing a full conversation.',
  inputSchema: jsonSchema<GetThreadInput>({
    type: 'object',
    properties: {
      inbox_id: {
        type: 'string',
        description: 'The inbox ID.',
      },
      thread_id: {
        type: 'string',
        description: 'The thread ID to retrieve.',
      },
    },
    required: ['inbox_id', 'thread_id'],
    additionalProperties: false,
  }),
  async execute(input: GetThreadInput): Promise<ThreadDetailResult> {
    try {
      if (!input.inbox_id || !input.thread_id) {
        throw new Error('inbox_id and thread_id are required and must be non-empty');
      }
      return await apiRequest<ThreadDetailResult>(
        'GET',
        `/inboxes/${input.inbox_id}/threads/${input.thread_id}`
      );
    } catch (error) {
      throw new Error(`Failed to get thread: ${(error as Error).message}`);
    }
  },
});

// ─── Drafts ─────────────────────────────────────────────────────────────────

export interface CreateDraftInput {
  inbox_id: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  cc?: string;
  bcc?: string;
}

export const createDraft = tool({
  description: 'Create an email draft for human-in-the-loop approval before sending.',
  inputSchema: jsonSchema<CreateDraftInput>({
    type: 'object',
    properties: {
      inbox_id: {
        type: 'string',
        description: 'The inbox ID to create the draft in.',
      },
      to: {
        type: 'string',
        description: 'Recipient email address.',
      },
      subject: {
        type: 'string',
        description: 'Email subject line.',
      },
      text: {
        type: 'string',
        description: 'Plain text email body.',
      },
      html: {
        type: 'string',
        description: 'Optional HTML email body.',
      },
      cc: {
        type: 'string',
        description: 'Optional CC recipients (comma-separated).',
      },
      bcc: {
        type: 'string',
        description: 'Optional BCC recipients (comma-separated).',
      },
    },
    required: ['inbox_id', 'to', 'subject', 'text'],
    additionalProperties: false,
  }),
  async execute(input: CreateDraftInput): Promise<DraftResult> {
    try {
      if (!input.inbox_id || !input.to || !input.subject || !input.text) {
        throw new Error('inbox_id, to, subject, and text are required and must be non-empty');
      }
      return await apiRequest<DraftResult>('POST', `/inboxes/${input.inbox_id}/drafts`, {
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
        cc: input.cc,
        bcc: input.bcc,
      });
    } catch (error) {
      throw new Error(`Failed to create draft: ${(error as Error).message}`);
    }
  },
});

export interface SendDraftInput {
  inbox_id: string;
  draft_id: string;
}

export const sendDraft = tool({
  description: 'Send a previously created draft, converting it to a sent message.',
  inputSchema: jsonSchema<SendDraftInput>({
    type: 'object',
    properties: {
      inbox_id: {
        type: 'string',
        description: 'The inbox ID.',
      },
      draft_id: {
        type: 'string',
        description: 'The draft ID to send.',
      },
    },
    required: ['inbox_id', 'draft_id'],
    additionalProperties: false,
  }),
  async execute(input: SendDraftInput): Promise<MessageResult> {
    if (!input.inbox_id) {
      throw new Error('inbox_id is required and must be non-empty');
    }
    if (!input.draft_id) {
      throw new Error('draft_id is required and must be non-empty');
    }

    try {
      const response = await apiRequest<MessageResult>(
        'POST',
        `/inboxes/${encodeURIComponent(input.inbox_id)}/drafts/${encodeURIComponent(input.draft_id)}/send`
      );

      if (!response || !response.message_id) {
        throw new Error('AgentMail API returned an invalid response when sending draft');
      }

      return response;
    } catch (error) {
      throw new Error(
        `Failed to send draft "${input.draft_id}" from inbox "${input.inbox_id}": ${(error as Error).message}`
      );
    }
  },
});

// ─── Default Export ─────────────────────────────────────────────────────────

export default {
  // Inboxes
  createInbox,
  listInboxes,
  getInbox,
  deleteInbox,
  // Messages
  sendMessage,
  replyToMessage,
  listMessages,
  getMessage,
  // Threads
  listThreads,
  getThread,
  // Drafts
  createDraft,
  sendDraft,
};
