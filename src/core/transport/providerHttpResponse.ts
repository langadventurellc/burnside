/**
 * Provider HTTP Response Interface
 *
 * HTTP response interface for provider API responses.
 *
 * Represents the response from an HTTP request to a provider API.
 * Compatible with the modern fetch API Response interface while providing
 * a simplified, consistent structure across all platforms.
 *
 * @example Handling a successful response
 * ```typescript
 * const response: ProviderHttpResponse = {
 *   status: 200,
 *   statusText: "OK",
 *   headers: { "content-type": "application/json" },
 *   body: new ReadableStream()
 * };
 * ```
 *
 * @example Handling an error response
 * ```typescript
 * const errorResponse: ProviderHttpResponse = {
 *   status: 429,
 *   statusText: "Too Many Requests",
 *   headers: { "retry-after": "60" },
 *   body: null
 * };
 * ```
 */

/**
 * HTTP response interface for provider API responses.
 *
 * @property status - HTTP status code (200, 404, 500, etc.)
 * @property statusText - HTTP status text ("OK", "Not Found", etc.)
 * @property headers - Response headers as key-value pairs
 * @property body - Response body as readable stream or null if empty
 */
export interface ProviderHttpResponse {
  /** HTTP status code (200, 404, 500, etc.) */
  status: number;

  /** HTTP status text ("OK", "Not Found", etc.) */
  statusText: string;

  /** Response headers as key-value pairs */
  headers: Record<string, string>;

  /** Response body as readable stream or null if empty */
  body: ReadableStream<Uint8Array> | null;
}
