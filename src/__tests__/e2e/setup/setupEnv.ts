/**
 * Jest Setup Environment for E2E Tests
 *
 * Runs once per test file to ensure environment validation
 * and provide test-specific environment configuration.
 */

import { ValidationError } from "../../../core/errors/validationError";
import { validateApiKey } from "../shared/validateApiKey";

// This file runs via setupFilesAfterEnv for each test file
// Global setup runs once before all tests
// setupEnv runs once per test file
// Use this for test-specific environment configuration

function validateProviderEnvironment(testPath: string): void {
  // Validate E2E test enablement (required for all providers)
  if (process.env.E2E_TEST_ENABLED !== "true") {
    throw new ValidationError(
      "E2E_TEST_ENABLED must be set to 'true' to run E2E tests",
      {
        variable: "E2E_TEST_ENABLED",
        expectedValue: "true",
        actualValue: process.env.E2E_TEST_ENABLED,
        context: "E2E test environment setup",
      },
    );
  }

  // Determine provider based on test path
  if (testPath.includes("anthropic")) {
    // Validate Anthropic environment
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      throw new ValidationError(
        "ANTHROPIC_API_KEY environment variable is required for Anthropic E2E tests",
        {
          variable: "ANTHROPIC_API_KEY",
          context: "E2E test environment setup",
          provider: "anthropic",
        },
      );
    }

    if (!validateApiKey(anthropicApiKey, "anthropic")) {
      throw new ValidationError(
        "ANTHROPIC_API_KEY must be a valid Anthropic API key format",
        {
          variable: "ANTHROPIC_API_KEY",
          expectedFormat: "sk-ant-* with minimum 20 characters",
          context: "E2E test environment setup",
          provider: "anthropic",
        },
      );
    }
  } else if (testPath.includes("google")) {
    // Validate Google environment
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      throw new ValidationError(
        "GOOGLE_API_KEY environment variable is required for Google E2E tests",
        {
          variable: "GOOGLE_API_KEY",
          context: "E2E test environment setup",
          provider: "google",
        },
      );
    }

    if (!validateApiKey(googleApiKey, "google")) {
      throw new ValidationError(
        "GOOGLE_API_KEY must be a valid Google API key format",
        {
          variable: "GOOGLE_API_KEY",
          expectedFormat: "AIza* with exactly 39 characters",
          context: "E2E test environment setup",
          provider: "google",
        },
      );
    }
  } else {
    // Default to OpenAI validation for non-Anthropic tests
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new ValidationError(
        "OPENAI_API_KEY environment variable is required for OpenAI E2E tests",
        {
          variable: "OPENAI_API_KEY",
          context: "E2E test environment setup",
          provider: "openai",
        },
      );
    }

    if (!validateApiKey(openaiApiKey, "openai")) {
      throw new ValidationError(
        "OPENAI_API_KEY must be a valid OpenAI API key format",
        {
          variable: "OPENAI_API_KEY",
          expectedFormat: "sk-* with minimum 20 characters",
          context: "E2E test environment setup",
          provider: "openai",
        },
      );
    }
  }
}

// Validate environment for each test file
beforeEach(() => {
  const testPath = expect.getState().testPath || "";
  validateProviderEnvironment(testPath);
});
