# @tpmjs/tools-mail

Send email through whichever provider you have a key for — Resend, Postmark, SendGrid or Mailgun — with one consistent sendEmail tool.

Part of the **ajax weapons** set: task-level, provider-agnostic tools that an agent can pick up without learning a vendor API. Credentials come from the environment; on tpmjs add them as collection env vars (the collection owner's calls get them injected, everyone else supplies their own).

## Installation

```bash
npm install @tpmjs/tools-mail
```

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | no | Resend API key (https://resend.com) — one of the provider keys is required |
| `POSTMARK_SERVER_TOKEN` | no | Postmark server token (https://postmarkapp.com) |
| `SENDGRID_API_KEY` | no | SendGrid API key |
| `MAILGUN_API_KEY` | no | Mailgun API key (needs MAILGUN_DOMAIN) |
| `MAILGUN_DOMAIN` | no | Mailgun sending domain |
| `EMAIL_FROM` | no | Default sender, e.g. "Ajax <ajax@example.com>" |
| `EMAIL_PROVIDER` | no | Force a provider: resend | postmark | sendgrid | mailgun (default: auto-detect from keys) |

## Tools

| Export | What it does |
| --- | --- |
| `sendEmail` | Send an email (text and/or HTML, cc/bcc/reply-to) through the first configured provider: Resend, Postmark, SendGrid or Mailgun. |

## Usage

```typescript
import { sendEmail } from '@tpmjs/tools-mail';

await sendEmail.execute(
  { to: 'you@example.com', subject: 'Deploy done', text: 'All green.' },
  { toolCallId: 'c1', messages: [] }
);
```

Every tool throws a readable error on provider failures (status code + provider message), so agents can react instead of guessing.

## License

MIT
