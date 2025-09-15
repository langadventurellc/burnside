/**
 * Provider information summary for registry listing operations
 *
 * Contains metadata about a registered provider plugin including
 * identification, timing, and basic information without exposing
 * sensitive configuration details.
 */
export interface ProviderInfo {
  /** Unique identifier for the provider */
  readonly id: string;
  /** Human-readable name of the provider */
  readonly name: string;
  /** Version string of the provider plugin */
  readonly version: string;
  /** Timestamp when the provider was registered */
  readonly registeredAt: Date;
}
