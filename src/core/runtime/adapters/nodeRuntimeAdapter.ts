/**
 * Node Runtime Adapter
 *
 * Implementation of the RuntimeAdapter interface for Node environments.
 * Provides platform-specific implementations for HTTP, timers, and file operations
 * using Node built-in APIs.
 */

import type { RuntimeAdapter } from "../runtimeAdapter";
import type { PlatformInfo } from "../platformInfo";
import type { TimerHandle } from "../timerHandle";
import type { FileOperationOptions } from "../fileOperationOptions";
import type { McpConnectionOptions } from "../mcpConnectionOptions";
import type { McpConnection } from "../mcpConnection";
import { RuntimeError } from "../runtimeError";
import { getPlatformCapabilities } from "../getPlatformCapabilities";

/**
 * Node implementation of the RuntimeAdapter interface.
 *
 * Uses Node built-in modules for HTTP (global fetch), timers (built-in timers),
 * and file operations (fs/promises). Provides full platform capabilities for
 * Node environments.
 */
export class NodeRuntimeAdapter implements RuntimeAdapter {
  readonly platformInfo: PlatformInfo;

  constructor() {
    const capabilities = getPlatformCapabilities();
    this.platformInfo = {
      platform: "node",
      version: process.version,
      capabilities,
    };
  }

  // HTTP Operations
  async fetch(input: string | URL, init?: RequestInit): Promise<Response> {
    try {
      // Use global fetch (available in Node 18+)
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
      // Use global fetch to get the response
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

      // Return metadata + stream
      return {
        status: response.status,
        statusText: response.statusText,
        headers,
        stream: this.createAsyncIterable(
          response.body,
          init?.signal ?? undefined,
        ),
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

  private async *createAsyncIterable(
    stream: ReadableStream<Uint8Array>,
    signal?: AbortSignal,
  ): AsyncIterable<Uint8Array> {
    const reader = stream.getReader();

    try {
      while (true) {
        // Check for cancellation
        if (signal?.aborted) {
          throw new Error("Stream was aborted");
        }

        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        if (value) {
          yield value;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  // MCP Operations
  createMcpConnection(
    _serverUrl: string,
    _options?: McpConnectionOptions,
  ): Promise<McpConnection> {
    return Promise.reject(
      new RuntimeError(
        "MCP connection not yet implemented",
        "RUNTIME_NOT_IMPLEMENTED",
        {
          operation: "createMcpConnection",
          serverUrl: _serverUrl,
          options: _options,
        },
      ),
    );
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
      globalThis.clearTimeout(handle as NodeJS.Timeout);
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
      globalThis.clearInterval(handle as NodeJS.Timeout);
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

  // File Operations
  async readFile(
    path: string,
    options?: FileOperationOptions,
  ): Promise<string> {
    try {
      // Lazy load to prevent React Native bundle issues
      const { promises: fs } = await import("node:fs");
      const encoding = options?.encoding ?? "utf8";
      return await fs.readFile(path, { encoding });
    } catch (error) {
      throw new RuntimeError(
        `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_FILE_ERROR",
        {
          operation: "readFile",
          path,
          options,
          originalError: error,
        },
      );
    }
  }

  async writeFile(
    path: string,
    content: string,
    options?: FileOperationOptions,
  ): Promise<void> {
    try {
      // Lazy load to prevent React Native bundle issues
      const { promises: fs } = await import("node:fs");
      const encoding = options?.encoding ?? "utf8";

      // Create parent directories if requested
      if (options?.createDirectories) {
        const pathModule = await import("node:path");
        const dir = pathModule.dirname(path);
        await fs.mkdir(dir, { recursive: true });
      }

      await fs.writeFile(path, content, { encoding });
    } catch (error) {
      throw new RuntimeError(
        `Failed to write file: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_FILE_ERROR",
        {
          operation: "writeFile",
          path,
          contentLength: content.length,
          options,
          originalError: error,
        },
      );
    }
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      // Lazy load to prevent React Native bundle issues
      const { promises: fs } = await import("node:fs");
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}
