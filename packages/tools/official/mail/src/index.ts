/**
 * @tpmjs/tools-mail — one `sendEmail` for whichever provider you have a key for.
 *
 * Provider is auto-detected from the environment (first match wins) or forced with
 * EMAIL_PROVIDER: Resend, Postmark, SendGrid, Mailgun. Every provider is driven over
 * plain HTTPS so the tool runs anywhere fetch does.
 *
 * @env RESEND_API_KEY | POSTMARK_SERVER_TOKEN | SENDGRID_API_KEY | MAILGUN_API_KEY + MAILGUN_DOMAIN
 * @env EMAIL_FROM default sender ("Name <addr>"), EMAIL_PROVIDER optional override
 */

import { jsonSchema, tool } from 'ai';

type Provider = 'resend' | 'postmark' | 'sendgrid' | 'mailgun';

interface Detected {
  provider: Provider;
  key: string;
  domain?: string;
}

function envValue(name: string): string | undefined {
  const value = globalThis.process?.env?.[name];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function detectProvider(): Detected {
  const forced = envValue('EMAIL_PROVIDER')?.toLowerCase() as Provider | undefined;
  const candidates: Array<Detected | null> = [
    envValue('RESEND_API_KEY')
      ? { provider: 'resend', key: envValue('RESEND_API_KEY') as string }
      : null,
    envValue('POSTMARK_SERVER_TOKEN')
      ? { provider: 'postmark', key: envValue('POSTMARK_SERVER_TOKEN') as string }
      : null,
    envValue('SENDGRID_API_KEY')
      ? { provider: 'sendgrid', key: envValue('SENDGRID_API_KEY') as string }
      : null,
    envValue('MAILGUN_API_KEY') && envValue('MAILGUN_DOMAIN')
      ? {
          provider: 'mailgun',
          key: envValue('MAILGUN_API_KEY') as string,
          domain: envValue('MAILGUN_DOMAIN'),
        }
      : null,
  ];
  const available = candidates.filter((c): c is Detected => c !== null);
  if (forced) {
    const hit = available.find((c) => c.provider === forced);
    if (!hit) throw new Error(`EMAIL_PROVIDER=${forced} but its credentials are not configured.`);
    return hit;
  }
  if (!available[0]) {
    throw new Error(
      'No email provider configured. Set one of RESEND_API_KEY, POSTMARK_SERVER_TOKEN, SENDGRID_API_KEY, or MAILGUN_API_KEY + MAILGUN_DOMAIN.'
    );
  }
  return available[0];
}

const toList = (value: string | string[] | undefined): string[] =>
  value === undefined
    ? []
    : Array.isArray(value)
      ? value
      : value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

async function readError(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  return `${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 300)}` : ''}`;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface SendEmailResult {
  ok: true;
  provider: Provider;
  id: string | null;
  from: string;
  to: string[];
  subject: string;
}

interface Outgoing {
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

async function viaResend(key: string, m: Outgoing): Promise<string | null> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: m.from,
      to: m.to,
      subject: m.subject,
      text: m.text,
      html: m.html,
      reply_to: m.replyTo,
      cc: m.cc.length ? m.cc : undefined,
      bcc: m.bcc.length ? m.bcc : undefined,
    }),
  });
  if (!res.ok) throw new Error(`Resend rejected the email: ${await readError(res)}`);
  return ((await res.json()) as { id?: string }).id ?? null;
}

async function viaPostmark(key: string, m: Outgoing): Promise<string | null> {
  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      'X-Postmark-Server-Token': key,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      From: m.from,
      To: m.to.join(','),
      Cc: m.cc.join(',') || undefined,
      Bcc: m.bcc.join(',') || undefined,
      Subject: m.subject,
      TextBody: m.text,
      HtmlBody: m.html,
      ReplyTo: m.replyTo,
    }),
  });
  if (!res.ok) throw new Error(`Postmark rejected the email: ${await readError(res)}`);
  return ((await res.json()) as { MessageID?: string }).MessageID ?? null;
}

async function viaSendgrid(key: string, m: Outgoing): Promise<string | null> {
  const content = [
    ...(m.text ? [{ type: 'text/plain', value: m.text }] : []),
    ...(m.html ? [{ type: 'text/html', value: m.html }] : []),
  ];
  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [
        {
          to: m.to.map((email) => ({ email })),
          cc: m.cc.length ? m.cc.map((email) => ({ email })) : undefined,
          bcc: m.bcc.length ? m.bcc.map((email) => ({ email })) : undefined,
        },
      ],
      from: { email: m.from.replace(/^.*<(.+)>$/, '$1') },
      reply_to: m.replyTo ? { email: m.replyTo } : undefined,
      subject: m.subject,
      content,
    }),
  });
  if (!res.ok) throw new Error(`SendGrid rejected the email: ${await readError(res)}`);
  return res.headers.get('x-message-id');
}

async function viaMailgun(key: string, domain: string, m: Outgoing): Promise<string | null> {
  const form = new URLSearchParams();
  form.set('from', m.from);
  for (const r of m.to) form.append('to', r);
  for (const r of m.cc) form.append('cc', r);
  for (const r of m.bcc) form.append('bcc', r);
  form.set('subject', m.subject);
  if (m.text) form.set('text', m.text);
  if (m.html) form.set('html', m.html);
  if (m.replyTo) form.set('h:Reply-To', m.replyTo);
  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: { Authorization: `Basic ${btoa(`api:${key}`)}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Mailgun rejected the email: ${await readError(res)}`);
  return ((await res.json()) as { id?: string }).id ?? null;
}

const SENDERS: Record<Provider, (d: Detected, m: Outgoing) => Promise<string | null>> = {
  resend: (d, m) => viaResend(d.key, m),
  postmark: (d, m) => viaPostmark(d.key, m),
  sendgrid: (d, m) => viaSendgrid(d.key, m),
  mailgun: (d, m) => viaMailgun(d.key, d.domain ?? '', m),
};

export async function sendEmailWith(input: SendEmailInput): Promise<SendEmailResult> {
  const detected = detectProvider();
  const from = input.from ?? envValue('EMAIL_FROM');
  if (!from) {
    throw new Error('No sender: pass `from` or set EMAIL_FROM (e.g. "Ajax <ajax@example.com>").');
  }
  if (!input.text && !input.html) throw new Error('Provide `text` and/or `html`.');
  const outgoing: Outgoing = {
    from,
    to: toList(input.to),
    cc: toList(input.cc),
    bcc: toList(input.bcc),
    subject: input.subject,
    text: input.text,
    html: input.html,
    replyTo: input.replyTo,
  };
  if (outgoing.to.length === 0) throw new Error('At least one recipient is required.');
  const id = await SENDERS[detected.provider](detected, outgoing);
  return {
    ok: true,
    provider: detected.provider,
    id,
    from,
    to: outgoing.to,
    subject: input.subject,
  };
}

export const sendEmail = tool({
  description:
    'Send an email (text and/or HTML, cc/bcc/reply-to) through the first configured provider: Resend, Postmark, SendGrid or Mailgun. Returns the provider message id.',
  inputSchema: jsonSchema<SendEmailInput>({
    type: 'object',
    properties: {
      to: {
        description: 'Recipient address, comma-separated list, or array',
        anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
      },
      subject: { type: 'string', description: 'Subject line' },
      text: {
        type: 'string',
        description: 'Plain-text body (recommended even when html is given)',
      },
      html: { type: 'string', description: 'HTML body' },
      from: { type: 'string', description: 'Sender ("Name <addr>"); defaults to EMAIL_FROM' },
      replyTo: { type: 'string', description: 'Reply-To address' },
      cc: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
      bcc: { anyOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
    },
    required: ['to', 'subject'],
    additionalProperties: false,
  }),
  async execute(input): Promise<SendEmailResult> {
    return sendEmailWith(input);
  },
});

export default sendEmail;
