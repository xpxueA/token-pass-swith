import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LanguageSettings } from "@/components/settings/LanguageSettings";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "settings.language": "Язык интерфейса",
        "settings.languageHint": "Выберите язык приложения",
        "settings.languageOptionChinese": "简体中文",
        "settings.languageOptionTraditionalChinese": "繁體中文",
        "settings.languageOptionEnglish": "English",
        "settings.languageOptionJapanese": "日本語",
        "settings.languageOptionRussian": "Русский",
      })[key] ?? key,
  }),
}));

describe("LanguageSettings", () => {
  it("renders Russian as a selectable language without overflowing", () => {
    const onChange = vi.fn();
    render(<LanguageSettings value="ru" onChange={onChange} />);

    const russianButton = screen.getByRole("button", { name: "Русский" });
    expect(russianButton).toHaveAttribute("aria-pressed", "true");
    expect(russianButton.parentElement).toHaveClass("flex-wrap", "max-w-full");

    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(onChange).toHaveBeenCalledWith("en");
  });
});
