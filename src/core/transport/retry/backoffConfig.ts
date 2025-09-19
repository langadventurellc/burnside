/**
 * Configuration interface for backoff timing strategies
 */
export interface BackoffConfig {
  /** The backoff strategy type to use */
  strategy: "exponential" | "linear";
  /** Base delay in milliseconds for the first retry attempt */
  baseDelayMs: number;
  /** Maximum delay in milliseconds (cap for all calculations) */
  maxDelayMs: number;
  /** Whether to apply jitter (50-150% randomization) */
  jitter: boolean;
  /** Multiplier for exponential backoff (default: 2) */
  multiplier?: number;
}
