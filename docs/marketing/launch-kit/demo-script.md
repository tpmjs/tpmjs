# 60-second demo script

**Goal:** show the killer flow — one curated collection, added to a real agent in seconds, then reused on another surface. All commands are real and verified.

**Format:** screen recording, terminal + browser. Narration in **bold**, on-screen actions in _italics_.

---

**[0:00–0:08] The hook**
> "Every AI tool ships its own protocol. TPMJS lets you curate a collection once and use it everywhere. Watch."

_Browser: tpmjs.com homepage — 781 tools, 237 packages. Click into a collection: `@ajax/claude-code-tools` (60 tools). Show the tool list._

**[0:08–0:20] Grab the collection as MCP**
> "This is a collection — 60 curated tools. I'll add all of them to Claude Code as one MCP endpoint."

_On the collection page, click "copy" on the MCP install command. Switch to terminal, paste:_
```
claude mcp add --transport http tpmjs-claude-code-tools \
  https://tpmjs.com/@ajax/collections/claude-code-tools/mcp
```
_Show `claude mcp list` — the server is connected._

**[0:20–0:35] Use it in the agent**
> "That's it — no per-tool wiring. The agent now has all 60."

_In Claude Code, ask something that uses a tool from the collection. Show the tool call + result._

**[0:35–0:48] Same collection, different surface**
> "Same collection, no changes — here it is over plain REST."

_Terminal: run a real tool over REST:_
```
curl -s https://tpmjs.com/api/registry/execute \
  -H 'content-type: application/json' \
  -d '{"toolId":"@tpmjs/official-base64-encode::base64EncodeTool","params":{"data":"Hello, TPMJS!"}}'
```
_Show the JSON result: `{"success":true,"result":{"base64":"SGVsbG8sIFRQTUpTIQ==","byteLength":13}}`._

**[0:48–0:58] The point + open source**
> "CLI, MCP, REST, SDK, Skill — one collection, every surface. Health-scored, sandboxed, and fully open source. Self-host the whole thing."

_Browser: flash the GitHub repo and the surface switcher on a tool page._

**[0:58–1:00] CTA**
> "It's early — try it at tpmjs.com, and tell us what breaks."

---

**Recording notes**
- Pre-solve the Anubis/rate limits: warm the collection page and the MCP endpoint before recording.
- Keep the terminal font large; trim any latency in post.
- Do NOT show inflated numbers — the homepage now shows real counts (781/237). Keep it that way.
