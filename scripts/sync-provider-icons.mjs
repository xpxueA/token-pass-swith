import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { format } from "prettier";

const root = process.cwd();
const expectedLobeVersion = "1.73.0";
const lobeRevision = "798b90d7d65cd764b7a2dee1f95e7bd56eacb602";
const lobeIntegrity =
  "sha512-ydKUCDoopdmulbjDZo/gppaODd5Ju5nPneVcN9A5dAz9IJZUMkLms8bqostMLrqcdMQ8resKjLuV9RhJaWhaag==";
const lobeRoot = path.join(
  root,
  "node_modules",
  "@lobehub",
  "icons-static-svg",
);

const lobeIcons = [
  ["aihubmix", "aihubmix-color.svg", "AIHubMix"],
  ["alibaba", "alibaba-color.svg", "Alibaba"],
  ["anthropic", "anthropic.svg", "Anthropic"],
  ["aws", "aws-color.svg", "AWS", "cloud"],
  ["azure", "azure-color.svg", "Azure", "cloud"],
  ["baidu", "baidu-color.svg", "Baidu"],
  ["bailian", "bailian-color.svg", "Bailian"],
  ["bytedance", "bytedance-color.svg", "ByteDance"],
  ["chatglm", "chatglm-color.svg", "ChatGLM"],
  ["claude", "claude-color.svg", "Claude"],
  ["cloudflare", "cloudflare-color.svg", "Cloudflare", "cloud"],
  ["cohere", "cohere-color.svg", "Cohere"],
  ["copilot", "copilot-color.svg", "Copilot", "tool"],
  ["deepseek", "deepseek-color.svg", "DeepSeek"],
  ["doubao", "doubao-color.svg", "Doubao"],
  ["gemini", "gemini-color.svg", "Gemini"],
  ["gemma", "gemma-color.svg", "Gemma"],
  ["github", "github.svg", "GitHub", "tool"],
  ["githubcopilot", "githubcopilot.svg", "GitHub Copilot", "tool"],
  ["google", "google-color.svg", "Google"],
  ["googlecloud", "googlecloud-color.svg", "Google Cloud", "cloud"],
  ["grok", "grok.svg", "Grok"],
  ["huawei", "huawei-color.svg", "Huawei", "cloud"],
  ["huggingface", "huggingface-color.svg", "Hugging Face"],
  ["hunyuan", "hunyuan-color.svg", "Hunyuan"],
  ["kimi", "kimi-color.svg", "Kimi"],
  ["longcat", "longcat-color.svg", "LongCat"],
  ["mcp", "mcp.svg", "Model Context Protocol", "tool"],
  ["meta", "meta-color.svg", "Meta"],
  ["midjourney", "midjourney.svg", "Midjourney"],
  ["minimax", "minimax-color.svg", "MiniMax"],
  ["mistral", "mistral-color.svg", "Mistral"],
  ["modelscope", "modelscope-color.svg", "ModelScope"],
  ["moonshot", "moonshot.svg", "Moonshot"],
  ["newapi", "newapi-color.svg", "New API", "tool"],
  ["notion", "notion.svg", "Notion", "tool"],
  ["novita", "novita-color.svg", "Novita"],
  ["nvidia", "nvidia-color.svg", "NVIDIA"],
  ["ollama", "ollama.svg", "Ollama", "tool"],
  ["openai", "openai.svg", "OpenAI"],
  ["openrouter", "openrouter.svg", "OpenRouter"],
  ["perplexity", "perplexity-color.svg", "Perplexity"],
  ["qwen", "qwen-color.svg", "Qwen"],
  ["siliconflow", "siliconcloud-color.svg", "SiliconFlow"],
  ["stability", "stability-color.svg", "Stability AI"],
  ["stepfun", "stepfun-color.svg", "StepFun"],
  ["tencent", "tencent-color.svg", "Tencent", "cloud"],
  ["vercel", "vercel.svg", "Vercel", "cloud"],
  ["wenxin", "wenxin-color.svg", "Wenxin"],
  ["xai", "xai.svg", "xAI"],
  ["yi", "yi-color.svg", "01.AI Yi"],
  ["zeroone", "zeroone.svg", "01.AI"],
  ["zhipu", "zhipu-color.svg", "Zhipu AI"],
];

