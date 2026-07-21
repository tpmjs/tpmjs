# Skill surface — RealSkills

Every collection also exposes a **living skills endpoint**. Instead of a static `skills.md`, an agent
asks the collection how to use its tools and gets an AI‑generated, RAG‑backed answer that improves as
more agents ask. This example is config/HTTP only — nothing to install.

## The endpoint

```
https://tpmjs.com/{user}/collections/{slug}/skills
```

(Route source of truth:
[`apps/web/src/app/(profile)/[username]/collections/[slug]/skills/route.ts`](../../apps/web/src/app/%28profile%29/%5Busername%5D/collections/%5Bslug%5D/skills/route.ts).)

- **`GET`** → the collection's skill summary as **`text/markdown`**. First access lazily seeds the
  endpoint with synthetic Q&A, so it is useful immediately.
- **`POST`** → ask a question, get a tailored answer plus follow‑ups.

## 1. Fetch the skill summary (GET)

```bash
curl https://tpmjs.com/{user}/collections/{slug}/skills
```

Returns markdown guidance. Point an agent at this on first contact with the collection.

## 2. Ask a question (POST)

```bash
curl -X POST https://tpmjs.com/{user}/collections/{slug}/skills \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How do I encode text to base64 with these tools?",
    "agentName": "my-agent",
    "tags": ["base64", "encoding"]
  }'
```

### Request schema

| Field | Type | Required | Notes |
|---|---|---|---|
| `question` | string | ✅ | 5–2000 characters |
| `sessionId` | string | | Continue a multi‑turn conversation (context kept ~24h) |
| `agentName` | string | | Self‑reported agent identity |
| `context` | string | | Extra context, max 2000 chars |
| `tags` | string[] | | Up to 10 hint tags |

### Response shape

```json
{
  "success": true,
  "data": {
    "answer": "To encode text to base64 with these tools...",
    "confidence": 0.85,
    "basedOn": 3,
    "skillsIdentified": ["base64", "encoding"],
    "sessionId": "sess_abc123",
    "suggestedFollowups": ["How do I decode it back?"]
  },
  "meta": { "cached": false, "questionId": "clx123abc456", "processingMs": 1234 }
}
```

Continue the conversation by passing the returned `sessionId` on the next POST. If the endpoint is
still seeding, you get a `202` with `data.status: "seeding"` — retry in a few seconds.

## Using it from an agent

```ts
const baseUrl = 'https://tpmjs.com';
const res = await fetch(`${baseUrl}/${user}/collections/${slug}/skills`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: 'How do I encode text to base64 with these tools?',
    agentName: 'my-automation-agent',
    tags: ['base64'],
  }),
});
const { data } = await res.json();
console.log(data.answer); // use this guidance to drive the tools
```

## Notes

- Replace `{user}` and `{slug}` with a real username and collection slug (the docs use
  `ajaxdavis/collections/my-tools` as their example form).
- Request/response schema verified against the route source and
  [the Skills docs](https://tpmjs.com/docs/skills).
