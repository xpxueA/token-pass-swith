# Contributing

Token Pass Swith accepts issues and pull requests in the public repository:
https://github.com/xpxueA/token-pass-swith

Token Pass Swith is an independent MIT-licensed derivative of CC Switch. Keep
the upstream attribution in `LICENSE` and `NOTICE.md`, and do not imply that
changes are authored, approved, or released by the CC Switch maintainers.

## Before Opening a Pull Request

```bash
pnpm install --frozen-lockfile
pnpm check:public-compliance
pnpm check:release-trust
pnpm icons:check
pnpm licenses:check:npm
pnpm typecheck
pnpm format:check
pnpm test:unit
```

Run Rust formatting, Clippy, tests, and `cargo deny` when Rust dependencies or
backend code change. Do not include API keys, relay credentials, signing keys,
customer data, internal endpoints, or unlicensed artwork in commits, issues,
logs, screenshots, or release notes.
