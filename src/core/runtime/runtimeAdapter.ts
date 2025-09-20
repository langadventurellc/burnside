/**
 * Runtime Adapter Interface
 *
 * Main interface defining platform abstraction contracts for HTTP, timers,
 * and file operations. Enables consistent runtime operations across Node,
 * Electron, and React Native platforms.
 *
 * @example Basic usage
 * ```typescript
 * class MyAdapter implements RuntimeAdapter {
 *   readonly platformInfo = {
 *     platform: 'node' as const,
 *     capabilities: { hasHttp: true, hasTimers: true, hasFileSystem: true }
 *   };
 *
 *   async fetch(input: string, init?: RequestInit): Promise<Response> {
 *     return globalThis.fetch(input, init);
 *   }
 *
 *   // ... other methods
 * }
 * ```
 */

import type { PlatformInfo } from "./platformInfo";
import type { TimerHandle } from "./timerHandle";
import type { FileOperationOptions } from "./fileOperationOptions";

/**
 * Runtime adapter interface defining platform abstraction contracts.
 *
 * Provides a consistent interface for HTTP operations, timer operations,
 * and basic file access across different JavaScript runtime environments.
 */
export interface RuntimeAdapter {
  /** Platform information and capabilities */
  readonly platformInfo: PlatformInfo;

  // HTTP Operations
  /**
   * Perform HTTP fetch operation.
   * Abstracts platform-specific fetch implementations.
   *
   * @param input - URL or Request object
   * @param init - Request configuration options
   * @returns Promise resolving to Response object
   */
  fetch(input: string | URL, init?: RequestInit): Promise<Response>;

  /**
   * Perform HTTP streaming operation with metadata.
   * Platform-specific streaming fetch implementations that return both
   * HTTP response metadata and the streaming data.
   *
   * Returns complete HTTP response information including status, statusText,
   * headers, and the raw streaming content as an AsyncIterable. This enables
   * the transport layer to properly handle HTTP errors and access response
   * metadata while streaming the response body.
   *
   * The stream method supports cancellation via AbortSignal in the init.signal
   * parameter. When cancelled, the stream should stop producing data and clean
   * up any platform-specific resources (network connections, event listeners).
   *
   * Platform-specific behavior:
   * - Node.js: Uses standard fetch with Response.body stream conversion
   * - Electron: Uses appropriate fetch based on main/renderer process
   * - React Native: Integrates react-native-sse for SSE content, falls back to fetch
   *
   * @param input - URL or Request object for the streaming request
   * @param init - Request configuration options including optional AbortSignal
   * @returns Promise resolving to streaming response with HTTP metadata and stream
   *
   * @example Basic streaming usage
   * ```typescript
   * const streamResponse = await adapter.stream('https://api.example.com/stream', {
   *   method: 'POST',
   *   headers: { 'Accept': 'text/event-stream' },
   *   signal: abortController.signal
   * });
   *
   * console.log(`Status: ${streamResponse.status}`);
   * for await (const chunk of streamResponse.stream) {
   *   console.log(new TextDecoder().decode(chunk));
   * }
   * ```
   *
   * @example Error handling with metadata
   * ```typescript
   * const streamResponse = await adapter.stream(url, init);
   * if (streamResponse.status !== 200) {
   *   throw new Error(`HTTP ${streamResponse.status}: ${streamResponse.statusText}`);
   * }
   * // Process successful stream...
   * ```
   *
   * @example Cancellation support
   * ```typescript
   * const controller = new AbortController();
   * setTimeout(() => controller.abort(), 5000); // Cancel after 5s
   *
   * try {
   *   const stream = await adapter.stream(url, { signal: controller.signal });
   *   // Stream will be cancelled after 5 seconds
   * } catch (error) {
   *   if (error.name === 'AbortError') {
   *     console.log('Stream was cancelled');
   *   }
   * }
   * ```
   */
  stream(
    input: string | URL,
    init?: RequestInit,
  ): Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    stream: AsyncIterable<Uint8Array>;
  }>;

  // Timer Operations
  /**
   * Schedule a function to run after a delay.
   *
   * @param callback - Function to execute
   * @param ms - Delay in milliseconds
   * @returns Timer handle for cancellation
   */
  setTimeout(callback: () => void, ms: number): TimerHandle;

  /**
   * Schedule a function to run repeatedly at intervals.
   *
   * @param callback - Function to execute
   * @param ms - Interval in milliseconds
   * @returns Timer handle for cancellation
   */
  setInterval(callback: () => void, ms: number): TimerHandle;

  /**
   * Cancel a timeout created with setTimeout.
   *
   * @param handle - Timer handle returned by setTimeout
   */
  clearTimeout(handle: TimerHandle): void;

  /**
   * Cancel an interval created with setInterval.
   *
   * @param handle - Timer handle returned by setInterval
   */
  clearInterval(handle: TimerHandle): void;

  // File Operations
  /**
   * Read file contents as a string.
   *
   * @param path - File path to read
   * @param options - File operation options
   * @returns Promise resolving to file contents
   */
  readFile(path: string, options?: FileOperationOptions): Promise<string>;

  /**
   * Write string content to a file.
   *
   * @param path - File path to write
   * @param content - Content to write
   * @param options - File operation options
   * @returns Promise resolving when write completes
   */
  writeFile(
    path: string,
    content: string,
    options?: FileOperationOptions,
  ): Promise<void>;

  /**
   * Check if a file exists.
   *
   * @param path - File path to check
   * @returns Promise resolving to true if file exists
   */
  fileExists(path: string): Promise<boolean>;
}
