import { describe, expect, it } from "vitest";
import en from "@/i18n/locales/en.json";
import ru from "@/i18n/locales/ru.json";
import { settingsSchema } from "@/lib/schemas/settings";
import { getLocaleFromLanguage } from "@/components/usage/format";
import {
  getDocumentLanguage,
  resolveSupportedLanguage,
} from "@/i18n/languages";

function flattenTranslations(
  value: unknown,
  path = "",
  output = new Map<string, string>(),
): Map<string, string> {
  if (typeof value === "string") {
    output.set(path, value);
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      flattenTranslations(item, `${path}[${index}]`, output);
    });
    return output;
  }

  if (!value || typeof value !== "object") return output;

  for (const [key, child] of Object.entries(value)) {
    flattenTranslations(child, path ? `${path}.${key}` : key, output);
  }

  return output;
}

function interpolationTokens(value: string): string[] {
  return value.match(/{{[^{}]+}}/g)?.sort() ?? [];
}

function angleBracketTokens(value: string): string[] {
  return value.match(/<[^<>\n]+>/g)?.sort() ?? [];
}

describe("Russian locale", () => {
  const english = flattenTranslations(en);
  const russian = flattenTranslations(ru);

  it("contains exactly the same translation keys as English", () => {
    expect([...russian.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it("preserves every i18next interpolation token", () => {
    for (const [key, englishValue] of english) {
      expect(interpolationTokens(russian.get(key) ?? ""), key).toEqual(
        interpolationTokens(englishValue),
      );
      expect(angleBracketTokens(russian.get(key) ?? ""), key).toEqual(
        angleBracketTokens(englishValue),
      );
    }
  });

  it("preserves executable examples and configuration identifiers", () => {
    const requiredTokens: Record<string, string[]> = {
      "confirm.unifyCodexHistory.message": ["encrypted_content"],
      "settings.unifyCodexSessionHistoryDescription": ["encrypted_content"],
      "settings.advanced.rectifier.thinkingBudgetDescription": [
        "budget_tokens",
        "max_tokens",
      ],
      "settings.advanced.rectifier.mediaHeuristicDescription": [
        "declared-text-only",
        "upstream-error",
      ],
      "settings.webdavSync.remoteRootDefault": ["token-pass-swith-sync"],
      "settings.s3Sync.remoteRootDefault": ["token-pass-swith-sync"],
      "settings.s3Sync.presets.ossHint": [
        "https://oss-<region>.aliyuncs.com",
        "cn-hangzhou",
        "cn-shanghai",
      ],
      "settings.s3Sync.presets.cosHint": ["ap-guangzhou", "ap-beijing"],
      "settings.s3Sync.bucketPlaceholder": ["my-token-pass-swith-bucket"],
      "providerForm.fastModelPlaceholder": ["GLM-4.5-Air"],
      "copilot.enterpriseDomainPlaceholder": ["company.ghe.com"],
      "codexConfig.authJsonPlaceholder": ["sk-your-api-key-here"],
      "codexConfig.reasoningEffortHint": ["reasoning.effort"],
      "usageScript.organizationIdPlaceholder": ["org-xxxxxx"],
      "usageScript.projectIdPlaceholder": ["proj-xxxxxx"],
      "mcp.form.titlePlaceholder": ["my-mcp-server"],
      "mcp.presets.fetch.name": ["mcp-server-fetch"],
      "skills.searchSource.skillssh": ["skills.sh"],
      "skills.skillssh.searchPlaceholder": ["skills.sh"],
      "skills.repo.branchPlaceholder": ["main"],
      "hermes.webui.launchConfirmMessage": ["pip install hermes-agent[web]"],
      "omo.advancedJsonHint": ["top_p", "budgetTokens", "prompt_append"],
      "omo.slimOtherFieldsHint": ["disabled_mcps", "todoContinuation"],
    };

    for (const [key, tokens] of Object.entries(requiredTokens)) {
      const translatedValue = russian.get(key) ?? "";
      for (const token of tokens) {
        expect(translatedValue, `${key} must preserve ${token}`).toContain(
          token,
        );
      }
    }

    expect(russian.get("mcp.form.jsonPlaceholder")).toBe(
      english.get("mcp.form.jsonPlaceholder"),
    );
    expect(russian.get("mcp.form.tomlPlaceholder")).toBe(
      english.get("mcp.form.tomlPlaceholder"),
    );
    expect(russian.get("codexConfig.authJsonPlaceholder")).toBe(
      english.get("codexConfig.authJsonPlaceholder"),
    );
    expect(russian.get("mcp.wizard.headersPlaceholder")).toBe(
      english.get("mcp.wizard.headersPlaceholder"),
    );
  });

  it("translates the interface instead of relying on the English fallback", () => {
    const translatableKeys = [...english]
      .filter(([, value]) => /[A-Za-z]{3}/.test(value))
      .map(([key]) => key);
    const translatedKeys = translatableKeys.filter((key) =>
      /[А-Яа-яЁё]/.test(russian.get(key) ?? ""),
    );

    expect(translatedKeys.length / translatableKeys.length).toBeGreaterThan(
      0.75,
    );
  });

  it("accepts Russian settings and uses Russian regional formatting", () => {
    const parsed = settingsSchema.parse({
      showInTray: true,
      minimizeToTrayOnClose: true,
      language: "ru",
    });

    expect(parsed.language).toBe("ru");
    expect(resolveSupportedLanguage("ru_RU")).toBe("ru");
    expect(getDocumentLanguage("ru_RU")).toBe("ru");
    expect(getDocumentLanguage("zh-Hans")).toBe("zh-CN");
    expect(getLocaleFromLanguage("ru-RU")).toBe("ru-RU");
  });
});
