/**
 * Jest Global Setup for E2E Tests
 *
 * Runs once before all E2E tests to validate environment setup
 * and ensure proper configuration for provider API testing.
 */

import { validateApiKey } from "../shared/validateApiKey";

export default function globalSetup(): void {
  console.log("🔧 Initializing E2E Test Environment");

  // Detect which provider tests are running based on test pattern
  const testPattern =
    process.env.JEST_TEST_PATH_PATTERN || process.argv.join(" ");
  const isRunningAnthropicTests = testPattern.includes("anthropic");
  const isRunningOpenAITests =
    testPattern.includes("openai") || !isRunningAnthropicTests;

  // Validate E2E test enablement (required for all providers)
  if (process.env.E2E_TEST_ENABLED !== "true") {
    throw new Error(
      'E2E_TEST_ENABLED must be set to "true" to run E2E tests. ' +
        "This ensures E2E tests only run when explicitly requested.",
    );
  }

  // Validate OpenAI environment when running OpenAI tests
  if (isRunningOpenAITests) {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error(
        "OPENAI_API_KEY environment variable is required for OpenAI E2E tests. " +
          "Please check your .env file or environment configuration.",
      );
    }
    if (!validateApiKey(openaiApiKey, "openai")) {
      throw new Error(
        "OPENAI_API_KEY must be a valid OpenAI API key (starts with sk- and minimum 20 characters). " +
          "Please verify your API key format.",
      );
    }
    console.log("✅ OpenAI Environment Validated");
  }

  // Validate Anthropic environment when running Anthropic tests
  if (isRunningAnthropicTests) {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY environment variable is required for Anthropic E2E tests. " +
          "Please check your .env file or environment configuration.",
      );
    }
    if (!validateApiKey(anthropicApiKey, "anthropic")) {
      throw new Error(
        "ANTHROPIC_API_KEY must be a valid Anthropic API key (starts with sk-ant- and minimum 20 characters). " +
          "Please verify your API key format.",
      );
    }
    console.log("✅ Anthropic Environment Validated");
  }

  console.log("✅ E2E Test Environment Initialized Successfully");
}
