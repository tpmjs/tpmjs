# @tpmjs/tools-x

Post to X (Twitter) as yourself: tweets with media, threads, replies, delete, read mentions and search — OAuth 1.0a user context.

Part of the **ajax weapons** set: task-level, provider-agnostic tools that an agent can pick up without learning a vendor API. Credentials come from the environment; on tpmjs add them as collection env vars (the collection owner's calls get them injected, everyone else supplies their own).

## Installation

```bash
npm install @tpmjs/tools-x
```

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `X_API_KEY` | yes | X app API key (consumer key); TWITTER_API_KEY is accepted as an alias |
| `X_API_SECRET` | yes | X app API secret; TWITTER_API_SECRET alias |
| `X_ACCESS_TOKEN` | yes | User access token; TWITTER_ACCESS_TOKEN alias |
| `X_ACCESS_SECRET` | yes | User access token secret; TWITTER_ACCESS_SECRET alias |

## Tools

| Export | What it does |
| --- | --- |
| `tweet` | Post a tweet, optionally as a reply or quote, with up to 4 images attached from URLs. |
| `tweetThread` | Post a thread: each text becomes a reply to the previous tweet. |
| `deleteTweet` | Delete one of your tweets by id. |
| `getTweet` | Fetch a tweet by id with author, metrics and referenced tweets. |
| `myMentions` | Read recent tweets that mention the authenticated account. |
| `searchTweets` | Search recent tweets (last 7 days) with the X search syntax. |
| `xWhoAmI` | Show which X account the configured credentials belong to — use it to verify setup. |

## Usage

```typescript
import { tweet, xWhoAmI } from '@tpmjs/tools-x';

const ctx = { toolCallId: 'c1', messages: [] };
console.log(await xWhoAmI.execute({}, ctx));
await tweet.execute({ text: 'Shipped a thing.', mediaUrls: ['https://example.com/shot.png'] }, ctx);
```

Every tool throws a readable error on provider failures (status code + provider message), so agents can react instead of guessing.

## License

MIT
