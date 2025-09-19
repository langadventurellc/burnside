/**
 * Rate Limiting E2E Test Helpers
 *
 * Barrel export for all rate limiting test utilities that provide
 * shared infrastructure for validating rate limiting behavior across
 * all LLM providers (OpenAI, Anthropic, Google, xAI).
 *
 * Main exports:
 * - createRateLimitedTestClient: Creates BridgeClient with rate limiting configuration
 * - validateRateLimitingBehavior: Validates request timing follows rate limits
 * - measureRequestTiming: Executes multiple requests and captures timing
 * - createMinimalTestRequest: Creates smallest possible valid request for each provider
 * - RateLimitingProvider: Type definition for supported providers
 * - RateLimitValidationResult: Interface for validation results
 */

export { createRateLimitedTestClient } from "./createRateLimitedTestClient";
export { validateRateLimitingBehavior } from "./validateRateLimitingBehavior";
export { measureRequestTiming } from "./measureRequestTiming";
export { createMinimalTestRequest } from "./createMinimalTestRequest";
export type { RateLimitingProvider } from "./rateLimitingProvider";
export type { RateLimitValidationResult } from "./rateLimitValidationResult";
