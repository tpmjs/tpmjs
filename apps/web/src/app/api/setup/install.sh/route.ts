export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/setup/install.sh
 *
 * Serves the TPMJS install script. This is the entry point for:
 *   curl -fsSL https://tpmjs.com/install.sh | bash -s -- --token=<token>
 */
export async function GET() {
  const script = `#!/bin/bash
set -euo pipefail

# ---------------------------------------------------------------------------
# TPMJS Setup Script
# Configures MCP servers for your editors based on your tpmjs.com selections.
# ---------------------------------------------------------------------------

# Colors (disabled if not a terminal)
if [ -t 1 ] && [ -t 2 ]; then
  RED='\\033[0;31m'
  GREEN='\\033[0;32m'
  YELLOW='\\033[1;33m'
  BLUE='\\033[0;34m'
  CYAN='\\033[0;36m'
  BOLD='\\033[1m'
  NC='\\033[0m'
else
  RED='' GREEN='' YELLOW='' BLUE='' CYAN='' BOLD='' NC=''
fi

info()    { echo -e "\${BLUE}[info]\${NC}  $1"; }
success() { echo -e "\${GREEN}[ok]\${NC}    $1"; }
warn()    { echo -e "\${YELLOW}[warn]\${NC}  $1"; }
error()   { echo -e "\${RED}[error]\${NC} $1"; }

# Banner
echo ""
echo -e "\${BOLD}\${CYAN}"
echo "  _____ ____  __  __     _ ____  "
echo " |_   _|  _ \\|  \\/  |   | / ___| "
echo "   | | | |_) | |\\/| |_  | \\___ \\ "
echo "   | | |  __/| |  | | |_| |___) |"
echo "   |_| |_|   |_|  |_|\\___/|____/ "
echo ""
echo -e "  MCP Server Setup\${NC}"
echo ""

# ---- Pre-flight checks ---------------------------------------------------

# Check for curl
if ! command -v curl &>/dev/null; then
  error "curl is required but not installed."
  exit 1
fi

# Check for node (needed for JSON config merging)
if ! command -v node &>/dev/null; then
  error "Node.js is required but not installed."
  echo "  Install it from https://nodejs.org or via your package manager."
  exit 1
fi

# ---- Parse arguments ------------------------------------------------------

TOKEN=""
for arg in "$@"; do
  case "$arg" in
    --token=*)
      TOKEN="\${arg#--token=}"
      ;;
  esac
done

if [ -z "$TOKEN" ]; then
  echo ""
  warn "No setup token provided."
  echo ""
  echo "  To get started:"
  echo "    1. Visit \${BOLD}https://tpmjs.com/setup\${NC}"
  echo "    2. Select your collections and editors"
  echo "    3. Copy the install command with your token"
  echo ""
  echo "  Usage:"
  echo "    curl -fsSL https://tpmjs.com/install.sh | bash -s -- --token=YOUR_TOKEN"
  echo ""
  exit 1
fi

# ---- Redeem the token -----------------------------------------------------

info "Redeeming setup token..."

RESPONSE=$(curl -fsSL "https://tpmjs.com/api/setup/redeem/$TOKEN" 2>&1) || {
  error "Failed to redeem token. It may be expired or already used."
  echo "  Visit \${BOLD}https://tpmjs.com/setup\${NC} to generate a new one."
  exit 1
}

# Parse JSON using node
PARSED=$(node -e "
  try {
    const data = JSON.parse(process.argv[1]);
    if (!data.success) {
      console.error('Error: ' + (data.error || 'Unknown error'));
      process.exit(1);
    }
    // Output as tab-separated values for bash consumption
    console.log(JSON.stringify(data));
  } catch (e) {
    console.error('Failed to parse response: ' + e.message);
    process.exit(1);
  }
" "$RESPONSE") || {
  error "Failed to parse server response."
  exit 1
}

# Extract fields
USERNAME=$(node -e "console.log(JSON.parse(process.argv[1]).username)" "$PARSED")
API_KEY=$(node -e "const d=JSON.parse(process.argv[1]); console.log(d.apiKey||'')" "$PARSED")
MAPPING_COUNT=$(node -e "console.log(JSON.parse(process.argv[1]).mappings.length)" "$PARSED")

success "Authenticated as \${BOLD}$USERNAME\${NC}"

if [ -n "$API_KEY" ]; then
  info "API key created: \${API_KEY:0:20}..."
fi

echo ""

# ---- Configure editors ----------------------------------------------------

CONFIGURED=0
FAILED=0

for i in $(seq 0 $((MAPPING_COUNT - 1))); do
  SLUG=$(node -e "console.log(JSON.parse(process.argv[1]).mappings[$i].collectionSlug)" "$PARSED")
  NAME=$(node -e "console.log(JSON.parse(process.argv[1]).mappings[$i].collectionName)" "$PARSED")
  EDITOR=$(node -e "console.log(JSON.parse(process.argv[1]).mappings[$i].editor)" "$PARSED")
  MCP_URL=$(node -e "console.log(JSON.parse(process.argv[1]).mappings[$i].mcpUrl)" "$PARSED")
  SERVER_NAME="tpmjs-$SLUG"

  info "Configuring \${BOLD}$NAME\${NC} for \${BOLD}$EDITOR\${NC}..."

  case "$EDITOR" in
    claude-code)
      # Use the claude CLI to add the MCP server
      if ! command -v claude &>/dev/null; then
        warn "claude CLI not found. Skipping $NAME for Claude Code."
        warn "  Install it: npm install -g @anthropic-ai/claude-code"
        FAILED=$((FAILED + 1))
        continue
      fi

      MCP_JSON=$(node -e "
        const config = {
          type: 'http',
          url: process.argv[1]
        };
        if (process.argv[2]) {
          config.headers = { Authorization: 'Bearer ' + process.argv[2] };
        }
        console.log(JSON.stringify(config));
      " "$MCP_URL" "$API_KEY")

      if claude mcp add-json "$SERVER_NAME" "$MCP_JSON" 2>/dev/null; then
        success "$NAME configured for Claude Code"
        CONFIGURED=$((CONFIGURED + 1))
      else
        warn "Failed to configure $NAME for Claude Code"
        FAILED=$((FAILED + 1))
      fi
      ;;

    cursor)
      CONFIG_PATH="$HOME/.cursor/mcp.json"
      node -e "
        const fs = require('fs');
        const path = require('path');
        const configPath = process.argv[1];
        const serverName = process.argv[2];
        const mcpUrl = process.argv[3];
        const apiKey = process.argv[4];
        let config = {};
        try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch {}
        if (!config.mcpServers) config.mcpServers = {};
        const server = { type: 'http', url: mcpUrl };
        if (apiKey) server.headers = { Authorization: 'Bearer ' + apiKey };
        config.mcpServers[serverName] = server;
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      " "$CONFIG_PATH" "$SERVER_NAME" "$MCP_URL" "$API_KEY" && {
        success "$NAME configured for Cursor (\${CONFIG_PATH})"
        CONFIGURED=$((CONFIGURED + 1))
      } || {
        warn "Failed to configure $NAME for Cursor"
        FAILED=$((FAILED + 1))
      }
      ;;

    windsurf)
      CONFIG_PATH="$HOME/.codeium/windsurf/mcp_config.json"
      node -e "
        const fs = require('fs');
        const path = require('path');
        const configPath = process.argv[1];
        const serverName = process.argv[2];
        const mcpUrl = process.argv[3];
        const apiKey = process.argv[4];
        let config = {};
        try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch {}
        if (!config.mcpServers) config.mcpServers = {};
        const server = { type: 'http', url: mcpUrl };
        if (apiKey) server.headers = { Authorization: 'Bearer ' + apiKey };
        config.mcpServers[serverName] = server;
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      " "$CONFIG_PATH" "$SERVER_NAME" "$MCP_URL" "$API_KEY" && {
        success "$NAME configured for Windsurf (\${CONFIG_PATH})"
        CONFIGURED=$((CONFIGURED + 1))
      } || {
        warn "Failed to configure $NAME for Windsurf"
        FAILED=$((FAILED + 1))
      }
      ;;

    claude-desktop)
      # Detect OS for config path
      if [ "$(uname)" = "Darwin" ]; then
        CONFIG_PATH="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
      elif [ -n "\${APPDATA:-}" ]; then
        CONFIG_PATH="$APPDATA/Claude/claude_desktop_config.json"
      else
        # Linux fallback
        CONFIG_PATH="$HOME/.config/Claude/claude_desktop_config.json"
      fi

      node -e "
        const fs = require('fs');
        const path = require('path');
        const configPath = process.argv[1];
        const serverName = process.argv[2];
        const mcpUrl = process.argv[3];
        const apiKey = process.argv[4];
        let config = {};
        try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch {}
        if (!config.mcpServers) config.mcpServers = {};
        const server = { type: 'http', url: mcpUrl };
        if (apiKey) server.headers = { Authorization: 'Bearer ' + apiKey };
        config.mcpServers[serverName] = server;
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      " "$CONFIG_PATH" "$SERVER_NAME" "$MCP_URL" "$API_KEY" && {
        success "$NAME configured for Claude Desktop (\${CONFIG_PATH})"
        CONFIGURED=$((CONFIGURED + 1))
      } || {
        warn "Failed to configure $NAME for Claude Desktop"
        FAILED=$((FAILED + 1))
      }
      ;;

    *)
      warn "Unknown editor: $EDITOR. Skipping $NAME."
      FAILED=$((FAILED + 1))
      ;;
  esac
done

# ---- Summary --------------------------------------------------------------

echo ""
echo -e "\${BOLD}── Summary ─────────────────────────────────────\${NC}"

if [ "$CONFIGURED" -gt 0 ]; then
  success "\${CONFIGURED} MCP server(s) configured successfully."
fi

if [ "$FAILED" -gt 0 ]; then
  warn "\${FAILED} configuration(s) skipped or failed."
fi

echo ""
echo "  Your MCP tools are ready to use. Restart your editor(s) to load them."
echo "  Manage your collections at \${BOLD}https://tpmjs.com/@$USERNAME\${NC}"
echo ""
`;

  return new Response(script, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
