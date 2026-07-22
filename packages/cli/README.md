# @tpmjs/cli

Command-line interface for [TPMJS](https://tpmjs.com) — the universal tool registry for AI agents.

## Installation

```bash
npm install -g @tpmjs/cli
```

## Quick Start

```bash
# Authenticate
tpm auth login

# Search for tools
tpm tool search firecrawl

# Show trending tools
tpm tool trending

# Get tool info
tpm tool info @tpmjs/official-firecrawl scrapeTool

# Execute a tool
tpm tool execute '@tpmjs/official-firecrawl::scrapeTool' --input '{"url":"https://example.com"}'

# Generate MCP config for your AI client
tpm mcp config ajax/my-collection
```

## Commands

### Authentication

```bash
tpm auth login           # Login with API key or browser OAuth
tpm auth logout          # Log out
tpm auth status          # Show authentication status
tpm auth whoami          # Show current user info
```

Login supports two methods:

```bash
tpm auth login                          # Interactive browser OAuth
tpm auth login --api-key YOUR_API_KEY   # Direct API key
```

### Tools

#### Search & Discovery

```bash
tpm tool search [query]           # Search for tools in the registry
tpm tool search firecrawl         # Search by name
tpm tool trending                 # Show trending tools
tpm tool trending --limit 20      # Show more results
tpm tool info <package> <tool>    # Get detailed tool information
```

#### Execute

Run a tool directly from the registry:

```bash
tpm tool execute '@scope/package::toolName' --input '{"key":"value"}' # Execute with JSON input
tpm tool execute '@scope/package::toolName' --input-file params.json  # Read input from a file
tpm tool execute '@scope/package::toolName' --stream                 # Stream-compatible output
tpm tool execute '@scope/package::toolName' --timeout 60             # Custom timeout (default: 300s)
```

Input can also be piped via stdin.

#### Create & Validate

```bash
tpm tool init                          # Initialize a new tool package (interactive)
tpm tool init my-tool                  # Initialize with a name
tpm tool init --template rich          # Use the rich template (default: minimal)
tpm tool init --category research      # Set category
tpm tool validate                      # Validate local tpmjs config in package.json
```

Available categories: `research`, `web`, `data`, `documentation`, `engineering`, `security`, `statistics`, `ops`, `agent`, `sandbox`, `utilities`, `html`, `compliance`.

### Agents

```bash
tpm agent list              # List your agents
tpm agent create            # Create a new agent
tpm agent update <id>       # Update an agent
tpm agent delete <id>       # Delete an agent
tpm agent chat <id>         # Interactive chat with an agent
tpm agent chat <id> "msg"   # Send a single message
```

### Collections

#### Manage Collections

```bash
tpm collection list                    # List your collections
tpm collection create                  # Create a new collection
tpm collection info <user/slug>        # Show collection details and tools
tpm collection update <id>             # Update collection metadata
tpm collection delete <id>             # Delete a collection
```

Update supports `--name`, `--description`, and `--public`/`--no-public` flags:

```bash
tpm collection update my-col --name "New Name" --description "Updated desc"
tpm collection update my-col --public        # Make public
tpm collection update my-col --no-public     # Make private
```

#### Manage Tools in Collections

```bash
tpm collection add <collection> [tools]              # Add tools by ID
tpm collection add <collection> --package @org/pkg   # Add tools from an npm package
tpm collection add <collection> --search "firecrawl" # Search and add matching tools
tpm collection add <collection> --search "scraper" --category web --limit 3
tpm collection remove <collection> <tool-id>         # Remove a tool
tpm collection import <collection> --file tools.txt  # Import from file (IDs, one per line or JSON array)
```

### Scenarios

Test your collections with AI-powered scenarios.

```bash
tpm scenario list [collection]                # List scenarios (all public, or for a collection)
tpm scenario info <scenario-id>               # Show scenario details and recent runs
tpm scenario generate <collection>            # Generate AI-powered test scenarios
tpm scenario generate <collection> --count 5  # Generate multiple (1-10)
tpm scenario run <collection>                 # Run all scenarios for a collection
tpm scenario test <scenario-id>               # Run a single scenario
```

### Run

Execute a tool from a collection via MCP:

```bash
# Basic usage
tpm run -c ajax/unsandbox -t execute --args '{"code":"print(1)","language":"python"}'

# With environment variables
tpm run -c ajax/my-collection -t myTool --env API_KEY=xxx --env DEBUG=true

# Using process environment
OPENAI_API_KEY=xxx tpm run -c ajax/ai-tools -t generate

# JSON output for scripting
tpm run -c ajax/tools -t base64Encode --args '{"data":"hello"}' --json | jq .result
```

### MCP Integration

Generate config for AI clients or run as a local MCP server:

```bash
tpm mcp config <user/collection>                 # Generate MCP config (auto-detects client)
tpm mcp config ajax/my-col --client claude        # For Claude Desktop
tpm mcp config ajax/my-col --client cursor        # For Cursor
tpm mcp config ajax/my-col --client windsurf      # For Windsurf

tpm mcp serve                                     # Run as local MCP server (HTTP, port 3333)
tpm mcp serve --stdio                             # Run in stdio mode
```

### Publishing

```bash
tpm publish check [package]      # Check if package is discovered on tpmjs.com
tpm publish check                # Check current directory's package
tpm publish preview              # Preview how your tool will appear on tpmjs.com
tpm publish preview --path ./dir # Preview a specific directory
```

### Utilities

```bash
tpm doctor             # Run diagnostic checks (Node.js, config, auth, API, disk)
tpm doctor --verbose   # Detailed diagnostics
tpm update             # Update CLI to latest version
tpm playground         # Interactive tool testing REPL
tpm playground --web   # Open web playground
tpm playground --tool firecrawl-scrape   # Start with a specific tool
```

## Global Flags

All commands support these flags:

| Flag | Description |
|------|-------------|
| `--json` | Output in JSON format (for scripting) |
| `--verbose, -v` | Show detailed/debug output |
| `--help` | Show command help |
| `--version` | Show CLI version |

```bash
tpm tool search firecrawl --json | jq '.data[0].name'
tpm doctor --verbose
```

## Configuration

Config is stored in `~/.tpmjs/config.json`:

```json
{
  "apiUrl": "https://tpmjs.com/api",
  "defaultOutput": "human",
  "verbose": false,
  "analytics": false
}
```

Credentials are stored securely in `~/.tpmjs/credentials.json` (mode `0600`).

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TPMJS_API_KEY` | API key for authentication |
| `TPMJS_API_URL` | Custom API URL (default: `https://tpmjs.com/api`) |

## Programmatic Usage

The CLI exports a client library for use in Node.js:

```typescript
import { TpmClient } from '@tpmjs/cli'

const client = new TpmClient({ apiKey: 'your-key' })
const tools = await client.searchTools('firecrawl')
```

## License

MIT
