/**
 * Test Fixtures Index
 *
 * Central export point for all OpenAI Responses v1 test fixtures.
 * Provides organized access to fixtures for contract testing and integration validation.
 */

// Non-streaming response fixtures
export * from "./nonStreamingResponses.js";

// Streaming event fixtures
export * from "./streamingEvents.js";

// Error response fixtures
export * from "./errorResponses.js";

// Request example fixtures
export * from "./requestExamples.js";

/**
 * Complete fixture collection for convenience
 */
export const fixtures = {
  // Re-export organized fixture collections
  nonStreamingResponses: import("./nonStreamingResponses.js"),
  streamingEvents: import("./streamingEvents.js"),
  errorResponses: import("./errorResponses.js"),
  requestExamples: import("./requestExamples.js"),
} as const;
