# Legacy Compatibility Identifiers

Token Pass Swith keeps a small set of machine-readable identifiers so existing
installations, backups, settings, and integrations continue to work. They are
not product branding and must not be shown as the current application name.

Migration regression fixtures retain the historical display value
`Legacy CC Switch` so upgrades from existing databases remain covered. This
string is not used as current product branding.

The approved compatibility identifiers are:

- Rust crate and symbol names using `cc_switch` or `CcSwitch`.
- Legacy environment variables beginning with `CC_SWITCH_`.
- Existing storage keys, database names, backup markers, migration IDs, and
  generated filenames containing `cc-switch`, `cc_switch`, or `ccswitch`.
- The historical deep-link scheme `ccswitch://` only inside migration or
  compatibility parsing code. New links use `tokenpassswith://`.
- Existing error-code values beginning with `cc_switch_`, which remain stable
  for API consumers.

New user-visible text, logs, paths, protocols, and public interfaces must use
Token Pass Swith naming. Adding a new legacy identifier requires documenting
its compatibility purpose here and extending the public compliance check.
