import type { ProviderCategory } from "../types";
import type { PresetTheme } from "./claudeProviderPresets";

export type ClaudeDesktopApiFormat =
  | "anthropic"
  | "openai_chat"
  | "openai_responses"
  | "gemini_native";

export interface ClaudeDesktopRoutePreset {
  routeId: string;
  upstreamModel: string;
  labelOverride?: string;
  supports1m: boolean;
}

export const CLAUDE_DESKTOP_ROLE_ROUTE_IDS = {
  sonnet: "claude-sonnet-5",
  opus: "claude-opus-4-8",
  fable: "claude-fable-5",
  haiku: "claude-haiku-4-5",
} as const;

export type ClaudeDesktopRoleId = keyof typeof CLAUDE_DESKTOP_ROLE_ROUTE_IDS;

export interface ClaudeDesktopProviderPreset {
  name: string;
  nameKey?: string;
  websiteUrl: string;
  apiKeyUrl?: string;
  category?: ProviderCategory;
  isPartner?: boolean;
  primePartner?: boolean;
  partnerPromotionKey?: string;
  baseUrl: string;
  apiKeyField?: "ANTHROPIC_AUTH_TOKEN" | "ANTHROPIC_API_KEY";
  mode: "direct" | "proxy";
  apiFormat?: ClaudeDesktopApiFormat;
  modelRoutes?: ClaudeDesktopRoutePreset[];
  providerType?: "github_copilot" | "codex_oauth";
  requiresOAuth?: boolean;
  endpointCandidates?: string[];
  theme?: PresetTheme;
  icon?: string;
  iconColor?: string;
}

export const claudeDesktopProviderPresets: ClaudeDesktopProviderPreset[] = [];
