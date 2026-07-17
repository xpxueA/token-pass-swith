import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.env.PUBLIC_COMPLIANCE_ROOT ?? process.cwd());
const errors = [];

function relative(...segments) {
  return path.join(...segments).replaceAll("\\", "/");
}

function filePath(...segments) {
  return path.join(root, ...segments);
}

function read(...segments) {
  const target = filePath(...segments);
  if (!existsSync(target)) {
    errors.push(`required file is missing: ${relative(...segments)}`);
    return "";
  }
  return readFileSync(target, "utf8");
}

function requireText(contents, expected, label) {
  if (!contents.includes(expected)) errors.push(`missing ${label}`);
}

function sha256(target) {
  return createHash("sha256").update(readFileSync(target)).digest("hex");
}

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const packageJson = JSON.parse(read("package.json") || "{}");
if (packageJson.author !== "Token Pass Swith Contributors") {
  errors.push("package.json author must be Token Pass Swith Contributors");
}
if (
  packageJson.repository?.url !==
  "https://github.com/xpxueA/token-pass-swith.git"
) {
  errors.push("package.json repository must point to the public repository");
}
if (
  packageJson.bugs?.url !== "https://github.com/xpxueA/token-pass-swith/issues"
) {
  errors.push("package.json bugs URL must point to the public issue tracker");
}

const cargoToml = read("src-tauri", "Cargo.toml");
requireText(
  cargoToml,
  'authors = ["Token Pass Swith Contributors"]',
  "Cargo author metadata",
);

const tauriConfigText = read("src-tauri", "tauri.conf.json");
const tauriConfig = tauriConfigText ? JSON.parse(tauriConfigText) : {};
const bundle = tauriConfig.bundle ?? {};
if (bundle.publisher !== "Token Pass Swith") {
  errors.push("Tauri bundle publisher must be Token Pass Swith");
}
if (bundle.licenseFile !== "wix/LICENSE.rtf") {
  errors.push("Tauri bundle must use the reviewed WiX license file");
}
if (Object.keys(bundle.resources ?? {}).length > 0) {
  errors.push(
    "Tauri bundle resources must stay empty because automatic file KeyPaths fail ICE38 in the per-user MSI",
  );
}

const wixTemplate = read("src-tauri", "wix", "per-user-main.wxs");
for (const [componentId, componentGuid, notice] of [
  ["BundledLicense", "CF22FAAF-997B-466C-BC22-FEB34CDAC540", "LICENSE"],
  ["BundledNotice", "CACF9802-5D43-4034-BE09-1E876A31CF26", "NOTICE.md"],
  [
    "BundledThirdPartyNotices",
    "4D6D4177-AF7B-49D1-96B8-7C3FCD8631A0",
    "THIRD_PARTY_NOTICES.md",
  ],
  [
    "BundledNpmLicenses",
    "AC4D9A8A-C585-47C2-AE90-632D0EAFA7AD",
    "THIRD_PARTY_NPM_LICENSES.json",
  ],
  [
    "BundledRustLicenses",
    "5AE087AC-FAA5-4F5D-97D7-7A4E94372D94",
    "THIRD_PARTY_RUST_LICENSES.html",
  ],
]) {
  requireText(
    wixTemplate,
    `<Component Id="${componentId}" Guid="${componentGuid}"`,
    `per-user WiX component for ${notice}`,
  );
  requireText(
    wixTemplate,
    `Source="..\\..\\..\\..\\..\\${notice}"`,
    `per-user WiX source for ${notice}`,
  );
  requireText(
    wixTemplate,
    `<ComponentRef Id="${componentId}"/>`,
    `per-user WiX feature reference for ${notice}`,
  );
}
for (const componentName of [
  "PathComponent",
  "BundledLicense",
  "BundledNotice",
  "BundledThirdPartyNotices",
  "BundledNpmLicenses",
  "BundledRustLicenses",
]) {
  requireText(
    wixTemplate,
    `Key="Software\\\\{{manufacturer}}\\\\{{product_name}}" Name="${componentName}" Type="integer" Value="1" KeyPath="yes"`,
    `HKCU KeyPath for WiX component ${componentName}`,
  );
}

