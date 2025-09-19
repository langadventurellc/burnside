/**
 * Result of rate limiting behavior validation
 */
export interface RateLimitValidationResult {
  /** Whether the timing validates rate limiting behavior */
  valid: boolean;
  /** Actual requests per second measured */
  actualRps: number;
  /** Descriptive message about the validation result */
  message: string;
}
