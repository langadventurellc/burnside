/**
 * Runtime Adapter Interface
 *
 * Main interface defining platform abstraction contracts for HTTP, timers,
 * and file operations. Enables consistent runtime operations across Node.js,
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

import type { PlatformInfo } from "./platformInfo.js";
import type { TimerHandle } from "./timerHandle.js";
import type { FileOperationOptions } from "./fileOperationOptions.js";

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