const rustLicenseNotices = read("THIRD_PARTY_RUST_LICENSES.html");
for (const expected of [
  "Token Pass Swith Rust dependency licenses",
  "<section>",
  "Used by:",
]) {
  requireText(
    rustLicenseNotices,
    expected,
    `generated Rust dependency notices: ${expected}`,
  );
}
if (
  rustLicenseNotices.includes(
    "Release CI regenerates this file from the locked Rust dependency graph",
  ) ||
  rustLicenseNotices.length < 100_000
) {
  errors.push(
    "THIRD_PARTY_RUST_LICENSES.html must be the generated locked dependency report",
  );
}

const npmLicenseNoticesText = read("THIRD_PARTY_NPM_LICENSES.json");
let npmLicenseNotices = {};
try {
  npmLicenseNotices = JSON.parse(npmLicenseNoticesText || "{}");
} catch {
  errors.push("THIRD_PARTY_NPM_LICENSES.json must contain valid JSON");
}

function inspectNpmLicenseMetadata(value, location = "report") {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      inspectNpmLicenseMetadata(item, `${location}[${index}]`),
    );
    return;
  }
  if (value === null || typeof value !== "object") {
    if (
      typeof value === "string" &&
      (path.win32.isAbsolute(value) || path.posix.isAbsolute(value))
    ) {
      errors.push(
        `npm license report contains an absolute path at ${location}`,
      );
    }
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (key === "paths") {
      errors.push(
        `npm license report contains private install paths at ${location}`,
      );
      continue;
    }
    inspectNpmLicenseMetadata(nestedValue, `${location}.${key}`);
  }
}

inspectNpmLicenseMetadata(npmLicenseNotices);
if (
  Object.values(npmLicenseNotices).reduce(
    (total, packages) =>
      total + (Array.isArray(packages) ? packages.length : 0),
    0,
  ) === 0
) {
  errors.push("THIRD_PARTY_NPM_LICENSES.json must contain dependency records");
}

const notice = read("NOTICE.md");
for (const expected of [
  "Copyright (c) 2025 Jason Young",
  "Copyright (c) 2026 Token Pass Swith Contributors",
  "98ccde0050f33a1bc8b16b96287a0b6f582c5d12",
  "https://github.com/farion1231/cc-switch",
]) {
  requireText(notice, expected, `NOTICE attribution: ${expected}`);
}

const disclosures = [
  ["README.md", ["Token Pass Swith is an independent derivative", "CC Switch"]],
  ["README_ZH.md", ["Token Pass Swith 基于开源项目", "二次开发"]],
  ["README_RU.md", ["Token Pass Swith — независимый проект", "CC Switch"]],
];
for (const [file, fragments] of disclosures) {
  const contents = read(file);
  for (const fragment of fragments) {
    requireText(contents, fragment, `${file} derivative disclosure`);
  }
}

for (const forbiddenDirectory of [["assets", "partners"]]) {
  if (existsSync(filePath(...forbiddenDirectory))) {
    errors.push(
      `stale inherited assets remain: ${relative(...forbiddenDirectory)}`,
    );
  }
}

const expectedScreenshots = new Map([
  [
    "assets/screenshots/main-en.png",
    "6623209de18991e303c625f41a8163817a330532a3f461d3e98814de418e271c",
  ],
  [
    "assets/screenshots/main-zh.png",
    "606fee91dc5ae75fff1146f5db13b6735c02d0e2de43565443d40077d636d622",
  ],
  [
    "assets/screenshots/main-ru.png",
    "7283a4ab07e2124b23b495aefd62dc3de445f90a8e819d67fb13e08b5ec7e0ee",
  ],
]);
const screenshotDirectory = filePath("assets", "screenshots");
const screenshotFiles = walk(screenshotDirectory)
  .filter((target) => path.extname(target).toLowerCase() === ".png")
  .map((target) => path.relative(root, target).replaceAll("\\", "/"));
