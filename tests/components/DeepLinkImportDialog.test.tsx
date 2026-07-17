import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DeepLinkImportDialog } from "@/components/DeepLinkImportDialog";
import { DeepLinkImportRequest, deeplinkApi } from "@/lib/api/deeplink";
import { emitTauriEvent } from "../msw/tauriMocks";

vi.mock("@/components/ProviderIcon", () => ({
  ProviderIcon: () => <div data-testid="provider-icon" />,
}));

const request: DeepLinkImportRequest = {
  version: "v1",
  resource: "provider",
  app: "codex",
  name: "New API Provider",
  endpoint: "https://tokenpass.cloud/v1",
  apiKey: "sk-test-only",
  model: "model-test",
  homepage: "https://tokenpass.cloud",
  enabled: true,
};

let pendingRequests: DeepLinkImportRequest[] = [];

function renderDialog() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <DeepLinkImportDialog />
    </QueryClientProvider>,
  );
}

async function openConfirmation() {
  pendingRequests.push(request);
  await act(async () => {
    emitTauriEvent("deeplink-import", undefined);
  });
  await screen.findByRole("button", { name: "deeplink.import" });
}

describe("DeepLinkImportDialog", () => {
  beforeEach(() => {
    pendingRequests = [];
    vi.spyOn(deeplinkApi, "takePendingDeeplinks").mockImplementation(async () =>
      pendingRequests.splice(0),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a masked confirmation and cancel does not import", async () => {
    const importSpy = vi.spyOn(deeplinkApi, "importFromDeeplink");

    renderDialog();
    await openConfirmation();

    expect(screen.getByText("New API Provider")).toBeInTheDocument();
    expect(screen.getByText("sk-t********************")).toBeInTheDocument();
    expect(screen.queryByText("sk-test-only")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "common.cancel" }));

    expect(importSpy).not.toHaveBeenCalled();
  });

  it("shows a cold-start deep link only after the frontend takes the pending request", async () => {
    const importSpy = vi.spyOn(deeplinkApi, "importFromDeeplink");
    pendingRequests.push(request);

    renderDialog();

    await screen.findByRole("button", { name: "deeplink.import" });
    expect(deeplinkApi.takePendingDeeplinks).toHaveBeenCalled();
    expect(screen.getByText("New API Provider")).toBeInTheDocument();
    expect(screen.getByText("sk-t********************")).toBeInTheDocument();
    expect(screen.queryByText("sk-test-only")).not.toBeInTheDocument();
    expect(importSpy).not.toHaveBeenCalled();
  });

  it("imports the unchanged request only after explicit confirmation", async () => {
    const importSpy = vi
      .spyOn(deeplinkApi, "importFromDeeplink")
      .mockResolvedValue({ type: "provider", id: "provider-test" });

    renderDialog();
    await openConfirmation();

    expect(importSpy).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "deeplink.import" }));

    await waitFor(() => {
      expect(importSpy).toHaveBeenCalledWith(request);
    });
  });
});
