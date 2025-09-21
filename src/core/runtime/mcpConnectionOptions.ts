/**
 * MCP Connection Options Interface
 *
 * Configuration options for establishing MCP (Model Context Protocol) connections.
 * Follows the RequestInit pattern used by existing fetch operations to maintain
 * consistency with the runtime adapter system.
 *
 * @example Basic usage
 * ```typescript
 * const options: McpConnectionOptions = {
 *   signal: controller.signal,
 *   timeout: 30000,
 *   headers: { 'User-Agent': 'MyApp/1.0' }
 * };
 *
 * const connection = await adapter.createMcpConnection('http://localhost:3000', options);
 * ```
 *
 * @example Connection with cancellation
 * ```typescript
 * const controller = new AbortController();
 * setTimeout(() => controller.abort(), 10000); // Cancel after 10s
 *
 * const options: McpConnectionOptions = {
 *   signal: controller.signal
 * };
 *
 * try {
 *   const connection = await adapter.createMcpConnection(serverUrl, options);
 * } catch (error) {
 *   if (error.name === 'AbortError') {
 *     console.log('Connection was cancelled');
 *   }
 * }
 * ```
 */

/**
 * Options for configuring MCP connection establishment.
 *
 * Provides connection parameters including cancellation support via AbortSignal,
 * timeout configuration, and custom headers. Follows the same pattern as
 * RequestInit to maintain consistency with existing runtime adapter methods.
 */
export interface McpConnectionOptions {
  /**
   * AbortSignal for cancelling the connection operation.
   *
   * When the signal is aborted, the connection establishment will be cancelled
   * and any resources will be cleaned up. This follows the same pattern as
   * the existing fetch and stream methods in RuntimeAdapter.
   *
   * @example
   * ```typescript
   * const controller = new AbortController();
   * const options = { signal: controller.signal };
   *
   * // Cancel connection after 5 seconds
   * setTimeout(() => controller.abort(), 5000);
   *
   * const connection = await adapter.createMcpConnection(url, options);
   * ```
   */
  signal?: AbortSignal;

  /**
   * Connection timeout in milliseconds.
   *
   * Maximum time to wait for the connection to be established before
   * timing out. If not specified, uses platform-specific default timeouts.
   *
   * @default Platform-specific default (typically 30000ms)
   *
   * @example
   * ```typescript
   * const options = { timeout: 15000 }; // 15 second timeout
   * const connection = await adapter.createMcpConnection(url, options);
   * ```
   */
  timeout?: number;

  /**
   * Custom headers to include in the connection request.
   *
   * Additional HTTP headers to send during connection establishment.
   * Useful for authentication, user agents, or other connection metadata.
   *
   * @example
   * ```typescript
   * const options = {
   *   headers: {
   *     'Authorization': 'Bearer token123',
   *     'User-Agent': 'MyMcpClient/1.0'
   *   }
   * };
   * const connection = await adapter.createMcpConnection(url, options);
   * ```
   */
  headers?: Record<string, string>;
}
