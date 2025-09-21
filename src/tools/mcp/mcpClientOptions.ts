/**
 * MCP Client Options Interface
 *
 * Configuration interface for MCP client initialization and connection management.
 * Extends the base McpConnectionOptions with client-specific settings for retry
 * behavior, health monitoring, and capability negotiation.
 *
 * @example Basic client options
 * ```typescript
 * const options: McpClientOptions = {
 *   maxRetries: 3,
 *   healthCheckInterval: 30000,
 *   capabilityTimeout: 5000,
 *   signal: controller.signal
 * };
 *
 * const client = new McpClient(adapter, serverUrl, options);
 * ```
 */

import type { McpConnectionOptions } from "../../core/runtime/mcpConnectionOptions";

/**
 * Configuration options for MCP client initialization and operation.
 *
 * Extends McpConnectionOptions with client-specific settings for connection
 * lifecycle management, retry behavior, health monitoring, and capability
 * negotiation timeouts.
 */
export interface McpClientOptions extends McpConnectionOptions {
  /**
   * Maximum number of reconnection attempts when connection is lost.
   *
   * When a connection fails or is lost, the client will attempt to reconnect
   * using exponential backoff. This setting controls the maximum number of
   * retry attempts before giving up.
   *
   * @default 3
   *
   * @example
   * ```typescript
   * const options = { maxRetries: 5 }; // Try 5 times before giving up
   * const client = new McpClient(adapter, serverUrl, options);
   * ```
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds for exponential backoff retry strategy.
   *
   * The first retry will wait this amount of time, with subsequent retries
   * doubling the delay (with jitter) up to the maximum delay.
   *
   * @default 1000
   *
   * @example
   * ```typescript
   * const options = { baseRetryDelay: 2000 }; // Start with 2 second delay
   * const client = new McpClient(adapter, serverUrl, options);
   * ```
   */
  baseRetryDelay?: number;

  /**
   * Maximum delay in milliseconds for exponential backoff retry strategy.
   *
   * Caps the exponential backoff delay to prevent extremely long waits
   * between retry attempts.
   *
   * @default 30000
   *
   * @example
   * ```typescript
   * const options = { maxRetryDelay: 60000 }; // Cap at 60 seconds
   * const client = new McpClient(adapter, serverUrl, options);
   * ```
   */
  maxRetryDelay?: number;

  /**
   * Interval in milliseconds for connection health checks.
   *
   * The client will periodically check the connection status and attempt
   * reconnection if the connection is lost. Set to 0 to disable health checks.
   *
   * @default 30000
   *
   * @example
   * ```typescript
   * const options = { healthCheckInterval: 60000 }; // Check every minute
   * const client = new McpClient(adapter, serverUrl, options);
   * ```
   */
  healthCheckInterval?: number;

  /**
   * Timeout in milliseconds for capability negotiation.
   *
   * Maximum time to wait for the MCP server to respond to capability
   * negotiation requests during connection establishment.
   *
   * @default 5000
   *
   * @example
   * ```typescript
   * const options = { capabilityTimeout: 10000 }; // 10 second timeout
   * const client = new McpClient(adapter, serverUrl, options);
   * ```
   */
  capabilityTimeout?: number;

  /**
   * Logging level override for MCP-specific operations.
   *
   * Controls the verbosity of MCP client logging. Can be used to enable
   * debug logging for MCP operations while keeping other logging at a
   * different level.
   *
   * @default 'info'
   *
   * @example
   * ```typescript
   * const options = { logLevel: 'debug' }; // Verbose MCP logging
   * const client = new McpClient(adapter, serverUrl, options);
   * ```
   */
  logLevel?: "debug" | "info" | "warn" | "error";

  /**
   * Whether to enable jitter in exponential backoff retry strategy.
   *
   * Adds randomization to retry delays to prevent thundering herd effects
   * when multiple clients reconnect simultaneously.
   *
   * @default true
   *
   * @example
   * ```typescript
   * const options = { retryJitter: false }; // Disable jitter
   * const client = new McpClient(adapter, serverUrl, options);
   * ```
   */
  retryJitter?: boolean;

  /**
   * Optional callback invoked when the MCP client successfully connects.
   *
   * Use this to register tools or perform other setup tasks that depend
   * on an active MCP connection. The callback is called after capability
   * negotiation completes successfully.
   *
   * @example
   * ```typescript
   * const options = {
   *   onConnect: async () => {
   *     console.log('MCP server connected');
   *     await registry.registerMcpTools();
   *   }
   * };
   * ```
   */
  onConnect?: () => Promise<void> | void;

  /**
   * Optional callback invoked when the MCP client disconnects.
   *
   * Use this to cleanup tools or handle connection loss scenarios.
   * The callback is called when the connection is lost or explicitly
   * disconnected.
   *
   * @example
   * ```typescript
   * const options = {
   *   onDisconnect: async () => {
   *     console.log('MCP server disconnected');
   *     await registry.unregisterMcpTools();
   *   }
   * };
   * ```
   */
  onDisconnect?: () => Promise<void> | void;
}
