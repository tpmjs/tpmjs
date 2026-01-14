---
description: Cancel the active Ralph loop
command: rm -f .claude/ralph-loop.local.md && echo "Ralph loop cancelled"
---

# Cancel Ralph Loop

Immediately cancel any active Ralph loop and allow normal session exit.

## Usage

```
/cancel-ralph
```

This removes the state file that drives the loop, allowing the session to exit normally.
