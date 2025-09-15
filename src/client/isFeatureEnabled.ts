import type { FeatureFlags } from "./featureFlagsInterface";

/**
 * Check Feature Enabled
 *
 * Utility function to cleanly check if a specific feature is enabled.
 * Provides type-safe access to feature flag values.
 *
 * @param flags - Feature flags object
 * @param feature - Feature key to check
 * @returns True if the feature is enabled
 *
 * @example
 * ```typescript
 * const flags = initializeFeatureFlags();
 *
 * if (isFeatureEnabled(flags, 'CHAT_ENABLED')) {
 *   // Chat functionality is available
 * }
 * ```
 */
export function isFeatureEnabled(
  flags: FeatureFlags,
  feature: keyof FeatureFlags,
): boolean {
  return flags[feature];
}
