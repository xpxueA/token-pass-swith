import type {
  CodexApiFormat,
  CodexCatalogModel,
  CodexChatReasoning,
  ProviderCategory,
} from "../types";
import type { PresetTheme } from "./claudeProviderPresets";

export interface CodexProviderPreset {
  name: string;
  nameKey?: string;
  websiteUrl: string;
  apiKeyUrl?: string;
  auth: Record<string, any>;
  config: string;
  isOfficial?: boolean;
  isPartner?: boolean;
  primePartner?: boolean;
  partnerPromotionKey?: string;
  category?: ProviderCategory;
  isCustomTemplate?: boolean;
  endpointCandidates?: string[];
  theme?: PresetTheme;
  icon?: string;
  iconColor?: string;
  apiFormat?: CodexApiFormat;
  modelCatalog?: CodexCatalogModel[];
  codexChatReasoning?: CodexChatReasoning;
}

export const codexProviderPresets: CodexProviderPreset[] = [];
