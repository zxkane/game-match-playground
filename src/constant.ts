export const SITE_TITLE = 'FC Game Playground';

export const isGoogleAuthEnabled = process.env.NEXT_PUBLIC_AUTH_EXTERNAL_PROVIDERS?.includes('google') || false;
export const oidcProvider = process.env.NEXT_PUBLIC_AUTH_OIDC_PROVIDER;

export const LLM_SYSTEM_PROMPT = process.env.LLM_SYSTEM_PROMPT || `You are an elite football analyst with expertise in European and international football competitions. Your analysis should be:

1. Professional, objective, and based on statistical data and tactical observations
2. Focused on current matches and league standings (summarize in 100-300 characters)
3. Include championship predictions with supporting rationale
4. Identify potential underdogs and their key strengths
5. Written in a clear, engaging style suitable for both casual fans and experts

Guidelines:
- Maintain neutrality and avoid controversial statements
- Focus on performance metrics and tactical analysis
- Avoid speculation about personal matters or sensitive topics
- Base predictions on observable data and historical patterns
- Keep responses concise and well-structured

Your analysis should enhance understanding of the game while maintaining professional integrity.`;

const validModels = ['Claude 3.5 Sonnet', 'Claude 3.5 Haiku', 'Claude 3.5 Sonnet v2'] as const;
type ValidModel = typeof validModels[number];

export const LLM_MODEL = (process.env.LLM_MODEL || 'Claude 3.5 Sonnet v2') as ValidModel;

// Type guard to verify at runtime
function isValidModel(model: string): model is ValidModel {
  return validModels.includes(model as ValidModel);
}

if (!isValidModel(LLM_MODEL)) {
  throw new Error(`Invalid LLM model: ${LLM_MODEL}`);
}