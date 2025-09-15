/**
 * Client Module
 *
 * This module provides the primary public API for the LLM Bridge Library,
 * including the BridgeClient class and related types for chat and streaming
 * functionality with feature flag controls.
 *
 * @example
 * ```typescript
 * import { BridgeClient } from "@llm-bridge/client";
 *
 * const client = new BridgeClient({
 *   defaultProvider: "openai",
 *   providers: { openai: { apiKey: "sk-..." } }
 * });
 * ```
 */

// Main client class
export { BridgeClient } from "./bridgeClient";

// Request and response types
export type { ChatRequest } from "./chatRequest";
export type { StreamRequest } from "./streamRequest";
export type { StreamDelta } from "./streamDelta";

// Configuration types
export type { BridgeClientConfig } from "./bridgeClientConfig";

// Feature flag system
export type { FeatureFlags } from "./featureFlagsInterface";
export type { FeatureFlagOverrides } from "./featureFlagOverrides";
export { initializeFeatureFlags } from "./initializeFeatureFlags";
export { isFeatureEnabled } from "./isFeatureEnabled";
