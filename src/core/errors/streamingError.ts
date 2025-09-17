/**
 * Streaming Error Class
 *
 * Error class for streaming-related failures.
 * Used when streaming operations fail due to connection issues,
 * parsing errors, or stream termination problems.
 *
 * @example
 * ```typescript
 * const error = new StreamingError("Stream interrupted", {
 *   provider: "anthropic",
 *   bytesReceived: 1024,
 *   expectedChunks: 5,
 *   receivedChunks: 3
 * });
 * ```
 */
import { BridgeError } from "./bridgeError";

export class StreamingError extends BridgeError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "STREAMING_ERROR", context);
  }
}
