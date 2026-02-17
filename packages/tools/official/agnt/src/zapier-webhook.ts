/**
 * @tpmjs/official-agnt-zapier-webhook — Zapier Webhook Tool for AI Agents
 *
 * Trigger Zapier automations by sending JSON data to Zap webhook URLs.
 * Connect to 6000+ apps through Zapier's automation platform.
 *
 * No environment variables required — webhook URLs are provided per request.
 */

import { jsonSchema, tool } from 'ai';

// ─── Output Types ────────────────────────────────────────────────────────────

export interface TriggerWebhookResult {
  success: boolean;
  status: number;
  response: string;
}

// ─── triggerZapierWebhook ────────────────────────────────────────────────────

export interface TriggerZapierWebhookInput {
  webhookUrl: string;
  payload: string;
}

export const triggerZapierWebhook = tool({
  description:
    'Send JSON data to a Zapier webhook URL to trigger a Zap automation. The webhook URL must be a valid Zapier "Catch Hook" URL. The payload should be a JSON string containing the data to send.',
  inputSchema: jsonSchema<TriggerZapierWebhookInput>({
    type: 'object',
    properties: {
      webhookUrl: {
        type: 'string',
        description:
          'The Zapier "Catch Hook" webhook URL to send data to (must start with https://hooks.zapier.com/).',
      },
      payload: {
        type: 'string',
        description:
          'JSON string containing the data to send to the webhook. Must be valid JSON (e.g., \'{"name": "John", "email": "john@example.com"}\').',
      },
    },
    required: ['webhookUrl', 'payload'],
    additionalProperties: false,
  }),
  async execute(input: TriggerZapierWebhookInput): Promise<TriggerWebhookResult> {
    try {
      if (!input.webhookUrl || input.webhookUrl.trim() === '') {
        throw new Error('webhookUrl is required and must be non-empty');
      }
      if (!input.payload || input.payload.trim() === '') {
        throw new Error('payload is required and must be non-empty');
      }

      // Validate the webhook URL is a Zapier hook
      if (!input.webhookUrl.startsWith('https://hooks.zapier.com/')) {
        throw new Error(
          'Invalid webhook URL: must start with https://hooks.zapier.com/. Get your webhook URL from the Zapier "Catch Hook" trigger.'
        );
      }

      // Validate URL format
      try {
        new URL(input.webhookUrl);
      } catch {
        throw new Error(`Invalid webhook URL format: ${input.webhookUrl}`);
      }

      // Parse and validate JSON payload
      let parsedPayload: unknown;
      try {
        parsedPayload = JSON.parse(input.payload);
      } catch {
        throw new Error(
          'Invalid JSON payload: the payload must be a valid JSON string. Example: \'{"key": "value"}\''
        );
      }

      const response = await fetch(input.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedPayload),
      });

      let responseBody: string;
      try {
        responseBody = await response.text();
      } catch {
        responseBody = '';
      }

      if (!response.ok) {
        throw new Error(
          `Zapier webhook returned HTTP ${response.status}: ${responseBody || response.statusText}`
        );
      }

      return {
        success: true,
        status: response.status,
        response: responseBody,
      };
    } catch (error) {
      throw new Error(`Failed to trigger Zapier webhook: ${(error as Error).message}`);
    }
  },
});
