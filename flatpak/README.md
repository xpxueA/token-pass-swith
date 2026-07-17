# Flatpak Build Guide

This directory contains the Flatpak manifest for Token Pass Swith.

## Dependencies

- `flatpak`
- `flatpak-builder`
- Flathub remote for `org.gnome.Platform//46`

For Ubuntu/Debian:

```bash
sudo apt install flatpak flatpak-builder
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
flatpak install -y --user flathub org.gnome.Platform//46 org.gnome.Sdk//46
```

## Local Build

Build the deb on Linux first:

```bash
pnpm tauri build -- --bundles deb
```

Copy the generated deb to this directory:

```bash
cp "$(find src-tauri/target/release/bundle -name '*.deb' | head -n 1)" flatpak/token-pass-swith.deb
```

Build and export the Flatpak bundle:

```bash
flatpak-builder --force-clean --user --disable-cache --repo flatpak-repo flatpak-build flatpak/com.tokenpass.swith.desktop.yml
flatpak build-bundle --runtime-repo=https://flathub.org/repo/flathub.flatpakrepo flatpak-repo Token-Pass-Swith-Linux.flatpak com.tokenpass.swith.desktop
```

Install and run:

```bash
flatpak install --user ./Token-Pass-Swith-Linux.flatpak
flatpak run com.tokenpass.swith.desktop
```

## Permissions Note

The manifest uses `--filesystem=home` so the app can read and write local AI
client configuration files and support custom directory overrides.
