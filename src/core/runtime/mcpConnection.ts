/**
 * MCP Connection Interface
 *
 * Defines the interface for MCP (Model Context Protocol) connections that enable
 * JSON-RPC 2.0 communication with MCP servers. Provides methods for making
 * requests, sending notifications, and managing connection lifecycle.
 *
 * @example Basic request/response
 * ```typescript
 * const connection = await adapter.createMcpConnection('http://localhost:3000');
 *
 * // Make a JSON-RPC request
 * const result = await connection.call('tools/list');
 * console.log('Available tools:', result.tools);
 *
 * // Send a notification (no response expected)
 * await connection.notify('client/ready');
 *
 * // Check connection status
 * if (connection.isConnected) {
 *   console.log('Connected to MCP server');
 * }
 *
 * // Clean up
 * await connection.close();
 * ```
 *
 * @example Error handling
 * ```typescript
 * try {
 *   const result = await connection.call('invalid/method');
 * } catch (error) {
 *   if (error.code === -32601) {
 *     console.log('Method not found');
 *   }
 * }
 * ```
 *
 * @example Type-safe requests
 * ```typescript
 * interface ToolListResponse {
 *   tools: Array<{ name: string; description: string }>;
 * }
 *
 * const result = await connection.call<ToolListResponse>('tools/list');
 * // result is typed as ToolListResponse
 * result.tools.forEach(tool => console.log(tool.name));
 * ```
 */

/**
 * Represents an active MCP connection for JSON-RPC 2.0 communication.
 *
 * Provides methods for making JSON-RPC requests and notifications to an MCP server,
 * along with connection lifecycle management. All operations support proper error
 * handling and follow JSON-RPC 2.0 specification.
 */
export interface McpConnection {
  /**
   * Current connection status.
   *
   * Indicates whether the connection is currently active and able to send
   * requests. This property is updated automatically based on connection state.
   *
   * @readonly
   */
  readonly isConnected: boolean;

  /**
   * Make a JSON-RPC 2.0 request and wait for response.
   *
   * Sends a JSON-RPC request to the MCP server and returns the result.
   * Supports generic typing for response data and proper error propagation
   * according to JSON-RPC 2.0 specification.
   *
   * @template T - Expected response type
   * @param method - JSON-RPC method name to call
   * @param params - Optional parameters to send with the request
   * @returns Promise resolving to the response result
   *
   * @throws {Error} JSON-RPC error responses (code, message, data)
   * @throws {Error} Network or protocol errors
   *
   * @example Simple request
   * ```typescript
   * const result = await connection.call('tools/list');
   * console.log(result);
   * ```
   *
   * @example Request with parameters
   * ```typescript
   * const result = await connection.call('tools/call', {
   *   name: 'calculator',
   *   arguments: { operation: 'add', a: 1, b: 2 }
   * });
   * ```
   *
   * @example Type-safe request
   * ```typescript
   * interface ToolResult {
   *   success: boolean;
   *   result: unknown;
   * }
   *
   * const result = await connection.call<ToolResult>('tools/call', params);
   * if (result.success) {
   *   console.log('Tool succeeded:', result.result);
   * }
   * ```
   */
  call<T = unknown>(method: string, params?: unknown): Promise<T>;

  /**
   * Send a JSON-RPC 2.0 notification (no response expected).
   *
   * Sends a JSON-RPC notification to the MCP server. Notifications do not
   * expect a response and are used for one-way communication like status
   * updates or events.
   *
   * @param method - JSON-RPC method name for the notification
   * @param params - Optional parameters to send with the notification
   * @returns Promise resolving when notification is sent
   *
   * @throws {Error} Network or connection errors
   *
   * @example Simple notification
   * ```typescript
   * await connection.notify('client/ready');
   * ```
   *
   * @example Notification with parameters
   * ```typescript
   * await connection.notify('client/progress', {
   *   operation: 'processing',
   *   percentage: 50
   * });
   * ```
   */
  notify(method: string, params?: unknown): Promise<void>;

  /**
   * Close the MCP connection and clean up resources.
   *
   * Terminates the connection to the MCP server and performs necessary cleanup.
   * After calling close(), the connection should not be used for further
   * operations. The isConnected property will be updated to false.
   *
   * @returns Promise resolving when connection is closed and cleanup is complete
   *
   * @example Graceful shutdown
   * ```typescript
   * try {
   *   // Send final notification before closing
   *   await connection.notify('client/disconnecting');
   * } finally {
   *   await connection.close();
   * }
   * ```
   *
   * @example Cleanup in error handler
   * ```typescript
   * try {
   *   await connection.call('some/method');
   * } catch (error) {
   *   console.error('Request failed:', error);
   *   await connection.close();
   * }
   * ```
   */
  close(): Promise<void>;
}
