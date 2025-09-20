/**
 * React Native Runtime Adapter
 *
 * Implementation of the RuntimeAdapter interface for React Native environments.
 * Uses React Native's fetch API for HTTP operations and built-in timer functions.
 * File operations are not supported and will throw errors. Streaming support
 * is available via the react-native-sse library.
 */

import type { RuntimeAdapter } from "../runtimeAdapter";
import type { PlatformInfo } from "../platformInfo";
import type { TimerHandle } from "../timerHandle";
import type { FileOperationOptions } from "../fileOperationOptions";
import { RuntimeError } from "../runtimeError";
import { getPlatformCapabilities } from "../getPlatformCapabilities";

/**
 * React Native implementation of the RuntimeAdapter interface.
 *
 * Uses React Native's global fetch API for HTTP operations and built-in timers.
 * File operations are not supported in React Native and will throw RuntimeError
 * with appropriate error messages. Streaming is supported via react-native-sse.
 */
export class ReactNativeRuntimeAdapter implements RuntimeAdapter {
  readonly platformInfo: PlatformInfo;

  constructor() {
    const capabilities = getPlatformCapabilities();
    this.platformInfo = {
      platform: "react-native",
      version: "react-native",
      capabilities,
    };
  }

  // HTTP Operations
  async fetch(input: string | URL, init?: RequestInit): Promise<Response> {
    try {
      // Use React Native's fetch implementation
      return await globalThis.fetch(input, init);
    } catch (error) {
      throw new RuntimeError(
        `HTTP fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_HTTP_ERROR",
        {
          input: input.toString(),
          init,
          originalError: error,
        },
      );
    }
  }

  async stream(
    input: string | URL,
    init?: RequestInit,
  ): Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    stream: AsyncIterable<Uint8Array>;
  }> {
    try {
      // Note: This is a basic implementation using fetch.
      // Future enhancement will integrate react-native-sse for SSE content
      // with lazy loading to prevent bundle issues when library is not available.

      // Use React Native's fetch to get the response
      const response = await globalThis.fetch(input, init);

      // Extract headers into a plain object
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Convert response body to AsyncIterable
      if (!response.body) {
        throw new RuntimeError(
          "Response body is null for streaming request",
          "RUNTIME_HTTP_ERROR",
          {
            input: input.toString(),
            init,
          },
        );
      }

      // Create AsyncIterable from ReadableStream
      // TODO: Add react-native-sse integration for text/event-stream content-type
      const stream: AsyncIterable<Uint8Array> = {
        async *[Symbol.asyncIterator]() {
          const reader = response.body!.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              yield value;
            }
          } finally {
            reader.releaseLock();
          }
        },
      };

      return {
        status: response.status,
        statusText: response.statusText,
        headers,
        stream,
      };
    } catch (error) {
      throw new RuntimeError(
        `HTTP stream failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_HTTP_ERROR",
        {
          input: input.toString(),
          init,
          originalError: error,
        },
      );
    }
  }

  // Timer Operations
  setTimeout(callback: () => void, ms: number): TimerHandle {
    try {
      return globalThis.setTimeout(callback, ms);
    } catch (error) {
      throw new RuntimeError(
        `Failed to set timeout: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_TIMER_ERROR",
        {
          operation: "setTimeout",
          delay: ms,
          originalError: error,
        },
      );
    }
  }

  setInterval(callback: () => void, ms: number): TimerHandle {
    try {
      return globalThis.setInterval(callback, ms);
    } catch (error) {
      throw new RuntimeError(
        `Failed to set interval: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_TIMER_ERROR",
        {
          operation: "setInterval",
          interval: ms,
          originalError: error,
        },
      );
    }
  }

  clearTimeout(handle: TimerHandle): void {
    try {
      globalThis.clearTimeout(handle as number);
    } catch (error) {
      throw new RuntimeError(
        `Failed to clear timeout: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_TIMER_ERROR",
        {
          operation: "clearTimeout",
          handle,
          originalError: error,
        },
      );
    }
  }

  clearInterval(handle: TimerHandle): void {
    try {
      globalThis.clearInterval(handle as number);
    } catch (error) {
      throw new RuntimeError(
        `Failed to clear interval: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_TIMER_ERROR",
        {
          operation: "clearInterval",
          handle,
          originalError: error,
        },
      );
    }
  }

  // File Operations (Not Supported)
  readFile(path: string, options?: FileOperationOptions): Promise<string> {
    return Promise.reject(
      new RuntimeError(
        "File operations not supported on this platform",
        "RUNTIME_FILE_ERROR",
        {
          operation: "readFile",
          path,
          options,
          platform: "react-native",
        },
      ),
    );
  }

  writeFile(
    path: string,
    content: string,
    options?: FileOperationOptions,
  ): Promise<void> {
    return Promise.reject(
      new RuntimeError(
        "File operations not supported on this platform",
        "RUNTIME_FILE_ERROR",
        {
          operation: "writeFile",
          path,
          contentLength: content.length,
          options,
          platform: "react-native",
        },
      ),
    );
  }

  fileExists(path: string): Promise<boolean> {
    return Promise.reject(
      new RuntimeError(
        "File operations not supported on this platform",
        "RUNTIME_FILE_ERROR",
        {
          operation: "fileExists",
          path,
          platform: "react-native",
        },
      ),
    );
  }
}