for (const screenshot of screenshotFiles) {
  if (!expectedScreenshots.has(screenshot)) {
    errors.push(`unreviewed screenshot remains: ${screenshot}`);
  }
}
for (const [screenshot, expectedHash] of expectedScreenshots) {
  const target = filePath(...screenshot.split("/"));
  if (!existsSync(target)) {
    errors.push(`reviewed Token Pass screenshot is missing: ${screenshot}`);
  } else if (sha256(target) !== expectedHash) {
    errors.push(`reviewed Token Pass screenshot hash changed: ${screenshot}`);
  }
}
const screenshotProvenance = read("assets", "screenshots", "README.md");
for (const expectedHash of expectedScreenshots.values()) {
  requireText(
    screenshotProvenance,
    expectedHash,
    `screenshot provenance hash: ${expectedHash}`,
  );
}
const forbiddenUpstreamScreenshotHashes = new Set([
  "8841e0629490c275831fbf6e9a4cb9764c9c0a2b189af55ca57aabf4bf3d6e67",
  "9413477d5b1007080b5dfef016fea9f08f28837c680377c4012bc794e5a4eba4",
  "151f5f816896f8829bbb52216270c1799ea330b29c7775bdd4ab6c98f150b8f9",
  "8d02699a42287d5c9a30fa43e091ee68c60c8ba2fbad1228955f8308ad3a6df3",
  "7ac4e9926cb6ce5b73bc7ce796c2d8cc2a70d536327a2f49b3fed3d8819b0ff5",
  "83d93d7b1f9be9c30815fd275e49fd053657039d7b7cb599a7a470d8494409de",
]);
for (const target of walk(root)) {
  const rel = path.relative(root, target).replaceAll("\\", "/");
  if (
    rel.startsWith(".git/") ||
    rel.startsWith("node_modules/") ||
    rel.startsWith("target/") ||
    rel.includes("/target/")
  ) {
    continue;
  }
  if (
    [".jpeg", ".jpg", ".png", ".webp"].includes(
      path.extname(target).toLowerCase(),
    ) &&
    forbiddenUpstreamScreenshotHashes.has(sha256(target))
  ) {
    errors.push(`inherited upstream screenshot hash remains: ${rel}`);
  }
}

