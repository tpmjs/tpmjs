# @tpmjs/cli

Command-line interface for TPMJS - the universal tool registry for AI agents.

## Installation

```bash
npm install -g @tpmjs/cli
```

## Quick Start

```bash
# Search for tools
tpm tool search firecrawl

# Get tool info
tpm tool info @tpmjs/official-firecrawl scrapeTool

# Show trending tools
tpm tool trending

# Authenticate
tpm auth login --api-key YOUR_API_KEY

# List your agents
tpm agent list

# List your collections
tpm collection list

# Generate MCP config
tpm mcp config ajax/ajax-collection
```

## Commands

### Authentication

```bash
tpm auth login           # Login with API key or browser OAuth
tpm auth logout          # Log out
tpm auth status          # Show authentication status
tpm auth whoami          # Show current user info
```

### Tools

```bash
tpm tool search [query]  # Search for tools
tpm tool info <pkg> <tool>  # Get tool details
tpm tool trending        # Show trending tools
tpm tool validate        # Validate local tpmjs config
```

### Agents

```bash
tpm agent list           # List your agents
tpm agent create         # Create a new agent
tpm agent update <id>    # Update an agent
tpm agent delete <id>    # Delete an agent
tpm agent chat <id>      # Chat with an agent
```

### Collections

```bash
tpm collection list      # List your collections
tpm collection create    # Create a collection
tpm collection add       # Add tools to a collection
tpm collection remove    # Remove tools from a collection
```

### MCP Integration

```bash
tpm mcp config <user/collection>  # Generate MCP config
tpm mcp serve                      # Run as local MCP server
```

### Utilities

```bash
tpm doctor               # Run diagnostic checks
tpm update               # Update CLI to latest version
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

Credentials are stored securely in `~/.tpmjs/credentials.json`.

## Environment Variables

- `TPMJS_API_KEY` - API key for authentication
- `TPMJS_API_URL` - Custom API URL (default: https://tpmjs.com/api)

## Output Formats

All commands support `--json` flag for machine-readable output:

```bash
tpm tool search firecrawl --json | jq '.data[0].name'
```

## Verbose Mode

Use `--verbose` or `-v` for detailed output:

```bash
tpm doctor --verbose
```

## License

MIT
