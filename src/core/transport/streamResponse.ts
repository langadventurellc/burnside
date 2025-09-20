/**
 * Stream Response Interface
 *
 * Interface for handling streaming HTTP responses that preserves both
 * HTTP response metadata and the raw stream content. This interface is
 * designed to fix the current streaming architecture where HTTP metadata
 * (status, headers, statusText) is lost when returning only the stream.
 *
 * This interface will be used by the transport layer to return both the
 * response metadata and the raw stream content, allowing providers to
 * access the full HTTP response information for proper error handling
 * and response validation.
 *
 * @example Using StreamResponse for HTTP transport
 * ```typescript
 * const streamResponse: StreamResponse = {
 *   status: 200,
 *   statusText: "OK",
 *   headers: {
 *     "content-type": "text/event-stream",
 *     "cache-control": "no-cache"
 *   },
 *   stream: (async function* () {
 *     yield new Uint8Array([100, 97, 116, 97, 58]); // "data:"
 *     yield new Uint8Array([32, 72, 101, 108, 108, 111]); // " Hello"
 *   })()
 * };
 *
 * // Access both metadata and stream
 * console.log(`Status: ${streamResponse.status}`);
 * for await (const chunk of streamResponse.stream) {
 *   console.log(new TextDecoder().decode(chunk));
 * }
 * ```
 */

/**
 * Response object for streaming HTTP requests that preserves both
 * HTTP metadata and the raw stream content.
 *
 * @property status - HTTP status code (200, 404, 500, etc.)
 * @property statusText - HTTP status text ("OK", "Not Found", etc.)
 * @property headers - Response headers as key-value pairs
 * @property stream - Raw response body as async iterable stream
 */
export interface StreamResponse {
  /** HTTP status code (200, 404, 500, etc.) */
  status: number;

  /** HTTP status text ("OK", "Not Found", etc.) */
  statusText: string;

  /** Response headers as key-value pairs */
  headers: Record<string, string>;

  /** Raw response body as async iterable stream */
  stream: AsyncIterable<Uint8Array>;
}
