import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FirstRunNoticeDialog } from "@/components/FirstRunNoticeDialog";

const mocks = vi.hoisted(() => ({
  save: vi.fn(),
}));

vi.mock("@/lib/query", () => ({
  useSettingsQuery: () => ({
    data: {
      language: "en",
      firstRunNoticeConfirmed: false,
    },
  }),
}));

vi.mock("@/lib/api", () => ({
  settingsApi: {
    save: mocks.save,
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        "firstRunNotice.title": "Welcome to Token Pass Swith",
        "firstRunNotice.bodyDefault": "Manage local provider profiles.",
        "firstRunNotice.bodyOpenAccess":
          "No Token Pass account, activation key, or subscription is required.",
        "firstRunNotice.bodyOfficial":
          "Third-party account connections are optional.",
        "firstRunNotice.confirm": "Got it",
      })[key] ?? key,
  }),
}));

describe("FirstRunNoticeDialog", () => {
  beforeEach(() => {
    mocks.save.mockReset();
    mocks.save.mockResolvedValue(undefined);
  });

  it("states that Token Pass access is immediate and account-free", async () => {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    render(
      <QueryClientProvider client={queryClient}>
        <FirstRunNoticeDialog />
      </QueryClientProvider>,
    );

    const openAccessNotice = screen.getByText(
      "No Token Pass account, activation key, or subscription is required.",
    );
    expect(openAccessNotice).toBeInTheDocument();
    expect(openAccessNotice.parentElement).toHaveClass(
      "min-h-0",
      "flex-1",
      "overflow-y-auto",
    );

    fireEvent.click(screen.getByRole("button", { name: "Got it" }));

    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["settings"] });
  });
});
