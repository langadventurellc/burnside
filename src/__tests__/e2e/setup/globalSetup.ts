/**
 * Jest Global Setup for E2E Tests
 *
 * Runs once before all E2E tests to validate environment setup
 * and ensure proper configuration for OpenAI API testing.
 */

export default function globalSetup(): void {
  console.log("🔧 Initializing E2E Test Environment");

  // Validate required environment variables
  const requiredVars = ["OPENAI_API_KEY", "E2E_TEST_ENABLED"];
  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        `Please check your .env file or environment configuration.`,
    );
  }

  // Validate API key format
  const apiKey = process.env.OPENAI_API_KEY!;
  if (!apiKey.startsWith("sk-") || apiKey.length < 20) {
    throw new Error(
      "OPENAI_API_KEY must be a valid OpenAI API key (starts with sk- and minimum 20 characters). " +
        "Please verify your API key format.",
    );
  }

  // Validate E2E test enablement
  if (process.env.E2E_TEST_ENABLED !== "true") {
    throw new Error(
      'E2E_TEST_ENABLED must be set to "true" to run E2E tests. ' +
        "This ensures E2E tests only run when explicitly requested.",
    );
  }

  console.log("✅ E2E Test Environment Initialized Successfully");
}
