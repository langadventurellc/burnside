/**
 * Electron Renderer Runtime Adapter
 *
 * Implementation of the RuntimeAdapter interface for Electron renderer processes.
 * Uses browser-standard APIs available in the Electron renderer context for HTTP
 * and timer operations. File operations are not supported and will throw errors.
 */

import type { RuntimeAdapter } from "../runtimeAdapter";
import type { PlatformInfo } from "../platformInfo";
import type { TimerHandle } from "../timerHandle";
import type { FileOperationOptions } from "../fileOperationOptions";
import { RuntimeError } from "../runtimeError";
import { getPlatformCapabilities } from "../getPlatformCapabilities";

/**
 * Electron renderer implementation of the RuntimeAdapter interface.
 *
 * Uses browser-standard APIs for HTTP (global fetch) and timers (built-in timers).
 * File operations are not supported in the renderer process and will throw
 * RuntimeError with appropriate error messages.
 */
export class ElectronRuntimeAdapter implements RuntimeAdapter {
  readonly platformInfo: PlatformInfo;

  constructor() {
    const capabilities = getPlatformCapabilities();
    this.platformInfo = {
      platform: "electron-renderer",
      version: process.versions.electron,
      capabilities,
    };
  }

  // HTTP Operations
  async fetch(input: string | URL, init?: RequestInit): Promise<Response> {
    try {
      // Use global fetch (available in Electron renderer)
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
      // Use global fetch (available in Electron renderer)
      const response = await globalThis.fetch(input, init);

      // Extract HTTP metadata
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Validate response has body
      const body = response.body;
      if (!body) {
        throw new RuntimeError(
          "Response body is empty for streaming request",
          "RUNTIME_HTTP_ERROR",
          {
            status: response.status,
            statusText: response.statusText,
            platform: "electron-renderer",
          },
        );
      }

      // Return metadata + stream
      return {
        status: response.status,
        statusText: response.statusText,
        headers,
        stream: this.createAsyncIterable(body, init?.signal ?? undefined),
      };
    } catch (error) {
      throw new RuntimeError(
        `HTTP stream failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        "RUNTIME_HTTP_ERROR",
        {
          input: input.toString(),
          init,
          platform: "electron-renderer",
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
          platform: "electron-renderer",
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
          platform: "electron-renderer",
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
          platform: "electron-renderer",
        },
      ),
    );
  }
}