const forbiddenIconHashes = new Set([
  "00ea6986f254c75b8a447fab0aa2f897da90cca68c31d2943db61069efea8073",
  "01eadc7523af3beece5473add6b914983a6bb01c44584547c434d2ea0f65eb20",
  "8c167919ba52ed97aaa5b612819821a0c6dba2c7cd2c03a09df0a2086451d2aa",
  "04225b1b9c54569ec1ec850ad9f1c9f33ca4f286dab001a3392c0460deb342e5",
  "05684dd45623b59a2f0a77100e038eb985e324ad10af49a2082edd13f72c0b0d",
  "0a1a7daaaac5af6daeaf7e787d4b690d01682ea4866dd6614eacaf94ba8c6946",
  "1059bd1bc3cb9e20c8e500bacf11c1a81437a311681bd4584a21f7f17ecc22b1",
  "1fe478bd90901ad415cc4d8fb35161bcfb611854d5b6f5b27562c4d928dd86b2",
  "258b2eef1c8a447ede5db783876c172d9d640a771512b5305af17b061c261e1e",
  "289c3f2261d45429c40de05dc6506a14b3d5ae1da31b40588f77d98b66d71476",
  "2b203f55315c7f0e6a9bb12ac6a97982dae277912d662f9fa17a062a170ae35b",
  "3062ec8023c468e0acffa76a42e35b9c288aada3318fd64eb982bf1c42510fa8",
  "38fa98c25316ebf8507cf803e6314f52cd951a9bc94a69a624c2bea1bbe6e102",
  "6043fb83d73233956bdfba5056afd9aede7e4e870611710b8419be8275ddd558",
  "65c365e7c32929807deec2d7469eed2d5c06f21ce86854a4848057d2df588ab8",
  "6f629742e00c26d047bcfdec908fb349db33a00c8eea61209b867465ccddeca0",
  "71ffc1ab956adf8f8c74b861a87bfb086c42848837587f1dff2bcf70cba2bb86",
  "737004c91a766a67e57a62f695a28e2390a6fbd48efcb1d3eda1fe5bf289c3f4",
  "78c8b01e0a2d63f3e2560171dec77d6a5f2aaea88eed8e6ddad76a0de72ce893",
  "7b223affc18ced1a993e8b0f7575701861724f69343c031d41e1505e33f39af2",
  "7d157a7488626d747541e40035a2194ac9375c929b4cf10dc54af239478f533a",
  "8528772fb6fcbf329cea99f89fdf66d3373d0fbe55beff98b17f3a40a764d2ea",
  "8e24e5968cac75da1698ae5c2cf2d5f542625bc9d2060b9a052f0348f9cf8795",
  "944e533d152f89e060717865801feba78ebaccc2702324ace07b87c6acb83f5f",
  "984b985dd9922f7f8062a8d512a16cd7a0888aac5d1ddf0eb81a409ad0eb05d9",
  "a7369bccda59dd33d66be9bf05ef409b5eadb6dab5ac88d3aeb86545de7a6a57",
  "aaedca1e6ccaf03ff7c068ed2230491c358f0c6498637b6e97e5d8b4de8f528f",
  "b2990a61ad63e3ff094b51cdf06d9442f10db3c919fa89e6e1c4dc96724ec3de",
  "c45ce787282b24b24c18c8f8fab2e20183576015818adb6e41fe2ba08ac7d88d",
  "c784e7fc0d7c124e4ad629665404c1b6150ed60500ee6735b60f40a54e0c9060",
  "c82ff0ffb2800fbcbbdd88b92d1844527ef5fb40eb5d6fb3213bab505b2ee007",
  "d19349e7d3e17540d573fa458544145449106799d0d71de52294d60f629f4656",
  "d52664c416cac563442c6d2f7eedce8f35e345f866dc38eecfa5d99c7bfc921a",
  "db7f1b5105f5823042c7f79ee3eae1ecfc6cfb32b500f86164c1341971be3660",
  "dfb1ba9bbc0cef7b428cdb7ca3d72315d1f3c94d24f00b8348ba8b721b436ebf",
  "e6afe2cd4e3b2bd7d9a628be5c8df0a10cc7390890252185181f7ff8061e6fa8",
  "e84a1a1d8982ba3576fd3cc31b1d86cec506319a1eca8f6af50a0ce590b22a00",
  "ecbd6fb5edb79d975df635b58ec813895a077a579007c337431a71168e6f74ca",
  "ee043ad844f039d4c65cdf16445d4ed65bc85b36597687d57405420cb2fbece8",
  "efbe73b4642d35ed7987cebb223e4f2b1d03408226c48d9edc37dbb5b1c69be4",
  "f1702cd4adeb2d3be4dc9a6ad4c74e2ca15f63ade1b7190da3c547a61d326034",
  "f18645510570b45df07f8b785ff7ee979f4c7c1dd828276053875292313e3ec0",
  "f525f817b89d50f101bc4bea359cd719d2fcb52d1ce9f3e92ba4b1b0acb72ad4",
  "fb40269c3282a762bc6242db563fa3359177e4820724f56a49ea3abf37ad3521",
]);
const brandIcon = filePath("assets", "brand", "token-pass-swith.svg");
if (!existsSync(brandIcon)) {
  errors.push("canonical Token Pass Swith brand icon is missing");
} else if (
  sha256(brandIcon) !==
  "ffc69414d0463b9c6da9dfdfaa17d18c6f22a0785034f2260157cf70336d1d34"
) {
  errors.push("canonical Token Pass Swith brand icon hash changed");
}
requireText(
  read("assets", "brand", "README.md"),
  "File license: MIT",
  "brand artwork provenance",
);
for (const target of [
  filePath("src", "assets", "icons", "app-icon.png"),
  ...walk(filePath("src-tauri", "icons")),
]) {
  if (statSync(target).size > 0 && forbiddenIconHashes.has(sha256(target))) {
    errors.push(
      `upstream application icon is still present: ${path.relative(root, target)}`,
    );
  }
}

const manifestText = read("assets", "icon-sources.json");
if (manifestText) {
  const manifest = JSON.parse(manifestText);
  const entries = manifest.icons ?? [];
  const recordedFiles = new Set(entries.map((entry) => entry.file));
  const iconFiles = walk(filePath("src", "icons", "extracted"))
    .filter(
      (target) =>
        !["index.ts", "metadata.ts", "README.md"].includes(
          path.basename(target),
        ),
    )
    .map((target) => path.relative(root, target).replaceAll("\\", "/"));
  for (const iconFile of iconFiles) {
    if (!recordedFiles.has(iconFile)) {
      errors.push(`provider icon has no provenance record: ${iconFile}`);
    }
  }
  for (const entry of entries) {
    const target = filePath(...entry.file.split("/"));
    if (!existsSync(target)) {
      errors.push(`provenance record points to a missing icon: ${entry.file}`);
    } else if (entry.sha256 !== sha256(target)) {
      errors.push(
        `provider icon hash differs from provenance record: ${entry.file}`,
      );
    }
  }
}

