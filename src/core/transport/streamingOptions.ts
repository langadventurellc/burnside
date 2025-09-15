/**
 * Streaming Options Interface
 *
 * Configuration options for streaming HTTP responses.
 * Provides hints and settings for optimizing streaming performance
 * and behavior without implementing the actual streaming logic.
 *
 * @example Basic streaming options
 * ```typescript
 * const options: StreamingOptions = {
 *   bufferSizeHint: 8192,
 *   timeoutMs: 30000,
 *   signal: controller.signal
 * };
 * ```
 */

/**
 * Configuration options for streaming HTTP responses.
 *
 * @property bufferSizeHint - Suggested buffer size for streaming in bytes
 * @property timeoutMs - Timeout for streaming operations in milliseconds
 * @property signal - Optional AbortSignal for cancelling the stream
 */
export interface StreamingOptions {
  /** Suggested buffer size for streaming in bytes */
  bufferSizeHint?: number;

  /** Timeout for streaming operations in milliseconds */
  timeoutMs?: number;

  /** Optional AbortSignal for cancelling the stream */
  signal?: AbortSignal;
}
