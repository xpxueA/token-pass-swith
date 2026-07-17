import { describe, expect, it } from "vitest";
import {
  claudeDesktopProviderPresets,
  codexProviderPresets,
  geminiProviderPresets,
  hermesProviderPresets,
  openclawProviderPresets,
  opencodeProviderPresets,
  providerPresets,
} from "@/config/tokenPassProviderPresets";
import { providerPresets as legacyClaudePresets } from "@/config/claudeProviderPresets";
import { claudeDesktopProviderPresets as legacyClaudeDesktopPresets } from "@/config/claudeDesktopProviderPresets";
import { codexProviderPresets as legacyCodexPresets } from "@/config/codexProviderPresets";
import { geminiProviderPresets as legacyGeminiPresets } from "@/config/geminiProviderPresets";
import { hermesProviderPresets as legacyHermesPresets } from "@/config/hermesProviderPresets";
import { openclawProviderPresets as legacyOpenClawPresets } from "@/config/openclawProviderPresets";
import { opencodeProviderPresets as legacyOpenCodePresets } from "@/config/opencodeProviderPresets";
import { rebaseOpenClawSuggestedDefaults } from "@/config/openclawProviderPresets";

const tokenPassCollections = [
  providerPresets,
  codexProviderPresets,
  geminiProviderPresets,
  claudeDesktopProviderPresets,
  opencodeProviderPresets,
  openclawProviderPresets,
  hermesProviderPresets,
];

const legacyCollections = [
  legacyClaudePresets,
  legacyCodexPresets,
  legacyGeminiPresets,
  legacyClaudeDesktopPresets,
  legacyOpenCodePresets,
  legacyOpenClawPresets,
  legacyHermesPresets,
];

const legacyDashedBrand = ["cc", "switch"].join("-");
const legacyCompactBrand = ["cc", "switch"].join("");
const referralPatterns = [
  `aff=${legacyDashedBrand}`,
  `aff=${legacyCompactBrand}`,
  `ref=${legacyDashedBrand}`,
  `utm_content=${legacyCompactBrand}`,
  `git_${legacyDashedBrand}`,
  legacyCompactBrand.toUpperCase(),
];

describe("Token Pass provider presets", () => {
  it("keeps all active preset collections focused on Token Pass plus official entries", () => {
    for (const collection of tokenPassCollections) {
      expect(collection.some((preset) => preset.name === "Token Pass")).toBe(
        true,
      );

      for (const preset of collection) {
        if (
          ("isOfficial" in preset && preset.isOfficial) ||
          preset.category === "official"
        ) {
          continue;
        }
        expect(preset.name).toBe("Token Pass");
        expect(preset.websiteUrl).toBe("https://tokenpass.cloud");
        expect(preset.apiKeyUrl).toBe("https://tokenpass.cloud");
        expect(preset.primePartner).toBe(true);
        expect(preset.partnerPromotionKey).toBe("tokenpass");
      }
    }
  });

  it("does not keep legacy public recommendation catalogs active", () => {
    for (const collection of legacyCollections) {
      expect(collection).toEqual([]);
    }
  });

  it("does not include legacy referral markers in active preset URLs", () => {
    const urls = tokenPassCollections.flatMap((collection) =>
      collection.flatMap((preset) =>
        [preset.websiteUrl, preset.apiKeyUrl].filter(Boolean),
      ),
    );

    for (const url of urls) {
      for (const marker of referralPatterns) {
        expect(url).not.toContain(marker);
      }
    }
  });

  it("rebases Token Pass OpenClaw defaults to the submitted provider key", () => {
    const preset = openclawProviderPresets.find(
      (item) => item.name === "Token Pass",
    );

    expect(preset?.suggestedDefaults).toBeDefined();

    const rebased = rebaseOpenClawSuggestedDefaults(
      preset!.suggestedDefaults!,
      "custom-token-pass",
    );

    expect(rebased.model?.primary).toBe("custom-token-pass/gpt-5.5");
    expect(rebased.modelCatalog).toHaveProperty("custom-token-pass/gpt-5.5");
    expect(rebased.modelCatalog).not.toHaveProperty("token-pass/gpt-5.5");
  });
});
