# @tpmjs/tools-discord-chat

Read and post in Discord the way a person does: channels by name, catch up on what happened since a time, post or reply, react — bot token or plain webhook.

Part of the **ajax weapons** set: task-level, provider-agnostic tools that an agent can pick up without learning a vendor API. Credentials come from the environment; on tpmjs add them as collection env vars (the collection owner's calls get them injected, everyone else supplies their own).

## Installation

```bash
npm install @tpmjs/tools-discord-chat
```

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DISCORD_BOT_TOKEN` | no | Discord bot token (required for reading; posting can fall back to DISCORD_WEBHOOK_URL) |
| `DISCORD_GUILD_ID` | no | Default server (guild) id used to resolve channel names |
| `DISCORD_WEBHOOK_URL` | no | Webhook URL used by discordPost when no bot token / channel is given |

## Tools

| Export | What it does |
| --- | --- |
| `discordChannels` | List the text channels the bot can see (id, name, topic, server), optionally filtered by name. |
| `discordRead` | Read recent messages from a channel by name or id, newest last, with authors, attachments and reply links. |
| `discordCatchUp` | Catch up on everything posted since a point in time (e.g. "24h") across one, several or all text channels. |
| `discordPost` | Post a message to a channel by name or id (optionally as a reply), or to DISCORD_WEBHOOK_URL when no channel is given. |
| `discordReact` | Add an emoji reaction to a message in a channel. |

## Usage

```typescript
import { discordCatchUp, discordPost } from '@tpmjs/tools-discord-chat';

const ctx = { toolCallId: 'c1', messages: [] };
const recap = await discordCatchUp.execute({ since: '24h' }, ctx);
await discordPost.execute({ channel: 'general', content: 'Morning! Shipping the admin console today.' }, ctx);
```

Every tool throws a readable error on provider failures (status code + provider message), so agents can react instead of guessing.

## License

MIT
