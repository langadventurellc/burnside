/**
 * HTTP Method Type
 *
 * Supported HTTP methods for provider API communication.
 * Limited to standard REST operations commonly used by LLM providers.
 *
 * @example
 * ```typescript
 * const method: HttpMethod = "POST";
 * ```
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";
