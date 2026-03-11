# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |

We only support the latest released version. Please update before reporting issues.

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Email security concerns to **security@tpmjs.com** with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We aim to acknowledge reports within 48 hours and provide a fix or mitigation plan within 7 days for critical issues.

## Scope

The following are in scope:

- **tpmjs.com** web application
- **API endpoints** at `tpmjs.com/api/*`
- **MCP endpoints** at `tpmjs.com/api/mcp/*`
- **Published npm packages** under the `@tpmjs` scope
- **Tool execution sandbox** and isolation boundaries
- **Authentication and authorization** flows

## Out of Scope

- Third-party npm packages indexed by the registry (report to the package maintainer)
- Social engineering attacks
- Denial of service via high request volume (we have rate limiting)

## Security Measures

- All traffic over HTTPS with HSTS preload
- Content Security Policy headers on all responses
- Tool execution in isolated Deno sandboxes with timeouts and rate limits
- Credentials encrypted at rest
- No secrets in client-side bundles
- Pre-commit hooks enforce linting and type-checking
- Dependency updates monitored via automated tooling

## Acknowledgments

We appreciate responsible disclosure. Reporters of valid vulnerabilities will be credited in our changelog (with permission).
