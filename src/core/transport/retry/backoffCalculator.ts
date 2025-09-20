/**
 * Interface for calculating retry delays
 */
export interface BackoffCalculator {
  /**
   * Calculate delay for given attempt number (0-based)
   * @param attempt - The retry attempt number (0 = first retry)
   * @returns Delay in milliseconds
   */
  calculateDelay(attempt: number): number;

  /**
   * Reset internal state if needed (stateless implementations may be no-op)
   */
  reset(): void;
}
