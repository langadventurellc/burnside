/**
 * Fetch Function Type
 *
 * Type alias for fetch implementations that can be injected into HTTP clients.
 * Compatible with both Node.js fetch and browser fetch APIs, enabling
 * platform-agnostic HTTP operations with custom fetch implementations.
 *
 * @example Using Node.js fetch
 * ```typescript
 * import { fetch } from 'node-fetch';
 * const fetchFn: FetchFunction = fetch;
 * ```
 *
 * @example Using browser fetch
 * ```typescript
 * const fetchFn: FetchFunction = window.fetch.bind(window);
 * ```
 */

/**
 * Type alias for fetch function implementations.
 *
 * Matches the standard fetch API signature with input, init options,
 * and Promise return type. Supports request cancellation through
 * AbortSignal in the init options.
 */
export type FetchFunction = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;
