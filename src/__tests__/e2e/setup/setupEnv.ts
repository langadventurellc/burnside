/**
 * Jest Setup Environment for E2E Tests
 *
 * Runs once per test file to ensure environment validation
 * and provide test-specific environment configuration.
 */

import { ValidationError } from "../../../core/errors/validationError.js";

// This file runs via setupFilesAfterEnv for each test file
// Global setup runs once before all tests
// setupEnv runs once per test file
// Use this for test-specific environment configuration

// Validate environment is properly configured for each test file
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new ValidationError(
    "OPENAI_API_KEY environment variable is required for E2E tests",
    {
      variable: "OPENAI_API_KEY",
      context: "E2E test environment setup",
    },
  );
}

if (!apiKey.startsWith("sk-") || apiKey.length < 20) {
  throw new ValidationError(
    "OPENAI_API_KEY must be a valid OpenAI API key format",
    {
      variable: "OPENAI_API_KEY",
      expectedFormat: "sk-* with minimum 20 characters",
      context: "E2E test environment setup",
    },
  );
}

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
