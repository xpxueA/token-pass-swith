import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CopilotAuthSection } from "@/components/providers/forms/CopilotAuthSection";
import { CodexOAuthSection } from "@/components/providers/forms/CodexOAuthSection";

const mocks = vi.hoisted(() => ({
  authGetStatus: vi.fn(),
  authStartLogin: vi.fn(),
  authPollForAccount: vi.fn(),
  authRemoveAccount: vi.fn(),
  authSetDefaultAccount: vi.fn(),
  authLogout: vi.fn(),
  openExternal: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  authApi: {
    authGetStatus: mocks.authGetStatus,
    authStartLogin: mocks.authStartLogin,
    authPollForAccount: mocks.authPollForAccount,
    authRemoveAccount: mocks.authRemoveAccount,
    authSetDefaultAccount: mocks.authSetDefaultAccount,
    authLogout: mocks.authLogout,
  },
  settingsApi: {
    openExternal: mocks.openExternal,
  },
}));

vi.mock("@/lib/clipboard", () => ({
  copyText: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      key: string,
      fallbackOrOptions?: string | { defaultValue?: string },
    ) => {
      if (typeof fallbackOrOptions === "string") return fallbackOrOptions;
      return fallbackOrOptions?.defaultValue ?? key;
    },
  }),
}));

function renderWithQueryClient(component: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  );
}

describe("optional OAuth connections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authGetStatus.mockImplementation((provider: string) =>
      Promise.resolve({
        provider,
        authenticated: false,
        default_account_id: null,
        accounts: [],
      }),
    );
    mocks.authStartLogin.mockImplementation((provider: string) =>
      Promise.resolve({
        provider,
        device_code: "fake-device-code",
        user_code: "FAKE-CODE",
        verification_uri: "https://example.invalid/device",
        expires_in: 600,
        interval: 5,
      }),
    );
    mocks.authPollForAccount.mockResolvedValue(null);
    mocks.openExternal.mockResolvedValue(undefined);
  });

  it("starts GitHub Copilot OAuth only after the user clicks login", async () => {
    renderWithQueryClient(<CopilotAuthSection />);

    await screen.findByRole("button", { name: "使用 GitHub 登录" });
    expect(mocks.authGetStatus).toHaveBeenCalledWith("github_copilot");
    expect(mocks.authStartLogin).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "使用 GitHub 登录" }));

    await waitFor(() =>
      expect(mocks.authStartLogin).toHaveBeenCalledWith(
        "github_copilot",
        undefined,
      ),
    );
  });

  it("starts ChatGPT OAuth only after the user clicks login", async () => {
    renderWithQueryClient(<CodexOAuthSection />);

    await screen.findByRole("button", { name: "使用 ChatGPT 登录" });
    expect(mocks.authGetStatus).toHaveBeenCalledWith("codex_oauth");
    expect(mocks.authStartLogin).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "使用 ChatGPT 登录" }));

    await waitFor(() =>
      expect(mocks.authStartLogin).toHaveBeenCalledWith(
        "codex_oauth",
        undefined,
      ),
    );
  });

  it("keeps existing Copilot and ChatGPT accounts available", async () => {
    mocks.authGetStatus.mockImplementation((provider: string) =>
      Promise.resolve({
        provider,
        authenticated: true,
        default_account_id: `${provider}-account`,
        accounts: [
          {
            id: `${provider}-account`,
            provider,
            login:
              provider === "github_copilot" ? "github-user" : "chatgpt-user",
            avatar_url: null,
            authenticated_at: 1,
            is_default: true,
            github_domain: "github.com",
          },
        ],
      }),
    );

    renderWithQueryClient(<CopilotAuthSection />);
    renderWithQueryClient(<CodexOAuthSection />);

    expect(await screen.findByText("github-user")).toBeInTheDocument();
    expect(await screen.findByText("chatgpt-user")).toBeInTheDocument();
    expect(mocks.authStartLogin).not.toHaveBeenCalled();
  });
});
