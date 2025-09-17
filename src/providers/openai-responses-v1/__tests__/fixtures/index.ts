/**
 * Test Fixtures Index
 *
 * Central export point for all OpenAI Responses v1 test fixtures.
 * Provides organized access to fixtures for contract testing and integration validation.
 */

// Non-streaming response fixtures
export * from "./nonStreamingResponses";

// Streaming event fixtures
export * from "./streamingEvents";

// Error response fixtures
export * from "./errorResponses";

// Request example fixtures
export * from "./requestExamples";

/**
 * Complete fixture collection for convenience
 */
export const fixtures = {
  // Re-export organized fixture collections
  nonStreamingResponses: import("./nonStreamingResponses"),
  streamingEvents: import("./streamingEvents"),
  errorResponses: import("./errorResponses"),
  requestExamples: import("./requestExamples"),
} as const;
