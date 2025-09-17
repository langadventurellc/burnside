import { ValidationError } from "../../../core/errors/validationError";
import { validateApiKey } from "./validateApiKey";
import type { GoogleTestConfig } from "./googleTestConfigInterface";

export function loadGoogleTestConfig(): GoogleTestConfig {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  if (!googleApiKey) {
    throw new ValidationError(
      "GOOGLE_API_KEY environment variable is required for Google E2E tests",
    );
  }

  if (!validateApiKey(googleApiKey, "google")) {
    throw new ValidationError(
      "GOOGLE_API_KEY must be a valid Google API key format",
    );
  }

  const testEnabled = process.env.E2E_TEST_ENABLED === "true";
  if (!testEnabled) {
    throw new ValidationError(
      'E2E_TEST_ENABLED must be set to "true" to run E2E tests',
    );
  }

  return {
    googleApiKey,
    testEnabled,
    testModel: process.env.E2E_GOOGLE_MODEL || "google:gemini-2.0-flash-lite",
    timeout: 30000,
  };
}
