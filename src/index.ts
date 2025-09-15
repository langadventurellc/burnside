/**
 * LLM Bridge Library
 *
 * A unified bridge to multiple LLM provider APIs for use across
 * Desktop (Electron), Mobile (React Native), and Web (Node.js) platforms.
 *
 * This is the main public API surface entry point providing the createClient
 * factory function and related types for chat and streaming functionality.
 *
 * @example
 * ```typescript
 * import { createClient } from "@llm-bridge/library";
 *
 * const client = createClient({
 *   defaultProvider: "openai",
 *   providers: {
 *     openai: { apiKey: "sk-..." }
 *   },
 *   defaultModel: "gpt-4"
 * });
 *
 * // Phase 2+ functionality (currently throws FEATURE_DISABLED)
 * const response = await client.chat({
 *   messages: [{ role: "user", content: [{ type: "text", text: "Hello!" }] }],
 *   model: "gpt-4"
 * });
 * ```
 */

// Main client factory function and class (Phase 1)
export { createClient } from "./createClient";
export { BridgeClient } from "./client";

// Request and response types for chat and streaming
export type { ChatRequest, StreamRequest, StreamDelta } from "./client";

// Configuration types
export type { BridgeClientConfig } from "./client";
export type { BridgeConfig } from "./core/config/bridgeConfig";

// Core message types for public consumption
export type { Message } from "./core/messages/message";
export type { ContentPart } from "./core/messages/contentPart";
export type { Role } from "./core/messages/role";
export type { SourceRef } from "./core/messages/sourceRef";

// Error types for error handling
export { BridgeError } from "./core/errors/bridgeError";

// Feature flag system (for advanced usage)
export type { FeatureFlags, FeatureFlagOverrides } from "./client";
export { initializeFeatureFlags, isFeatureEnabled } from "./client";

// TODO: Export provider registration interfaces when implemented (Phase 1)
// TODO: Export model registry interfaces when implemented (Phase 1)