const trackedTextExtensions = new Set([
  ".json",
  ".md",
  ".mjs",
  ".rs",
  ".toml",
  ".ts",
  ".tsx",
  ".xml",
  ".yml",
  ".yaml",
]);
const deprecatedDomain = ["tokenpass", "ru"].join(".");
const forbiddenCredentialPatterns = [
  [
    "Google OAuth client ID",
    /\b\d{8,}-[a-z0-9_-]{20,}\.apps\.googleusercontent\.com\b/iu,
  ],
  ["Google OAuth client secret", /\bGOCSPX-[A-Za-z0-9_-]{20,}\b/u],
];
const upstreamDisplayNameAllowedIn = new Set([
  ".github/RELEASE_TEMPLATE.md",
  "assets/brand/README.md",
  "CONTRIBUTING.md",
  "LICENSE",
  "NOTICE.md",
  "README.md",
  "README_RU.md",
  "README_ZH.md",
  "THIRD_PARTY_NOTICES.md",
  "scripts/check-public-compliance.mjs",
  "src-tauri/wix/LICENSE.rtf",
  "src/i18n/locales/en.json",
  "src/i18n/locales/ru.json",
  "src/i18n/locales/zh.json",
]);
const compatibilityBrandingAllowedByFile = new Map([
  ["docs/compatibility-identifiers.md", ["Legacy CC Switch"]],
  ["src-tauri/src/codex_history_migration.rs", ["Legacy CC Switch"]],
]);
for (const target of walk(root)) {
  const rel = path.relative(root, target).replaceAll("\\", "/");
  if (
    rel.startsWith(".git/") ||
    rel.startsWith("node_modules/") ||
    rel.startsWith("target/") ||
    rel.includes("/target/")
  ) {
    continue;
  }
  if (
    [".key", ".p12", ".pfx", ".pem"].includes(
      path.extname(target).toLowerCase(),
    )
  ) {
    errors.push(`private key or certificate file must not be public: ${rel}`);
  }
  if (!trackedTextExtensions.has(path.extname(target).toLowerCase())) continue;
  if (statSync(target).size > 1024 * 1024) continue;
  const contents = readFileSync(target, "utf8");
  if (contents.toLowerCase().includes(deprecatedDomain)) {
    errors.push(`deprecated Token Pass domain detected: ${rel}`);
  }
  for (const [label, pattern] of forbiddenCredentialPatterns) {
    if (pattern.test(contents)) {
      errors.push(`${label} must not be stored in public source: ${rel}`);
    }
  }
  if (
    contents.includes("Jason Young") &&
    ![
      "LICENSE",
      "NOTICE.md",
      "THIRD_PARTY_NOTICES.md",
      "scripts/check-public-compliance.mjs",
    ].includes(rel)
  ) {
    errors.push(`original author is used outside attribution files: ${rel}`);
  }
  let contentsWithoutCompatibilityBranding = contents;
  for (const fragment of compatibilityBrandingAllowedByFile.get(rel) ?? []) {
    contentsWithoutCompatibilityBranding =
      contentsWithoutCompatibilityBranding.replaceAll(fragment, "");
  }
  if (
    /CC[ -]Switch/u.test(contentsWithoutCompatibilityBranding) &&
    !upstreamDisplayNameAllowedIn.has(rel)
  ) {
    errors.push(
      `upstream display branding is outside attribution files: ${rel}`,
    );
  }
}

requireText(
  read("docs", "compatibility-identifiers.md"),
  "Legacy Compatibility Identifiers",
  "legacy compatibility whitelist",
);

for (const [file, text] of [
  ["src-tauri/src/panic_hook.rs", "[CC-Switch]"],
  ["src-tauri/src/proxy/handlers.rs", "CC Switch local proxy failed"],
  ["src-tauri/src/proxy/handlers.rs", "not a CC Switch limit"],
]) {
  if (read(...file.split("/")).includes(text)) {
    errors.push(`user-visible upstream branding remains in ${file}: ${text}`);
  }
}

if (errors.length > 0) {
  console.error("Public compliance check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Public compliance configuration passed.");
