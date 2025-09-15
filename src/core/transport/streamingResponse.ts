/**
 * Streaming Response Interface
 *
 * Interface for handling streaming HTTP responses from provider APIs.
 * Provides metadata about the response along with an async iterable
 * stream of data chunks for efficient processing of large responses.
 *
 * @example Processing a streaming response
 * ```typescript
 * const streamingResponse: StreamingResponse = {
 *   status: 200,
 *   statusText: "OK",
 *   headers: { "content-type": "text/event-stream" },
 *   stream: (async function* () {
 *     yield new Uint8Array([65, 66, 67]); // ABC
 *   })()
 * };
 *
 * for await (const chunk of streamingResponse.stream) {
 *   // Process each chunk as it arrives
 *   console.log(new TextDecoder().decode(chunk));
 * }
 * ```
 */

/**
 * Streaming response interface for handling chunked data from provider APIs.
 *
 * @property status - HTTP status code from the response
 * @property statusText - HTTP status text from the response
 * @property headers - Response headers as key-value pairs
 * @property stream - Async iterable stream of data chunks
 */
export interface StreamingResponse {
  /** HTTP status code from the response */
  status: number;

  /** HTTP status text from the response */
  statusText: string;

  /** Response headers as key-value pairs */
  headers: Record<string, string>;

  /** Async iterable stream of data chunks */
  stream: AsyncIterable<Uint8Array>;
}
