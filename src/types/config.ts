export interface AuthConfig {
  isGoogleAuthEnabled: boolean;
  oidcProvider: string | undefined;
  adminOnlySignUp: boolean;
}

export type AllowedModel = 
  | "Claude 3.5 Haiku" 
  | "Claude 3.5 Sonnet" 
  | "Claude 3.5 Sonnet v2";

export interface LLMConfig {
  model: AllowedModel;
  systemPrompt: string;
  footballPrompt: string;
  customModelId: string | undefined;
  crossRegionInference: boolean;
} 