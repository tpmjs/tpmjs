# Environment Variables Not Sent to API - Frontend Transport Issue

## Problem

Environment variables saved in localStorage are NOT being sent to `/api/chat` endpoint.

**Evidence from logs:**
```
📥 Request body: {
  "conversationId": "7xur5hf1GDSOQMgFYF-l7",
  "env": {},  // ❌ EMPTY - should have FIRECRAWL_API_KEY
  ...
}
```

## Root Cause

The issue is in `apps/playground/src/hooks/useChat.ts`:

```typescript
export function useChat() {
  const [conversationId] = useState(() => nanoid());
  const envVars = useEnvVars();  // ❌ Empty on first render (useEffect loads async)

  const envObject = envVars.reduce(
    (acc, { key, value }) => {
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  const chat = useAISDKChat({
    transport: new DefaultChatTransport({  // ❌ Created ONCE with empty envObject
      api: '/api/chat',
      body: {
        conversationId,
        env: envObject,  // ❌ This is {} on first render, never updates
      },
    }),
  });

  return { ...chat, conversationId };
}
```

**Why it fails:**

1. `useEnvVars()` loads from localStorage inside a `useEffect` (async)
2. On first render, `envVars = []`, so `envObject = {}`
3. `DefaultChatTransport` is created with `body: { env: {} }`
4. Even when `envVars` updates later, the transport is already created and doesn't re-create

## Attempted Solutions That Don't Work

❌ **Just updating state** - Transport is created once and cached
❌ **Using useEffect** - Transport is already created before effect runs

## What We Need

The `body` field in `DefaultChatTransport` needs to be **dynamic** and read the latest env vars on each request, not just once during component mount.

## Questions for ChatGPT

1. **How do we make `DefaultChatTransport` body dynamic?** Can we pass a function instead of an object?

2. **Does AI SDK have a way to update transport body between messages?** The env vars might change while the chat is open.

3. **Should we use a custom transport instead?** Can we implement our own transport that reads env vars fresh on each request?

4. **Alternative: Can we manually add env to each message?** Is there a way to inject extra data per-request instead of per-transport?

## Current Code Files

- `apps/playground/src/hooks/useChat.ts` - The broken hook
- `apps/playground/src/components/sidebar/SettingsSidebar.tsx` - Where env vars are stored (works fine)
- `apps/playground/src/app/api/chat/route.ts` - Server expects `body.env` but receives `{}`

## What We Know Works

✅ Saving env vars to localStorage - working
✅ Reading env vars from localStorage - working
✅ Server accepting and using env vars - working
❌ **Sending env vars from client to server - BROKEN**

The ONLY broken part is the transport not sending the latest env object.
