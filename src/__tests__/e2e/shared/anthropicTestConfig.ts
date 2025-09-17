import { ValidationError } from "../../../core/errors/validationError.js";
import { validateApiKey } from "./validateApiKey.js";
import type { AnthropicTestConfig } from "./anthropicTestConfigInterface.js";

export function loadAnthropicTestConfig(): AnthropicTestConfig {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    throw new ValidationError(
      "ANTHROPIC_API_KEY environment variable is required for Anthropic E2E tests",
    );
  }

  if (!validateApiKey(anthropicApiKey, "anthropic")) {
    throw new ValidationError(
      "ANTHROPIC_API_KEY must be a valid Anthropic API key format",
    );
  }

  const testEnabled = process.env.E2E_TEST_ENABLED === "true";
  if (!testEnabled) {
    throw new ValidationError(
      'E2E_TEST_ENABLED must be set to "true" to run E2E tests',
    );
  }

  return {
    anthropicApiKey,
    testEnabled,
    testModel:
      process.env.E2E_ANTHROPIC_MODEL || "anthropic:claude-3-5-haiku-latest",
    timeout: 30000,
  };
}