const officialIcons = [
  {
    key: "openclaw",
    file: "openclaw.svg",
    displayName: "OpenClaw",
    sourceFile: "assets/vendor-icons/openclaw.svg",
    repository: "https://github.com/openclaw/openclaw",
    sourcePath: "apps/linux/src-tauri/icons/icon.svg",
    revision: "167a8ef20a2a60594cd3fae1e96e3e95ffad9e4c",
    copyright: "Copyright (c) 2026 OpenClaw Foundation",
  },
  {
    key: "opencode",
    file: "opencode.svg",
    displayName: "OpenCode",
    sourceFile: "assets/vendor-icons/opencode.svg",
    repository: "https://github.com/anomalyco/opencode",
    sourcePath:
      "packages/console/app/src/asset/brand/opencode-logo-light-square.svg",
    revision: "08fb47373509ba64b13441061314eeacf4264f51",
    copyright: "Copyright (c) 2025 opencode",
  },
  {
    key: "hermes",
    file: "hermes.png",
    displayName: "Hermes Agent",
    sourceFile: "assets/vendor-icons/hermes.png",
    repository: "https://github.com/NousResearch/hermes-agent",
    sourcePath: "apps/desktop/assets/icon.png",
    revision: "bd00212337343150f2ee831d0e8738b417e03ae8",
    copyright: "Copyright (c) 2025 Nous Research",
  },
];

function sha256(target) {
  return createHash("sha256").update(readFileSync(target)).digest("hex");
}

