# Manual Release Publication

Use this procedure only after the protected Release workflow creates both a
GitHub Draft Release and `manual-publication-<tag>` artifact.

## 1. Verify Preconditions

- Confirm tokenpass.cloud resolves through two public DNS resolvers.
- Confirm HTTPS validation succeeds without warnings.
- Confirm `/downloads/token-pass-swith/` serves static files.
- Verify `MANUAL-PUBLISH-SHA256SUMS.txt` against the downloaded bundle.
- Confirm the MSI Authenticode signer, trusted timestamp, and Tauri signature.

Stop if any check fails.

## 2. Upload Immutable Assets

Upload `public/releases/<tag>/` to the matching path under:

`https://tokenpass.cloud/downloads/token-pass-swith/releases/<tag>/`

Do not overwrite an existing tag unless every byte is identical. Verify each
uploaded file against the bundle checksums. The directory must contain the
installable `.msi`, updater `.msi.zip`, updater `.msi.zip.sig`, and notice files.

## 3. Publish the Manifest Last

Upload `public/latest.json` under a temporary name, verify its contents, and
atomically rename it to `latest.json`. This prevents clients from observing a
manifest that references incomplete assets.

## 4. Smoke Test and Publish the Mirror

- Verify `latest.json` is JSON and every referenced URL returns the expected bytes.
- Recheck Authenticode after downloading the public MSI.
- Confirm the updater can read the manifest without installing an older version.
- Publish the GitHub Draft Release only after the cloud checks pass.
