import type { ProviderPreset } from "./claudeProviderPresets";
import type { CodexProviderPreset } from "./codexProviderPresets";
import type { GeminiProviderPreset } from "./geminiProviderPresets";
import type {
  ClaudeDesktopProviderPreset,
  ClaudeDesktopRoutePreset,
} from "./claudeDesktopProviderPresets";
import type { OpenCodeProviderPreset } from "./opencodeProviderPresets";
import type { OpenClawProviderPreset } from "./openclawProviderPresets";
import type { HermesProviderPreset } from "./hermesProviderPresets";

export const CLAUDE_DESKTOP_ROLE_ROUTE_IDS = {
  sonnet: "claude-sonnet-5",
  opus: "claude-opus-4-8",
  fable: "claude-fable-5",
  haiku: "claude-haiku-4-5",
} as const;

export type ClaudeDesktopRoleId = keyof typeof CLAUDE_DESKTOP_ROLE_ROUTE_IDS;

function codexAuth(apiKey = ""): Record<string, string> {
  return {
    OPENAI_API_KEY: apiKey,
  };
}

function codexConfig(
  providerName: string,
  baseUrl: string,
  modelName = "gpt-5.5",
): string {
  const tomlString = (value: string) => JSON.stringify(value);

  return `model_provider = "custom"
model = ${tomlString(modelName)}
model_reasoning_effort = "high"
disable_response_storage = true

[model_providers.custom]
name = ${tomlString(providerName)}
base_url = ${tomlString(baseUrl)}
wire_api = "responses"
requires_openai_auth = true`;
}

function claudeDesktopRoutes(
  sonnet: string,
  opus: string,
  haiku: string,
): ClaudeDesktopRoutePreset[] {
  return [
    {
      routeId: CLAUDE_DESKTOP_ROLE_ROUTE_IDS.sonnet,
      upstreamModel: sonnet,
      supports1m: false,
    },
    {
      routeId: CLAUDE_DESKTOP_ROLE_ROUTE_IDS.opus,
      upstreamModel: opus,
      supports1m: false,
    },
    {
      routeId: CLAUDE_DESKTOP_ROLE_ROUTE_IDS.haiku,
      upstreamModel: haiku,
      supports1m: false,
    },
  ];
}

export const providerPresets: ProviderPreset[] = [
  {
    name: "Claude Official",
    websiteUrl: "https://www.anthropic.com/claude-code",
    settingsConfig: {
      env: {},
    },
    isOfficial: true,
    category: "official",
    theme: {
      icon: "claude",
      backgroundColor: "#D97757",
      textColor: "#FFFFFF",
    },
    icon: "anthropic",
    iconColor: "#D4915D",
  },
  {
    name: "Token Pass",
    nameKey: "providerForm.presets.tokenpass",
    websiteUrl: "https://tokenpass.cloud",
    apiKeyUrl: "https://tokenpass.cloud",
    settingsConfig: {
      env: {
        ANTHROPIC_BASE_URL: "https://tokenpass.cloud",
        ANTHROPIC_AUTH_TOKEN: "",
        ANTHROPIC_MODEL: "claude-sonnet-5",
        ANTHROPIC_DEFAULT_HAIKU_MODEL: "claude-haiku-4-5",
        ANTHROPIC_DEFAULT_SONNET_MODEL: "claude-sonnet-5",
        ANTHROPIC_DEFAULT_OPUS_MODEL: "claude-opus-4-8",
      },
    },
    category: "aggregator",
    isPartner: true,
    primePartner: true,
    partnerPromotionKey: "tokenpass",
  },
];

export const codexProviderPresets: CodexProviderPreset[] = [
  {
    name: "OpenAI Official",
    websiteUrl: "https://chatgpt.com/codex",
    isOfficial: true,
    category: "official",
    auth: {},
    config: "",
    theme: {
      icon: "codex",
      backgroundColor: "#1F2937",
      textColor: "#FFFFFF",
    },
    icon: "openai",
    iconColor: "#00A67E",
  },
  {
    name: "Token Pass",
    nameKey: "providerForm.presets.tokenpass",
    websiteUrl: "https://tokenpass.cloud",
    apiKeyUrl: "https://tokenpass.cloud",
    auth: codexAuth(),
    config: codexConfig("token-pass", "https://tokenpass.cloud/v1", "gpt-5.5"),
    endpointCandidates: ["https://tokenpass.cloud/v1"],
    category: "aggregator",
    isPartner: true,
    primePartner: true,
    partnerPromotionKey: "tokenpass",
    apiFormat: "openai_responses",
  },
];

