/**
 * Error Context Interface
 *
 * Context information for error normalization and handling.
 * Provides additional metadata about the error scenario to help
 * with proper error categorization and debugging.
 *
 * @example
 * ```typescript
 * const context: ErrorContext = {
 *   requestId: "req_abc123",
 *   timestamp: new Date(),
 *   provider: "openai",
 *   operation: "chat_completion",
 *   model: "gpt-4",
 *   attempt: 1,
 *   url: "https://api.openai.com/v1/chat/completions"
 * };
 * ```
 */
export interface ErrorContext {
  /** Unique identifier for the request that failed */
  requestId?: string;
  /** Timestamp when the error occurred */
  timestamp?: Date;
  /** Name of the provider where the error occurred */
  provider?: string;
  /** Type of operation that was being performed */
  operation?: string;
  /** Model being used when the error occurred */
  model?: string;
  /** Attempt number for retried requests */
  attempt?: number;
  /** URL that was being accessed when the error occurred */
  url?: string;
  /** Additional custom context properties */
  [key: string]: unknown;
}
