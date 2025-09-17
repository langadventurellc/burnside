import { ValidationError } from "../../../core/errors/validationError";

export function validateApiKey(apiKey: string, provider: string): boolean {
  switch (provider) {
    case "openai":
      // OpenAI API key format validation (starts with sk-, minimum length)
      return apiKey.startsWith("sk-") && apiKey.length >= 20;
    case "anthropic":
      // Anthropic API key format validation (starts with sk-ant-, minimum length)
      return apiKey.startsWith("sk-ant-") && apiKey.length >= 20;
    case "google":
      // Google API key format validation (starts with AIza, exactly 39 characters)
      return apiKey.startsWith("AIza") && apiKey.length === 39;
    default:
      throw new ValidationError(
        `Unsupported provider for API key validation: ${provider}`,
      );
  }
}
