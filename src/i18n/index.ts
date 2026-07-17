import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import ja from "./locales/ja.json";
import ru from "./locales/ru.json";
import zh from "./locales/zh.json";
import zhTW from "./locales/zh-TW.json";
import {
  getDocumentLanguage,
  resolveSupportedLanguage,
  type Language,
} from "./languages";

const DEFAULT_LANGUAGE: Language = "zh";

const getInitialLanguage = (): Language => {
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem("language");
      const storedLanguage = resolveSupportedLanguage(stored);
      if (storedLanguage) return storedLanguage;
    } catch (error) {
      console.warn("[i18n] Failed to read stored language preference", error);
    }
  }

  const navigatorLang =
    typeof navigator !== "undefined"
      ? (navigator.language?.toLowerCase() ??
        navigator.languages?.[0]?.toLowerCase())
      : undefined;

  return resolveSupportedLanguage(navigatorLang) ?? DEFAULT_LANGUAGE;
};

const resources = {
  en: {
    translation: en,
  },
  ja: {
    translation: ja,
  },
  ru: {
    translation: ru,
  },
  zh: {
    translation: zh,
  },
  "zh-TW": {
    translation: zhTW,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(), // 根据本地存储或系统语言选择默认语言
  fallbackLng: "en", // 如果缺少中文翻译则退回英文

  interpolation: {
    escapeValue: false, // React 已经默认转义
  },

  // 开发模式下显示调试信息
  debug: false,
});

if (typeof document !== "undefined") {
  const syncDocumentLanguage = (language: string) => {
    document.documentElement.lang = getDocumentLanguage(language);
  };
  syncDocumentLanguage(i18n.language);
  i18n.on("languageChanged", syncDocumentLanguage);
}

export default i18n;
