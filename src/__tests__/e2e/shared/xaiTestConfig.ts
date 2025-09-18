import { ValidationError } from "../../../core/errors/validationError";
import { validateApiKey } from "./validateApiKey";
import { XaiTestConfig } from "./xaiTestConfigInterface";

export function loadXaiTestConfig(): XaiTestConfig {
  const xaiApiKey = process.env.XAI_API_KEY;
  if (!xaiApiKey) {
    throw new ValidationError(
      "XAI_API_KEY environment variable is required for E2E tests",
    );
  }

  if (!validateApiKey(xaiApiKey, "xai")) {
    throw new ValidationError("XAI_API_KEY must be a valid xAI API key format");
  }

  const testEnabled = process.env.E2E_TEST_ENABLED === "true";
  if (!testEnabled) {
    throw new ValidationError(
      'E2E_TEST_ENABLED must be set to "true" to run E2E tests',
    );
  }

  return {
    xaiApiKey,
    testEnabled,
    testModel: process.env.E2E_XAI_MODEL || "xai:grok-3-mini",
    timeout: 30000,
  };
}
