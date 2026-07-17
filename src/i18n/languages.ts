export const SUPPORTED_LANGUAGES = ["zh", "zh-TW", "en", "ja", "ru"] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export function resolveSupportedLanguage(
  language?: string | null,
): Language | undefined {
  if (!language) return undefined;
  const normalized = language.toLowerCase().replace(/_/g, "-");

  if (
    normalized === "zh-tw" ||
    normalized.startsWith("zh-hant") ||
    normalized.startsWith("zh-hk") ||
    normalized.startsWith("zh-mo")
  ) {
    return "zh-TW";
  }

  if (normalized === "zh" || normalized.startsWith("zh-")) return "zh";
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  if (normalized === "ja" || normalized.startsWith("ja-")) return "ja";
  if (normalized === "ru" || normalized.startsWith("ru-")) return "ru";

  return undefined;
}

export function normalizeLanguage(
  language?: string | null,
  fallback: Language = "zh",
): Language {
  return resolveSupportedLanguage(language) ?? fallback;
}

export function isSupportedLanguage(language?: string | null): boolean {
  return resolveSupportedLanguage(language) !== undefined;
}

export function getDocumentLanguage(language?: string | null): string {
  const resolved = resolveSupportedLanguage(language) ?? "en";
  return resolved === "zh" ? "zh-CN" : resolved;
}