function assertSafeInlineSvg(target, label) {
  const svg = readFileSync(target, "utf8");
  const forbidden = [
    [/<script\b/i, "script element"],
    [/<foreignObject\b/i, "foreignObject element"],
    [/\son[a-z]+\s*=/i, "event handler attribute"],
    [/(?:href|xlink:href)\s*=\s*["'](?!#)/i, "external reference"],
    [/url\(\s*["']?(?:https?:|data:|javascript:)/i, "external CSS URL"],
  ];

  for (const [pattern, description] of forbidden) {
    if (pattern.test(svg)) {
      throw new Error(`Unsafe ${description} in provider icon: ${label}`);
    }
  }
}

async function write(target, contents, parser) {
  const raw = `${contents.trimEnd()}\n`;
  const output = parser ? await format(raw, { parser }) : raw;
  writeFileSync(target, output, "utf8");
}

async function generate(outputDir, manifestPath) {
  const packageJson = JSON.parse(
    readFileSync(path.join(lobeRoot, "package.json"), "utf8"),
  );
  if (packageJson.version !== expectedLobeVersion) {
    throw new Error(
      `Expected @lobehub/icons-static-svg ${expectedLobeVersion}, found ${packageJson.version}`,
    );
  }

  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  const generated = [];
  for (const [
    key,
    sourceName,
    displayName,
    category = "ai-provider",
  ] of lobeIcons) {
    const source = path.join(lobeRoot, "icons", sourceName);
    if (!existsSync(source))
      throw new Error(`Missing Lobe icon: ${sourceName}`);
    assertSafeInlineSvg(source, sourceName);
    const file = `${key}.svg`;
    const target = path.join(outputDir, file);
    cpSync(source, target);
    generated.push({
      key,
      file,
      displayName,
      category,
      source: `https://github.com/lobehub/lobe-icons/blob/${lobeRevision}/packages/static-svg/icons/${sourceName}`,
      sourcePackage: `@lobehub/icons-static-svg@${expectedLobeVersion}`,
      sourceIntegrity: lobeIntegrity,
      sourceRevision: lobeRevision,
      license: "MIT",
      copyright: "Copyright (c) 2023 LobeHub",
      sha256: sha256(target),
    });
  }

  for (const icon of officialIcons) {
    const source = path.join(root, ...icon.sourceFile.split("/"));
    if (!existsSync(source))
      throw new Error(`Missing official icon snapshot: ${icon.sourceFile}`);
    if (icon.file.endsWith(".svg")) {
      assertSafeInlineSvg(source, icon.sourceFile);
    }
    const target = path.join(outputDir, icon.file);
    cpSync(source, target);
    generated.push({
      key: icon.key,
      file: icon.file,
      displayName: icon.displayName,
      category: "tool",
      source: `${icon.repository}/blob/${icon.revision}/${icon.sourcePath}`,
      sourceRevision: icon.revision,
      license: "MIT",
      copyright: icon.copyright,
      sha256: sha256(target),
    });
  }

  generated.sort((a, b) => a.key.localeCompare(b.key));
  const svgIcons = generated.filter((icon) => icon.file.endsWith(".svg"));
  const urlIcons = generated.filter((icon) => !icon.file.endsWith(".svg"));
  const imports = [
    ...svgIcons.map((icon) => `import _${icon.key} from "./${icon.file}?raw";`),
    ...urlIcons.map((icon) => `import _${icon.key} from "./${icon.file}?url";`),
  ].join("\n");
  const inlineEntries = svgIcons
    .map((icon) => `  ${JSON.stringify(icon.key)}: _${icon.key},`)
    .join("\n");
  const urlEntries = urlIcons
    .map((icon) => `  ${JSON.stringify(icon.key)}: _${icon.key},`)
    .join("\n");
  await write(
    path.join(outputDir, "index.ts"),
    `// Generated by scripts/sync-provider-icons.mjs. Do not edit manually.\n${imports}\n\nexport const icons: Record<string, string> = {\n${inlineEntries}\n};\n\nexport const iconUrls: Record<string, string> = {\n${urlEntries}\n};\n\nexport const iconList = [...new Set([...Object.keys(icons), ...Object.keys(iconUrls)])].sort();\n\nexport function getIcon(name: string): string {\n  return icons[name.toLowerCase()] || "";\n}\n\nexport function getIconUrl(name: string): string {\n  return iconUrls[name.toLowerCase()] || "";\n}\n\nexport function hasIcon(name: string): boolean {\n  const normalized = name.toLowerCase();\n  return normalized in icons || normalized in iconUrls;\n}\n\nexport function isUrlIcon(name: string): boolean {\n  return name.toLowerCase() in iconUrls;\n}\n\nexport { getIconMetadata } from "./metadata";`,
    "typescript",
  );

  const metadataEntries = generated
    .map(
      (icon) =>
        `  ${JSON.stringify(icon.key)}: { name: ${JSON.stringify(icon.key)}, displayName: ${JSON.stringify(icon.displayName)}, category: ${JSON.stringify(icon.category)}, keywords: [${JSON.stringify(icon.key)}, ${JSON.stringify(icon.displayName.toLowerCase())}] },`,
    )
    .join("\n");
  await write(
    path.join(outputDir, "metadata.ts"),
    `// Generated by scripts/sync-provider-icons.mjs. Do not edit manually.\nimport type { IconMetadata } from "@/types/icon";\n\nexport const iconMetadata: Record<string, IconMetadata> = {\n${metadataEntries}\n};\n\nexport function getIconMetadata(name: string): IconMetadata | undefined {\n  return iconMetadata[name.toLowerCase()];\n}\n\nexport function searchIcons(query: string): string[] {\n  const normalized = query.toLowerCase();\n  return Object.values(iconMetadata)\n    .filter((metadata) =>\n      [metadata.name, metadata.displayName, ...metadata.keywords]\n        .join(" ")\n        .toLowerCase()\n        .includes(normalized),\n    )\n    .map((metadata) => metadata.name);\n}`,
    "typescript",
  );

  mkdirSync(path.dirname(manifestPath), { recursive: true });
  await write(
    manifestPath,
    JSON.stringify(
      {
        schemaVersion: 1,
        generatedBy: "scripts/sync-provider-icons.mjs",
        icons: generated.map((icon) => ({
          key: icon.key,
          file: `src/icons/extracted/${icon.file}`,
          source: icon.source,
          sourcePackage: icon.sourcePackage,
          sourceIntegrity: icon.sourceIntegrity,
          sourceRevision: icon.sourceRevision,
          license: icon.license,
          copyright: icon.copyright,
          sha256: icon.sha256,
        })),
      },
      null,
      2,
    ),
    "json",
  );
}

function treeFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory()
      ? treeFiles(target).map((child) => path.join(entry.name, child))
      : [entry.name];
  });
}

function compareFile(expected, actual, label) {
  if (!existsSync(actual) || sha256(expected) !== sha256(actual)) {
    throw new Error(`Generated provider icon artifact is stale: ${label}`);
  }
}

const outputDir = path.join(root, "src", "icons", "extracted");
const manifestPath = path.join(root, "assets", "icon-sources.json");

if (process.argv.includes("--check")) {
  const temporaryRoot = mkdtempSync(path.join(tmpdir(), "token-pass-icons-"));
  try {
    const expectedOutput = path.join(temporaryRoot, "icons");
    const expectedManifest = path.join(temporaryRoot, "icon-sources.json");
    await generate(expectedOutput, expectedManifest);
    const expectedFiles = treeFiles(expectedOutput).sort();
    const actualFiles = treeFiles(outputDir).sort();
    if (JSON.stringify(expectedFiles) !== JSON.stringify(actualFiles)) {
      throw new Error("Generated provider icon file list is stale");
    }
    for (const file of expectedFiles) {
      compareFile(
        path.join(expectedOutput, file),
        path.join(outputDir, file),
        file,
      );
    }
    compareFile(expectedManifest, manifestPath, "assets/icon-sources.json");
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
  console.log("Provider icon sources are reproducible.");
} else {
  await generate(outputDir, manifestPath);
  console.log(
    `Generated ${lobeIcons.length + officialIcons.length} provider icons.`,
  );
}
