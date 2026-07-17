# User Manual

Token Pass Swith manages local provider profiles for AI assistant clients and
syncs the selected profile into each client's live configuration.

## Basic Flow

1. Add or import a provider profile.
2. Confirm the endpoint, API key location, and model mapping.
3. Switch the target client to the selected provider.
4. Use the client normally.
5. Rotate credentials outside the app when needed, then update the profile.

## Supported Clients

- Claude Code
- Claude Desktop
- Codex
- Gemini CLI
- OpenCode
- OpenClaw
- Hermes

## Safety Notes

- Keep API keys and relay credentials out of screenshots and logs.
- Prefer user-managed endpoints and authorized Token Pass presets.
- Before reporting an issue, redact tokens, request headers, endpoint secrets,
  and customer data.
