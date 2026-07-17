import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const errors = [];
const expectedPublicKey =
  "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDlDQkE0OTNDQzlERkE3NwpSV1IzK3AzTWs2VExDUjQ2YlM0NHhUU0RXVjJFTnE1WkJzSkxsU0Uvak9veHNFZTgwdmYrY0VRVwo=";
const expectedEndpoint =
  "https://tokenpass.cloud/downloads/token-pass-swith/latest.json";
const deprecatedDomain = ["tokenpass", "ru"].join(".");

const tauriConfig = JSON.parse(
  readFileSync(path.join(root, "src-tauri", "tauri.conf.json"), "utf8"),
);
const updater = tauriConfig?.plugins?.updater;
if (updater?.pubkey !== expectedPublicKey) {
  errors.push(
    "tauri.conf.json must use the Token Pass Swith updater public key",
  );
}
if (
  !Array.isArray(updater?.endpoints) ||
  updater.endpoints.length !== 1 ||
  updater.endpoints[0] !== expectedEndpoint
) {
  errors.push(`updater endpoint must be exactly ${expectedEndpoint}`);
}

const updateCommands = readFileSync(
  path.join(root, "src-tauri", "src", "commands", "misc.rs"),
  "utf8",
);
if (
  !updateCommands.includes(
    "https://tokenpass.cloud/downloads/token-pass-swith/",
  )
) {
  errors.push(
    "manual update fallback must use the Token Pass download channel",
  );
}

const releaseWorkflow = readFileSync(
  path.join(root, ".github", "workflows", "release.yml"),
  "utf8",
);
const requiredWorkflowFragments = [
  ["protected release environment", "environment: release"],
  ["Windows x64 runner", "runs-on: windows-2022"],
  ["repository Node.js pin", 'node-version-file: ".node-version"'],
  ["Rust 1.95.0 pin", "toolchain: 1.95.0"],
  ["main ancestry gate", "git merge-base --is-ancestor"],
  ["first public binary version gate", "v3.16.6 or newer"],
  ["Tauri private key", "TAURI_SIGNING_PRIVATE_KEY"],
  [
    "Rust dependency notice normalization",
    "node scripts/normalize-rust-notices.mjs",
  ],
  [
    "cargo-about CLI feature",
    "cargo install cargo-about --locked --version 0.9.1 --features cli",
  ],
  ["Windows certificate", "WINDOWS_CERTIFICATE"],
  ["certificate import", "Import-PfxCertificate"],
  ["code-signing EKU check", "1.3.6.1.5.5.7.3.3"],
  ["Authenticode validation", "Get-AuthenticodeSignature"],
  ["trusted timestamp validation", "TimeStamperCertificate"],
  ["MSI manufacturer validation", "Unexpected MSI Manufacturer"],
  ["bundled notice validation", "MSI does not contain required notice"],
  [
    "Tauri updater signature validation",
    "Tauri updater signature was not produced",
  ],
  ["Windows updater archive selection", "-Filter *.msi.zip"],
  [
    "Windows updater archive URL",
    "$env:RELEASE_PUBLIC_BASE_URL/releases/$tag/$updaterName",
  ],
  ["cloud release asset base", "$env:RELEASE_PUBLIC_BASE_URL/releases/$tag"],
  ["manual publication bundle", "manual-publication"],
  ["manifest-last checklist", "Upload public/latest.json last"],
  ["draft GitHub release", "gh release create $env:GITHUB_REF_NAME --draft"],
];
for (const [label, fragment] of requiredWorkflowFragments) {
  if (!releaseWorkflow.includes(fragment)) {
    errors.push(`release workflow is missing ${label}`);
  }
}

const rustToolchain = readFileSync(
  path.join(root, "rust-toolchain.toml"),
  "utf8",
);
if (!/^channel = "1\.95\.0"$/mu.test(rustToolchain)) {
  errors.push("rust-toolchain.toml must pin Rust 1.95.0 exactly");
}

for (const workflowPath of [
  ".github/workflows/ci.yml",
  ".github/workflows/deeplink-acceptance.yml",
  ".github/workflows/release.yml",
]) {
  const workflow = readFileSync(path.join(root, workflowPath), "utf8");
  if (!workflow.includes("toolchain: 1.95.0")) {
    errors.push(`${workflowPath} must install Rust 1.95.0`);
  }
  if (!workflow.includes('node-version-file: ".node-version"')) {
    errors.push(`${workflowPath} must use the repository Node.js version`);
  }
}

const deepLinkWorkflow = readFileSync(
  path.join(root, ".github", "workflows", "deeplink-acceptance.yml"),
  "utf8",
);
for (const [label, fragment] of [
  ["temporary Tauri acceptance config", "tauri-acceptance.json"],
  ["structured Tauri config serialization", "ConvertTo-Json -Depth 4"],
  ["Tauri config file argument", "--config $configOverridePath"],
]) {
  if (!deepLinkWorkflow.includes(fragment)) {
    errors.push(`deep-link acceptance workflow is missing ${label}`);
  }
}

for (const [label, fragment] of [
  ["SSH deployment credentials", "RELEASE_SSH_"],
  ["automatic SSH publication", "StrictHostKeyChecking"],
  ["macOS release job", "macos-"],
  ["Linux release job", "ubuntu-"],
  ["automatic release publication", "--draft=false"],
]) {
  if (releaseWorkflow.includes(fragment)) {
    errors.push(`release workflow must not contain ${label}`);
  }
}

for (const match of releaseWorkflow.matchAll(
  /^\s*uses:\s*[^\s]+@([^\s#]+).*$/gmu,
)) {
  if (!/^[0-9a-f]{40}$/u.test(match[1])) {
    errors.push(
      `GitHub Action is not pinned to a full commit: ${match[0].trim()}`,
    );
  }
}

const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);
const forbiddenExtensions = new Set([".key", ".p12", ".pfx", ".pem"]);
const forbiddenMarkers = [
  ["untrusted comment: minisign encrypted ", "secret key"].join(""),
  ["-----BEGIN ", "PRIVATE KEY-----"].join(""),
];

for (const relativePath of trackedFiles) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) continue;
  if (forbiddenExtensions.has(path.extname(relativePath).toLowerCase())) {
    errors.push(
      `private signing material must not be tracked: ${relativePath}`,
    );
    continue;
  }
  if (statSync(absolutePath).size > 1024 * 1024) continue;
  const contents = readFileSync(absolutePath, "utf8");
  if (contents.toLowerCase().includes(deprecatedDomain)) {
    errors.push(`deprecated Token Pass domain detected in: ${relativePath}`);
  }
  if (forbiddenMarkers.some((marker) => contents.includes(marker))) {
    errors.push(
      `private-key material detected in tracked file: ${relativePath}`,
    );
  }
}

if (errors.length > 0) {
  console.error("Release trust-chain check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Release trust-chain configuration passed.");
