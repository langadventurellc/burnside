import { ValidationError } from "../../../core/errors/validationError.js";

export function validateApiKey(apiKey: string, provider: string): boolean {
  switch (provider) {
    case "openai":
      // OpenAI API key format validation (starts with sk-, minimum length)
      return apiKey.startsWith("sk-") && apiKey.length >= 20;
    default:
      throw new ValidationError(
        `Unsupported provider for API key validation: ${provider}`,
      );
  }
}