export const geminiProviderPresets: GeminiProviderPreset[] = [
  {
    name: "Google Official",
    websiteUrl: "https://ai.google.dev/",
    apiKeyUrl: "https://aistudio.google.com/apikey",
    settingsConfig: {
      env: {},
    },
    description: "Google Gemini API",
    category: "official",
    partnerPromotionKey: "google-official",
    theme: {
      icon: "gemini",
      backgroundColor: "#4285F4",
      textColor: "#FFFFFF",
    },
    icon: "gemini",
    iconColor: "#4285F4",
  },
  {
    name: "Token Pass",
    nameKey: "providerForm.presets.tokenpass",
    websiteUrl: "https://tokenpass.cloud",
    apiKeyUrl: "https://tokenpass.cloud",
    settingsConfig: {
      env: {
        GOOGLE_GEMINI_BASE_URL: "https://tokenpass.cloud/v1beta",
        GEMINI_MODEL: "gemini-3.5-flash",
      },
    },
    baseURL: "https://tokenpass.cloud/v1beta",
    model: "gemini-3.5-flash",
    description: "Token Pass",
    category: "aggregator",
    isPartner: true,
    primePartner: true,
    partnerPromotionKey: "tokenpass",
    endpointCandidates: ["https://tokenpass.cloud/v1beta"],
  },
];

export const claudeDesktopProviderPresets: ClaudeDesktopProviderPreset[] = [
  {
    name: "Claude Desktop Official",
    websiteUrl: "https://claude.ai/download",
    category: "official",
    baseUrl: "",
    mode: "direct",
    apiFormat: "anthropic",
    theme: {
      icon: "claude",
      backgroundColor: "#D97757",
      textColor: "#FFFFFF",
    },
    icon: "anthropic",
    iconColor: "#D4915D",
  },
  {
    name: "Token Pass",
    nameKey: "providerForm.presets.tokenpass",
    websiteUrl: "https://tokenpass.cloud",
    apiKeyUrl: "https://tokenpass.cloud",
    category: "aggregator",
    baseUrl: "https://tokenpass.cloud",
    mode: "proxy",
    apiFormat: "anthropic",
    modelRoutes: claudeDesktopRoutes(
      "claude-sonnet-5",
      "claude-opus-4-8",
      "claude-haiku-4-5",
    ),
    isPartner: true,
    primePartner: true,
    partnerPromotionKey: "tokenpass",
    endpointCandidates: ["https://tokenpass.cloud"],
  },
];

export const opencodeProviderPresets: OpenCodeProviderPreset[] = [
  {
    name: "Token Pass",
    nameKey: "providerForm.presets.tokenpass",
    websiteUrl: "https://tokenpass.cloud",
    apiKeyUrl: "https://tokenpass.cloud",
    settingsConfig: {
      npm: "@ai-sdk/openai-compatible",
      name: "Token Pass",
      options: {
        baseURL: "https://tokenpass.cloud/v1",
        apiKey: "",
        setCacheKey: true,
      },
      models: {
        "gpt-5.5": { name: "GPT-5.5" },
      },
    },
    category: "aggregator",
    isPartner: true,
    primePartner: true,
    partnerPromotionKey: "tokenpass",
    templateValues: {
      apiKey: {
        label: "API Key",
        placeholder: "",
        editorValue: "",
      },
    },
  },
];

export const openclawProviderPresets: OpenClawProviderPreset[] = [
  {
    name: "Token Pass",
    nameKey: "providerForm.presets.tokenpass",
    websiteUrl: "https://tokenpass.cloud",
    apiKeyUrl: "https://tokenpass.cloud",
    settingsConfig: {
      baseUrl: "https://tokenpass.cloud/v1",
      apiKey: "",
      api: "openai-responses",
      models: [
        {
          id: "gpt-5.5",
          name: "GPT-5.5",
          contextWindow: 128000,
        },
      ],
    },
    category: "aggregator",
    isPartner: true,
    primePartner: true,
    partnerPromotionKey: "tokenpass",
    templateValues: {
      apiKey: {
        label: "API Key",
        placeholder: "",
        editorValue: "",
      },
    },
    suggestedDefaults: {
      model: {
        primary: "token-pass/gpt-5.5",
      },
      modelCatalog: {
        "token-pass/gpt-5.5": { alias: "GPT-5.5" },
      },
    },
  },
];

export const hermesProviderPresets: HermesProviderPreset[] = [
  {
    name: "Token Pass",
    nameKey: "providerForm.presets.tokenpass",
    websiteUrl: "https://tokenpass.cloud",
    apiKeyUrl: "https://tokenpass.cloud",
    settingsConfig: {
      name: "token-pass",
      base_url: "https://tokenpass.cloud/v1",
      api_key: "",
      api_mode: "chat_completions",
      models: [{ id: "gpt-5.5", name: "GPT-5.5" }],
    },
    category: "aggregator",
    isPartner: true,
    primePartner: true,
    partnerPromotionKey: "tokenpass",
    templateValues: {
      apiKey: {
        label: "API Key",
        placeholder: "",
        editorValue: "",
      },
    },
    suggestedDefaults: {
      model: { default: "gpt-5.5", provider: "token-pass" },
    },
  },
];
