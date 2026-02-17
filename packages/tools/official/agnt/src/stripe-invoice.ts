/**
 * @tpmjs/official-agnt-stripe-invoice — Stripe Invoice Tools for AI Agents
 *
 * Create and send Stripe invoices with support for single or multiple line items.
 * Uses the Stripe REST API directly with form-encoded requests.
 *
 * @requires STRIPE_SECRET_KEY environment variable
 */

import { jsonSchema, tool } from 'ai';

const STRIPE_BASE_URL = 'https://api.stripe.com/v1';

// ─── Client Infrastructure ──────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY environment variable is required. Get your secret key from https://dashboard.stripe.com/apikeys'
    );
  }
  return key;
}

async function stripeRequest<T>(
  method: string,
  path: string,
  body?: Record<string, string>
): Promise<T> {
  const key = getApiKey();

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const options: RequestInit = { method, headers };
  if (body) {
    options.body = new URLSearchParams(body).toString();
  }

  const response = await fetch(`${STRIPE_BASE_URL}${path}`, options);

  if (!response.ok) {
    await handleStripeError(response);
  }

  return (await response.json()) as T;
}

async function handleStripeError(response: Response): Promise<never> {
  let errorMessage: string;
  try {
    const errorData = (await response.json()) as {
      error?: { message?: string; type?: string; code?: string };
    };
    errorMessage = errorData.error?.message || `HTTP ${response.status}`;
    if (errorData.error?.code) {
      errorMessage = `${errorMessage} (code: ${errorData.error.code})`;
    }
  } catch {
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }

  switch (response.status) {
    case 400:
      throw new Error(`Bad request: ${errorMessage}`);
    case 401:
      throw new Error('Authentication failed: Invalid Stripe secret key. Check STRIPE_SECRET_KEY.');
    case 402:
      throw new Error(`Payment required: ${errorMessage}`);
    case 403:
      throw new Error(`Access forbidden: ${errorMessage}`);
    case 404:
      throw new Error(`Not found: ${errorMessage}`);
    case 429:
      throw new Error(`Rate limit exceeded: ${errorMessage}`);
    default:
      throw new Error(`Stripe API error (${response.status}): ${errorMessage}`);
  }
}

// ─── Output Types ────────────────────────────────────────────────────────────

export interface StripeInvoiceResult {
  invoiceId: string;
  invoiceNumber: string | null;
  invoiceUrl: string | null;
  invoicePdf: string | null;
  status: string;
  total: number;
  currency: string;
}

export interface StripeLineItem {
  description: string;
  amount: number;
}

// ─── Stripe Types (internal) ─────────────────────────────────────────────────

interface StripeCustomer {
  id: string;
  email: string;
}

interface StripeInvoiceItem {
  id: string;
  invoice: string | null;
  amount: number;
  description: string;
}

interface StripeInvoice {
  id: string;
  number: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  status: string;
  total: number;
  currency: string;
}

// ─── Create Invoice Tool ────────────────────────────────────────────────────

const VALID_CURRENCIES = ['usd', 'eur', 'gbp', 'jpy'];

export interface CreateStripeInvoiceInput {
  customerEmail: string;
  dueDate: string;
  currency?: string;
  description?: string;
  amount?: number;
  lineItems?: string;
}

