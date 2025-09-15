import type { FeatureFlags } from "./featureFlagsInterface";
import type { FeatureFlagOverrides } from "./featureFlagOverrides";

/**
 * Initialize Feature Flags
 *
 * Creates the default feature flag configuration for Phase 1.
 * All features are disabled by default, with optional overrides
 * for testing and development purposes.
 *
 * @param overrides - Optional feature flag overrides
 * @returns Initialized feature flags object
 *
 * @example
 * ```typescript
 * // Default Phase 1 configuration (all disabled)
 * const defaultFlags = initializeFeatureFlags();
 *
 * // Development configuration with chat enabled
 * const devFlags = initializeFeatureFlags({
 *   chatEnabled: true
 * });
 * ```
 */
export function initializeFeatureFlags(
  overrides?: FeatureFlagOverrides,
): FeatureFlags {
  return {
    CHAT_ENABLED: overrides?.chatEnabled ?? false,
    STREAMING_ENABLED: overrides?.streamingEnabled ?? false,
    TOOLS_ENABLED: overrides?.toolsEnabled ?? false,
  };
}
