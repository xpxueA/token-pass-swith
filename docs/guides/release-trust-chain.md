# Release Trust Chain

Token Pass Swith publishes source in the public GitHub repository. Windows x64
is currently the only binary release target. The primary updater channel is:

`https://tokenpass.cloud/downloads/token-pass-swith/latest.json`

GitHub Releases mirrors the signed assets but is not the updater endpoint.

## Protected Release Environment

The `release` environment must require maintainer approval and restrict
deployment to protected `v*` tags. Configure these environment secrets:

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- `WINDOWS_CERTIFICATE`
- `WINDOWS_CERTIFICATE_PASSWORD`
- `TOKEN_PASS_GEMINI_OAUTH_CLIENT_ID`
- `TOKEN_PASS_GEMINI_OAUTH_CLIENT_SECRET`

The Gemini OAuth client values are injected only while compiling a protected
release. Public source and normal CI builds contain no client credentials; in
those builds, automatic refresh of an expired Gemini CLI token is unavailable.

Configure these environment variables:

- `RELEASE_PUBLIC_BASE_URL=https://tokenpass.cloud/downloads/token-pass-swith`
- `WINDOWS_TIMESTAMP_URL` from the Windows certificate issuer

The Windows certificate must be a trusted code-signing certificate with the
code-signing EKU. Self-signed certificates are not public release credentials.

## Release Gate

The workflow accepts a semantic `v*` tag only when it points to `main`, matches
all project version files, and is `v3.16.6` or newer. It audits source,
dependencies, provider artwork, and secrets before building. The MSI and app
executable must have a valid Authenticode signature and trusted timestamp; the
MSI must also have a valid Tauri updater signature and contain all license
notices.

The workflow creates a GitHub Draft Release and a manual cloud publication
bundle. It does not publish the draft, connect to the server, or update
`latest.json` remotely. Follow the manual publication checklist and publish the
manifest last.

## Temporary Rust Advisory Exceptions

`cargo-deny` rejects every newly reported advisory. The exceptions in
`deny.toml` cover only unmaintained transitive crates for which the current
Tauri 2 dependency graph has no compatible replacement:

- `RUSTSEC-2024-0411` through `RUSTSEC-2024-0420` and
  `RUSTSEC-2024-0370`: Tauri's Linux GTK3 stack.
- `RUSTSEC-2025-0057`: `tauri-utils -> kuchikiki -> selectors -> fxhash`.
- `RUSTSEC-2025-0075`, `RUSTSEC-2025-0080`, `RUSTSEC-2025-0081`,
  `RUSTSEC-2025-0098`, and `RUSTSEC-2025-0100`:
  `tauri-utils -> urlpattern -> unic-*`.

These exceptions do not cover vulnerabilities or unsoundness. Review and
remove them whenever Tauri is upgraded, and at least before each binary
release. Last reviewed: 2026-07-17.
