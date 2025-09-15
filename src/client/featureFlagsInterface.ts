/**
 * Feature Flags Interface
 *
 * Defines the feature flags available for controlling library functionality.
 * Used for progressive enablement of features during development phases.
 *
 * @example
 * ```typescript
 * const flags: FeatureFlags = {
 *   CHAT_ENABLED: false,
 *   STREAMING_ENABLED: false,
 *   TOOLS_ENABLED: false
 * };
 * ```
 */
export interface FeatureFlags {
  /** Enable chat completion functionality */
  CHAT_ENABLED: boolean;
  /** Enable streaming response functionality */
  STREAMING_ENABLED: boolean;
  /** Enable tool execution functionality */
  TOOLS_ENABLED: boolean;
}
