# Vercel AI Registry Sync

Automated system that syncs tools from Vercel's AI SDK registry to our manual-tools.ts file.

## Overview

The Vercel AI SDK maintains an official registry of tools at:
```
https://github.com/vercel/ai/blob/main/content/tools-registry/registry.ts
```

This automation:
1. Fetches the latest registry every hour
2. Identifies new tools not yet in our manual-tools.ts
3. Uses OpenAI GPT-4 to intelligently convert tool metadata
4. Appends new tools to manual-tools.ts
5. Commits and pushes changes automatically
6. Sends Discord notifications

## How It Works

### 1. Script: `sync-vercel-registry.ts`

Located at the repository root, this TypeScript script:

**Step 1: Fetch Registry**
- Downloads `registry.ts` from Vercel's GitHub
- Parses TypeScript to extract tool definitions
- Converts to JSON array

**Step 2: Find New Tools**
- Compares against existing `manual-tools.ts`
- Identifies tools by `npmPackageName`
- Returns list of new tools to add

**Step 3: AI Conversion**
- For each new tool, calls OpenAI GPT-4
- Provides Vercel tool metadata + our ManualTool interface
- AI extracts:
  - Export names (handles multiple exports per package)
  - Parameters from code examples
  - Environment variables
  - Categories and tags
  - Use cases and limitations

**Step 4: Append to File**
- Generates properly formatted TypeScript code
- Inserts before closing `];` of manualTools array
- Preserves existing formatting

### 2. GitHub Action: `.github/workflows/sync-vercel-registry.yml`

**Triggers:**
- **Schedule:** Every hour (`0 * * * *`)
- **Manual:** Via workflow_dispatch
- **Auto:** On push to main that modifies `sync-vercel-registry.ts`

**Steps:**
1. Checkout repository with `GITHUB_TOKEN` for commits
2. Setup Node.js 22 and pnpm 10.14.0
3. Install dependencies
4. Run sync script with `OPENAI_API_KEY`
5. Capture output and extract statistics
6. If changes detected:
   - Commit with detailed message
   - Push to main
7. Send Discord notification with results

## Configuration

### Required GitHub Secrets

| Secret | Description | Where to Get |
|--------|-------------|--------------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 | https://platform.openai.com/api-keys |
| `GITHUB_TOKEN` | Auto-provided by GitHub | (automatic) |
| `DISCORD_WEBHOOK` | Discord webhook URL | Discord Server Settings → Integrations → Webhooks |

### Environment Variables

The script uses:
- `OPENAI_API_KEY` - Required for AI conversion
- `GITHUB_TOKEN` - Required for committing changes

## Monitoring

### GitHub Actions

View workflow runs:
```bash
gh run list --workflow=sync-vercel-registry.yml
gh run view <run-id> --log
```

### Discord Notifications

Each run sends a Discord embed with:
- ✅/⚠️/❌ Status indicator
- Total tools in registry
- Number processed (new)
- Number skipped (existing)
- Number of errors
- Whether changes were committed
- Link to GitHub Actions run
- Link to commit (if changes made)

### Logs

The workflow includes extensive logging:
- Timestamps and API key masking
- Tool-by-tool processing
- OpenAI conversion details
- Git diff preview
- Statistics summary

## Manual Testing

Test the script locally:

```bash
# Set your OpenAI API key
export OPENAI_API_KEY="sk-..."

# Run the sync script
pnpm tsx sync-vercel-registry.ts
```

This will:
- Fetch the Vercel registry
- Find new tools
- Convert with AI
- Show what would be added (but won't commit)

## Workflow Output Example

```
════════════════════════════════════════
🚀 Starting Vercel AI Registry Sync
════════════════════════════════════════

📅 Time: 2025-12-04 15:00:00 UTC
🔑 OpenAI API Key: sk-proj-...

📥 Fetching Vercel AI registry...
   URL: https://raw.githubusercontent.com/vercel/ai/refs/heads/main/content/tools-registry/registry.ts

✅ Fetched registry (15234 bytes)

🔍 Parsing TypeScript registry...
   Found tools array (12456 chars)

🔧 Converting to JSON...
✅ Parsed 12 tools from registry

🔍 Checking for new tools...
   Existing manual tools: 25
   Vercel registry tools: 12

✨ Found 2 new tools:

   1. Example Tool (@example/sdk)
   2. Another Tool (@another/tool)

🤖 Converting new tools with OpenAI...

🤖 Using OpenAI to convert: Example Tool
   Package: @example/sdk
   ✅ Received OpenAI response (1234 chars)
   ✨ Converted to 2 ManualTool(s):
      1. searchTool - Search the web for current information...
      2. extractTool - Extract structured content from web pages...

📊 Conversion Summary:
   New Vercel tools: 2
   Converted ManualTools: 3
   Errors: 0

📝 Adding 3 new tools to manual-tools.ts...

✅ Successfully updated manual-tools.ts

════════════════════════════════════════
✅ Vercel AI Registry Sync Complete!

📊 Final Results:
   Processed: 3
   Skipped: 10
   Errors: 0
   Total: 12
```

## Commit Message Format

When changes are committed, the message includes:

```
chore: sync 3 new tools from Vercel AI registry

Added 3 tools from Vercel AI SDK registry:
- Total tools in registry: 12
- Already synced: 10
- Newly added: 3
- Errors: 0

🤖 Automated by GitHub Actions
Run: https://github.com/org/repo/actions/runs/123456789
```

## Troubleshooting

### "Failed to parse JSON"

The TypeScript-to-JSON conversion may fail if Vercel changes their registry format.

**Fix:** Update the regex patterns in `fetchVercelRegistry()` function.

### "Empty response from OpenAI"

API key issue or rate limiting.

**Fix:**
- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI account balance
- Check rate limits at https://platform.openai.com/usage

### "Could not find closing bracket"

The `manual-tools.ts` file structure changed.

**Fix:** Ensure the file ends with `];` on its own line.

### "Commit failed"

Git permissions issue.

**Fix:** Verify GitHub Actions has write permissions in repository settings:
- Settings → Actions → General → Workflow permissions
- Enable "Read and write permissions"

## Maintenance

### Updating the Conversion Prompt

The AI prompt is in `convertToolWithAI()` function. Key sections:

1. **Interface Definition** - Keep in sync with `ManualTool` interface
2. **Examples** - Show the AI how to handle multi-export packages
3. **Instructions** - Be explicit about response format

### Changing Sync Frequency

Edit `.github/workflows/sync-vercel-registry.yml`:

```yaml
schedule:
  - cron: '0 */6 * * *'  # Every 6 hours instead of hourly
```

### Adding More Registries

To sync from additional registries:

1. Create new script: `sync-other-registry.ts`
2. Copy workflow: `sync-other-registry.yml`
3. Update fetch URL and parsing logic
4. Add to documentation

## Statistics

As of December 2025:
- Vercel registry: 12 tools
- TPMJS manual tools: 25+ tools
- Sync frequency: Every hour
- Average execution time: ~30 seconds
- OpenAI cost per run: ~$0.01

## Related Documentation

- [Manual Tools](../manual-tools.ts) - The target file
- [Manual Sync](../sync-manual-tools.ts) - Syncs manual tools to database
- [GitHub Actions Overview](../CLAUDE.md#github-actions) - All workflows