export const createStripeInvoice = tool({
  description:
    'Create and send a Stripe invoice. Provide either a single item (description + amount) or multiple items via lineItems JSON array. Amounts are in the smallest currency unit (e.g. cents for USD).',
  inputSchema: jsonSchema<CreateStripeInvoiceInput>({
    type: 'object',
    properties: {
      customerEmail: {
        type: 'string',
        description: 'Email address of the customer to invoice.',
      },
      dueDate: {
        type: 'string',
        description: 'Invoice due date in YYYY-MM-DD format.',
      },
      currency: {
        type: 'string',
        description: 'Three-letter currency code: USD, EUR, GBP, or JPY (default: USD).',
      },
      description: {
        type: 'string',
        description:
          'Description for a single line item. Use this with "amount" for simple invoices.',
      },
      amount: {
        type: 'number',
        description:
          'Amount in smallest currency unit (e.g. cents) for a single line item. Use with "description".',
      },
      lineItems: {
        type: 'string',
        description:
          'JSON array of line items for multi-item invoices. Each item: {"description": "...", "amount": 1000}. Amounts in smallest currency unit.',
      },
    },
    required: ['customerEmail', 'dueDate'],
    additionalProperties: false,
  }),
  async execute(input: CreateStripeInvoiceInput): Promise<StripeInvoiceResult> {
    try {
      if (!input.customerEmail || input.customerEmail.trim().length === 0) {
        throw new Error('customerEmail is required and must be non-empty');
      }

      if (!input.dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)) {
        throw new Error('dueDate is required and must be in YYYY-MM-DD format');
      }

      const currency = (input.currency ?? 'USD').toLowerCase();
      if (!VALID_CURRENCIES.includes(currency)) {
        throw new Error(
          `currency must be one of: ${VALID_CURRENCIES.map((c) => c.toUpperCase()).join(', ')}`
        );
      }

      // Parse line items
      let items: StripeLineItem[] = [];

      if (input.lineItems) {
        try {
          items = JSON.parse(input.lineItems) as StripeLineItem[];
        } catch {
          throw new Error(
            'lineItems must be a valid JSON array (e.g. \'[{"description": "Service", "amount": 5000}]\')'
          );
        }

        if (!Array.isArray(items) || items.length === 0) {
          throw new Error('lineItems must be a non-empty array');
        }

        for (const item of items) {
          if (!item.description || typeof item.amount !== 'number') {
            throw new Error(
              'Each line item must have a "description" (string) and "amount" (number)'
            );
          }
          if (item.amount <= 0) {
            throw new Error('Each line item amount must be greater than 0');
          }
        }
      } else if (input.description && input.amount !== undefined) {
        if (input.amount <= 0) {
          throw new Error('amount must be greater than 0');
        }
        items = [{ description: input.description, amount: input.amount }];
      } else {
        throw new Error(
          'Provide either "description" + "amount" for a single item, or "lineItems" JSON array for multiple items'
        );
      }

      // Step 1: Create or find customer
      const customer = await stripeRequest<StripeCustomer>('POST', '/customers', {
        email: input.customerEmail,
      });

      // Step 2: Calculate due date as Unix timestamp
      const dueDateTimestamp = Math.floor(new Date(input.dueDate).getTime() / 1000);

      // Step 3: Create invoice
      const invoice = await stripeRequest<StripeInvoice>('POST', '/invoices', {
        customer: customer.id,
        currency,
        due_date: String(dueDateTimestamp),
        collection_method: 'send_invoice',
      });

      // Step 4: Create invoice items
      for (const item of items) {
        await stripeRequest<StripeInvoiceItem>('POST', '/invoiceitems', {
          customer: customer.id,
          invoice: invoice.id,
          amount: String(item.amount),
          currency,
          description: item.description,
        });
      }

      // Step 5: Finalize the invoice
      await stripeRequest<StripeInvoice>('POST', `/invoices/${invoice.id}/finalize`);

      // Step 6: Send the invoice
      const sentInvoice = await stripeRequest<StripeInvoice>(
        'POST',
        `/invoices/${invoice.id}/send`
      );

      return {
        invoiceId: sentInvoice.id,
        invoiceNumber: sentInvoice.number,
        invoiceUrl: sentInvoice.hosted_invoice_url,
        invoicePdf: sentInvoice.invoice_pdf,
        status: sentInvoice.status,
        total: sentInvoice.total,
        currency: sentInvoice.currency,
      };
    } catch (error) {
      throw new Error(`Failed to create Stripe invoice: ${(error as Error).message}`);
    }
  },
});
