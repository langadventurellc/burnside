/**
 * Feature Flag Override Options
 *
 * Optional overrides for feature flags during testing or development.
 * Allows selective enabling of features for validation purposes.
 */
export interface FeatureFlagOverrides {
  /** Override chat functionality flag */
  chatEnabled?: boolean;
  /** Override streaming functionality flag */
  streamingEnabled?: boolean;
  /** Override tools functionality flag */
  toolsEnabled?: boolean;
}
