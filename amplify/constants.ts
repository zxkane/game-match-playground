import type { AuthConfig, LLMConfig, AllowedModel } from '../src/types/config';

export const authConfig: AuthConfig = {
  isGoogleAuthEnabled: process.env.GOOGLE_AUTH_ENABLED === 'true',
  oidcProvider: process.env.AUTH_OIDC_PROVIDER || process.env.NEXT_PUBLIC_AUTH_OIDC_PROVIDER
};

export const llmConfig: LLMConfig = {
  model: (process.env.LLM_MODEL as AllowedModel) || "Claude 3.5 Sonnet",
  systemPrompt: process.env.LLM_SYSTEM_PROMPT || '',
  footballPrompt: process.env.FOOTBALL_SYSTEM_PROMPT || '',
  customModelId: process.env.CUSTOM_MODEL_ID,
  crossRegionInference: process.env.CROSS_REGION_INFERENCE === 'true'
};

// Destructure for easier access
export const { isGoogleAuthEnabled, oidcProvider } = authConfig;
export const { 
  model: LLM_MODEL,
  systemPrompt: LLM_SYSTEM_PROMPT,
  footballPrompt: FOOTBALL_SYSTEM_PROMPT,
  customModelId: CUSTOM_MODEL_ID,
  crossRegionInference: CROSS_REGION_INFERENCE
} = llmConfig;