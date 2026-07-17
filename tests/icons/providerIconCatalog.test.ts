import { describe, expect, it } from "vitest";
import {
  getIcon,
  getIconUrl,
  hasIcon,
  iconList,
  isUrlIcon,
} from "@/icons/extracted";
import { getIconMetadata } from "@/icons/extracted/metadata";

const publicVendorIcons = [
  "alibaba",
  "aws",
  "azure",
  "baidu",
  "cloudflare",
  "cohere",
  "deepseek",
  "google",
  "huawei",
  "huggingface",
  "kimi",
  "meta",
  "mistral",
  "newapi",
  "nvidia",
  "openrouter",
  "openclaw",
  "opencode",
  "hermes",
  "qwen",
  "siliconflow",
  "stepfun",
  "tencent",
  "zhipu",
] as const;

describe("provider icon catalog", () => {
  it("keeps public vendor artwork available independently of provider recommendations", () => {
    for (const icon of publicVendorIcons) {
      expect(hasIcon(icon), `missing icon: ${icon}`).toBe(true);
    }

    expect(getIconMetadata("deepseek")).toBeDefined();
    expect(getIconMetadata("qwen")).toBeDefined();
    expect(getIconMetadata("zhipu")).toBeDefined();
  });

  it("matches the reviewed provider-artwork manifest", () => {
    expect(iconList).toHaveLength(56);
  });

  it("renders color-capable brands in color and keeps monochrome SVGs theme-aware", () => {
    for (const icon of ["claude", "deepseek", "gemini", "qwen"]) {
      expect(getIcon(icon), `missing inline SVG: ${icon}`).toMatch(
        /#[0-9a-f]{3,8}|linearGradient|radialGradient/i,
      );
      expect(isUrlIcon(icon)).toBe(false);
    }

    expect(getIcon("openai")).toContain("currentColor");
    expect(isUrlIcon("openai")).toBe(false);
    expect(getIconUrl("hermes")).not.toBe("");
    expect(isUrlIcon("hermes")).toBe(true);
  });
});
