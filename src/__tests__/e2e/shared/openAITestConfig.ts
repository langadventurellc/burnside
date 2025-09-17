import { ValidationError } from "../../../core/errors/validationError.js";
import { validateApiKey } from "./validateApiKey.js";
import type { TestConfig } from "./openAITestConfigInterface.js";

export function loadTestConfig(): TestConfig {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new ValidationError(
      "OPENAI_API_KEY environment variable is required for E2E tests",
    );
  }

  if (!validateApiKey(openaiApiKey, "openai")) {
    throw new ValidationError(
      "OPENAI_API_KEY must be a valid OpenAI API key format",
    );
  }

  const testEnabled = process.env.E2E_TEST_ENABLED === "true";
  if (!testEnabled) {
    throw new ValidationError(
      'E2E_TEST_ENABLED must be set to "true" to run E2E tests',
    );
  }

  return {
    openaiApiKey,
    testEnabled,
    testModel: process.env.E2E_OPENAI_MODEL || "openai:gpt-4.1-nano-2025-04-14",
    timeout: 30000,
  };
}
